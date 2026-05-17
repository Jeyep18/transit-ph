from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, authentication_classes, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from .models import Admin, TransportMode, Station, Route, RouteStation, FareMatrix
from .serializers import (
    AdminSerializer, AdminCreateSerializer, LoginSerializer,
    TransportModeSerializer,
    StationSerializer, StationListSerializer,
    RouteSerializer, RouteListSerializer,
    RouteStationSerializer, RouteStationWriteSerializer,
    FareMatrixSerializer,
)
from .authentication import (
    JWTAuthentication, generate_token, verify_password,
)
from .services.route_finder import find_routes, sort_results, find_nearest_stations
from .services.fare_calculator import get_active_fare_matrix
from .services.geocoder import search_osm_locations
from .services.graph_router import active_loop_polylines, find_graph_route


# ─── Permission Helpers ──────────────────────────────────────────────────────

class IsAdminAuthenticated(permissions.BasePermission):
    """Only allow requests with a valid JWT for an active admin."""
    def has_permission(self, request, view):
        return (
            request.user is not None
            and isinstance(request.user, Admin)
            and request.user.is_active
        )


# ─── Auth Endpoints ──────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate an admin and return a JWT."""
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    username = serializer.validated_data['username']
    password = serializer.validated_data['password']

    try:
        admin = Admin.objects.get(username=username, is_active=True)
    except Admin.DoesNotExist:
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not verify_password(password, admin.password_hash):
        return Response(
            {'error': 'Invalid username or password.'},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Update last login
    admin.last_login_at = timezone.now()
    # Use update() to avoid triggering full_clean which may fail on auto_now fields
    Admin.objects.filter(pk=admin.pk).update(last_login_at=timezone.now())

    token = generate_token(admin)
    return Response({
        'token': token,
        'admin': AdminSerializer(admin).data,
    })


@api_view(['GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminAuthenticated])
def me_view(request):
    """Return the currently authenticated admin's profile."""
    return Response(AdminSerializer(request.user).data)


@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAdminAuthenticated])
def logout_view(request):
    """
    Logout endpoint. Since JWT is stateless, the client simply
    discards the token. This endpoint exists for API completeness.
    """
    return Response({'detail': 'Logged out successfully.'})


# ─── Transport Mode ──────────────────────────────────────────────────────────

class TransportModeViewSet(viewsets.ModelViewSet):
    queryset = TransportMode.objects.all()
    serializer_class = TransportModeSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminAuthenticated()]

    def perform_update(self, serializer):
        instance = self.get_object()
        is_active = serializer.validated_data.get('is_active', instance.is_active)
        if instance.is_active and not is_active and not instance.can_deactivate():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                'is_active': 'Transport mode cannot be deactivated while active routes use it.'
            })
        serializer.save()


# ─── Station ─────────────────────────────────────────────────────────────────

class StationViewSet(viewsets.ModelViewSet):
    queryset = Station.objects.all().order_by('name')
    authentication_classes = [JWTAuthentication]

    def get_serializer_class(self):
        if self.action == 'list':
            return StationListSerializer
        return StationSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()

        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        # Filter by station type
        station_type = self.request.query_params.get('station_type')
        if station_type:
            qs = qs.filter(station_type=station_type)

        # Search by name
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)

        return qs

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        """BR-SYS-08: Soft-delete instead of hard delete."""
        instance.is_active = False
        instance.updated_by = self.request.user
        # Use update to skip full_clean (which may reject proximity check against itself)
        Station.objects.filter(pk=instance.pk).update(
            is_active=False, updated_by=self.request.user,
        )


# ─── Route ───────────────────────────────────────────────────────────────────

class RouteViewSet(viewsets.ModelViewSet):
    queryset = Route.objects.all().select_related(
        'transport_mode', 'origin_station', 'terminal_station',
    ).prefetch_related('routestation_set__station').order_by('route_code')
    authentication_classes = [JWTAuthentication]

    def get_serializer_class(self):
        if self.action == 'list':
            return RouteListSerializer
        return RouteSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search) | qs.filter(route_code__icontains=search)

        return qs

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        """BR-SYS-08: Soft-delete."""
        Route.objects.filter(pk=instance.pk).update(
            is_active=False, updated_by=self.request.user,
        )


# ─── Route Stations ──────────────────────────────────────────────────────────

class RouteStationViewSet(viewsets.ModelViewSet):
    serializer_class = RouteStationSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminAuthenticated()]

    def get_queryset(self):
        route_pk = self.kwargs.get('route_pk')
        return RouteStation.objects.filter(
            route_id=route_pk,
        ).select_related('station').order_by('sequence_order')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RouteStationWriteSerializer
        return RouteStationSerializer

    def perform_create(self, serializer):
        route_pk = self.kwargs.get('route_pk')
        serializer.save(route_id=route_pk, updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        """
        Remove a station from a route and close sequence gaps afterwards.
        BR-RSA-07 requires gap-free ordering after station deletion.
        """
        route_id = instance.route_id
        deleted_order = instance.sequence_order
        instance.delete()
        remaining = RouteStation.objects.filter(
            route_id=route_id,
            sequence_order__gt=deleted_order,
        ).order_by('sequence_order')
        for rs in remaining:
            RouteStation.objects.filter(pk=rs.pk).update(
                sequence_order=rs.sequence_order - 1,
                updated_by=self.request.user,
            )

    @action(detail=False, methods=['post'], url_path='reorder')
    def reorder(self, request, route_pk=None):
        """
        Bulk reorder stations in a route.
        Expects: { "order": [station_id_1, station_id_2, ...] }
        """
        order = request.data.get('order', [])
        if not order:
            return Response(
                {'error': 'Please provide an "order" list of station IDs.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        route_stations = RouteStation.objects.filter(route_id=route_pk)
        station_map = {rs.station_id: rs for rs in route_stations}

        for idx, station_id in enumerate(order, start=1):
            rs = station_map.get(station_id)
            if rs:
                rs.sequence_order = idx
                rs.updated_by = request.user
                # Bypass full_clean during reorder to avoid sequence conflicts mid-batch
                RouteStation.objects.filter(pk=rs.pk).update(
                    sequence_order=idx, updated_by=request.user,
                )

        return Response({'detail': 'Stations reordered successfully.'})


# ─── Fare Matrix ─────────────────────────────────────────────────────────────

class FareMatrixViewSet(viewsets.ModelViewSet):
    queryset = FareMatrix.objects.all().select_related(
        'transport_mode',
    ).order_by('-effective_date')
    serializer_class = FareMatrixSerializer
    authentication_classes = [JWTAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()

        transport_mode = self.request.query_params.get('transport_mode')
        if transport_mode:
            qs = qs.filter(transport_mode_id=transport_mode)

        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            qs = qs.filter(is_active=is_active.lower() == 'true')

        return qs

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)


# ─── Public Search Endpoint ──────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def search_routes_view(request):
    """
    Search for routes between two stations.

    POST body:
    {
        "origin_station_id": 1,          // OR "origin_lat" + "origin_lng"
        "destination_station_id": 5,     // OR "dest_lat" + "dest_lng"
        "sort_by": "fare",               // "fare" | "transfers" | "distance"
    }
    """
    origin_station_id = request.data.get('origin_station_id')
    dest_station_id = request.data.get('destination_station_id')
    sort_by = request.data.get('sort_by', 'fare')

    origin_lat = request.data.get('origin_lat')
    origin_lng = request.data.get('origin_lng')
    dest_lat = request.data.get('dest_lat')
    dest_lng = request.data.get('dest_lng')

    # Revised public routing: arbitrary OSM coordinates use graph/Dijkstra.
    if origin_lat and origin_lng and dest_lat and dest_lng:
        try:
            result = find_graph_route(
                float(origin_lat),
                float(origin_lng),
                float(dest_lat),
                float(dest_lng),
            )
        except ValueError:
            return Response(
                {'error': 'Coordinates must be valid numbers.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(result)
    if sort_by == 'shortest_time':
        sort_by = 'time'
    if sort_by not in ['fare', 'transfers', 'distance', 'time']:
        return Response(
            {'error': 'sort_by must be one of: fare, transfers, distance, time.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # If coordinates provided instead of station IDs, find nearest stations
    if not origin_station_id:
        origin_lat = request.data.get('origin_lat')
        origin_lng = request.data.get('origin_lng')
        if origin_lat and origin_lng:
            nearest = find_nearest_stations(
                float(origin_lat), float(origin_lng),
                station_type='JEEPNEY_STOP',
            )
            if nearest:
                origin_station_id = nearest[0]['station_id']
            else:
                return Response(
                    {'error': 'No stations found near the origin location.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

    if not dest_station_id:
        dest_lat = request.data.get('dest_lat')
        dest_lng = request.data.get('dest_lng')
        if dest_lat and dest_lng:
            nearest = find_nearest_stations(
                float(dest_lat), float(dest_lng),
                station_type='JEEPNEY_STOP',
            )
            if nearest:
                dest_station_id = nearest[0]['station_id']
            else:
                return Response(
                    {'error': 'No stations found near the destination location.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

    if not origin_station_id or not dest_station_id:
        return Response(
            {'error': 'Please provide origin and destination (station IDs or coordinates).'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        origin_station_id = int(origin_station_id)
        dest_station_id = int(dest_station_id)
    except (TypeError, ValueError):
        return Response(
            {'error': 'Station IDs must be valid integers.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if origin_station_id == dest_station_id:
        return Response(
            {'error': 'Origin and destination cannot be the same station.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    stations = Station.objects.filter(
        station_id__in=[origin_station_id, dest_station_id],
        is_active=True,
        station_type='JEEPNEY_STOP',
    )
    if stations.count() != 2:
        return Response(
            {'error': 'Origin and destination must be active Jeepney Stops.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    results = find_routes(origin_station_id, dest_station_id)
    results = sort_results(results, sort_by)

    return Response({
        'origin_station_id': origin_station_id,
        'destination_station_id': dest_station_id,
        'sort_by': sort_by,
        'result_count': len(results),
        'results': results,
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def nearby_stations_view(request):
    """
    Find stations near a given coordinate.
    GET /api/stations/nearby/?lat=13.6218&lng=123.1948&radius=1.0&type=JEEPNEY_STOP
    """
    lat = request.query_params.get('lat')
    lng = request.query_params.get('lng')
    radius = float(request.query_params.get('radius', 1.0))
    station_type = request.query_params.get('type')
    limit = int(request.query_params.get('limit', 10))

    if not lat or not lng:
        return Response(
            {'error': 'lat and lng query parameters are required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    results = find_nearest_stations(
        float(lat), float(lng),
        radius_km=radius,
        station_type=station_type,
        limit=limit,
    )
    return Response({'stations': results})


# ─── Public Fare Info Endpoint ────────────────────────────────────────────────

@api_view(['GET'])
@permission_classes([AllowAny])
def active_fare_matrix_view(request):
    """Return the currently active fare matrix for each transport mode."""
    matrices = FareMatrix.objects.filter(is_active=True).select_related('transport_mode')
    serializer = FareMatrixSerializer(matrices, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def geocode_search_view(request):
    query = request.query_params.get('q', '').strip()
    if len(query) < 3:
        return Response({'results': []})

    return Response({'results': search_osm_locations(query)})


@api_view(['GET'])
@permission_classes([AllowAny])
def active_jeepney_loops_view(request):
    """Return active jeepney loop polylines for public map visualization."""
    return Response({'loops': active_loop_polylines()})
