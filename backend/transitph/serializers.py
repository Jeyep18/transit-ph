from rest_framework import serializers
from .models import (
    Admin,
    FareMatrix,
    GraphEdge,
    GraphNode,
    JeepneyLoop,
    JeepneyLoopEdge,
    Route,
    RouteStation,
    Station,
    TransportMode,
)


# ─── Admin ────────────────────────────────────────────────────────────────────

class AdminSerializer(serializers.ModelSerializer):
    """Read-only admin representation (never exposes password_hash)."""
    class Meta:
        model = Admin
        fields = ['id', 'username', 'email', 'is_active', 'created_at', 'last_login_at']
        read_only_fields = fields


class AdminCreateSerializer(serializers.ModelSerializer):
    """Used when an existing admin creates a new admin account."""
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = Admin
        fields = ['id', 'username', 'email', 'password', 'is_active']
        read_only_fields = ['id']

    def validate_password(self, value):
        """BR-ADM-03: min 8 chars, 1 uppercase, 1 lowercase, 1 digit."""
        if not any(c.isupper() for c in value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not any(c.islower() for c in value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError('Password must contain at least one digit.')
        return value

    def create(self, validated_data):
        import bcrypt
        password = validated_data.pop('password')
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        return Admin.objects.create(password_hash=hashed, **validated_data)


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()


# ─── Transport Mode ───────────────────────────────────────────────────────────

class TransportModeSerializer(serializers.ModelSerializer):
    can_deactivate = serializers.SerializerMethodField()

    class Meta:
        model = TransportMode
        fields = ['transport_mode_id', 'name', 'code', 'description', 'is_active', 'can_deactivate']
        read_only_fields = ['transport_mode_id', 'can_deactivate']

    def get_can_deactivate(self, obj):
        return obj.can_deactivate()


# ─── Station ──────────────────────────────────────────────────────────────────

class StationSerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True, default=None)

    class Meta:
        model = Station
        fields = [
            'station_id', 'name', 'station_type', 'latitude', 'longitude',
            'address', 'is_active', 'created_at', 'updated_at',
            'updated_by', 'updated_by_username',
        ]
        read_only_fields = ['station_id', 'created_at', 'updated_at', 'updated_by_username']

    def validate(self, data):
        """Run model-level validation (coordinate ranges + 50m proximity)."""
        instance = self.instance
        # Build a temporary instance for validation
        station = Station(
            pk=instance.pk if instance else None,
            name=data.get('name', getattr(instance, 'name', '')),
            station_type=data.get('station_type', getattr(instance, 'station_type', 'JEEPNEY_STOP')),
            latitude=data.get('latitude', getattr(instance, 'latitude', 0)),
            longitude=data.get('longitude', getattr(instance, 'longitude', 0)),
            address=data.get('address', getattr(instance, 'address', None)),
            is_active=data.get('is_active', getattr(instance, 'is_active', True)),
        )
        station.clean()
        return data


class StationListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for dropdowns and search results."""
    class Meta:
        model = Station
        fields = ['station_id', 'name', 'station_type', 'latitude', 'longitude', 'is_active']


# ─── Route Station ────────────────────────────────────────────────────────────

class RouteStationSerializer(serializers.ModelSerializer):
    station_name = serializers.CharField(source='station.name', read_only=True)
    station_type = serializers.CharField(source='station.station_type', read_only=True)
    latitude = serializers.DecimalField(source='station.latitude', max_digits=9, decimal_places=6, read_only=True)
    longitude = serializers.DecimalField(source='station.longitude', max_digits=9, decimal_places=6, read_only=True)

    class Meta:
        model = RouteStation
        fields = [
            'route_station_id', 'route', 'station', 'station_name', 'station_type',
            'latitude', 'longitude', 'sequence_order', 'distance_from_prev_km',
            'updated_by',
        ]
        read_only_fields = ['route_station_id', 'station_name', 'station_type', 'latitude', 'longitude']


class RouteStationWriteSerializer(serializers.ModelSerializer):
    """For creating / updating route-station associations."""
    class Meta:
        model = RouteStation
        fields = ['route_station_id', 'station', 'sequence_order', 'distance_from_prev_km']
        read_only_fields = ['route_station_id']


# ─── Route ────────────────────────────────────────────────────────────────────

class RouteSerializer(serializers.ModelSerializer):
    origin_station_name = serializers.CharField(source='origin_station.name', read_only=True)
    terminal_station_name = serializers.CharField(source='terminal_station.name', read_only=True)
    transport_mode_name = serializers.CharField(source='transport_mode.name', read_only=True)
    station_count = serializers.SerializerMethodField()
    stations = RouteStationSerializer(source='routestation_set', many=True, read_only=True)

    class Meta:
        model = Route
        fields = [
            'route_id', 'route_code', 'name', 'transport_mode', 'transport_mode_name',
            'origin_station', 'origin_station_name', 'terminal_station', 'terminal_station_name',
            'estimated_duration_min', 'is_active', 'created_at', 'updated_at',
            'updated_by', 'station_count', 'stations',
        ]
        read_only_fields = [
            'route_id', 'created_at', 'updated_at',
            'origin_station_name', 'terminal_station_name', 'transport_mode_name',
            'station_count', 'stations',
        ]

    def get_station_count(self, obj):
        return obj.routestation_set.count()


class RouteListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for route listings."""
    origin_station_name = serializers.CharField(source='origin_station.name', read_only=True)
    terminal_station_name = serializers.CharField(source='terminal_station.name', read_only=True)
    transport_mode_name = serializers.CharField(source='transport_mode.name', read_only=True)
    station_count = serializers.SerializerMethodField()

    class Meta:
        model = Route
        fields = [
            'route_id', 'route_code', 'name', 'transport_mode_name',
            'origin_station_name', 'terminal_station_name',
            'estimated_duration_min', 'is_active', 'station_count',
        ]

    def get_station_count(self, obj):
        return obj.routestation_set.count()


# ─── Fare Matrix ──────────────────────────────────────────────────────────────

class FareMatrixSerializer(serializers.ModelSerializer):
    transport_mode_name = serializers.CharField(source='transport_mode.name', read_only=True)
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True, default=None)

    class Meta:
        model = FareMatrix
        fields = [
            'fare_matrix_id', 'transport_mode', 'transport_mode_name',
            'base_fare', 'base_km', 'incremental_rate',
            'effective_date', 'is_active', 'created_at',
            'updated_by', 'updated_by_username',
        ]
        read_only_fields = ['fare_matrix_id', 'created_at', 'transport_mode_name', 'updated_by_username']


class GraphNodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GraphNode
        fields = [
            'graph_node_id', 'name', 'node_type', 'latitude', 'longitude',
            'is_active', 'created_at', 'updated_at', 'updated_by',
        ]
        read_only_fields = ['graph_node_id', 'created_at', 'updated_at']


class GraphEdgeSerializer(serializers.ModelSerializer):
    from_node_name = serializers.CharField(source='from_node.name', read_only=True)
    to_node_name = serializers.CharField(source='to_node.name', read_only=True)

    class Meta:
        model = GraphEdge
        fields = [
            'graph_edge_id', 'from_node', 'from_node_name', 'to_node',
            'to_node_name', 'distance_km', 'travel_time_min',
            'is_bidirectional', 'is_active', 'created_at', 'updated_at',
            'updated_by',
        ]
        read_only_fields = [
            'graph_edge_id', 'from_node_name', 'to_node_name',
            'created_at', 'updated_at',
        ]


class JeepneyLoopSerializer(serializers.ModelSerializer):
    class Meta:
        model = JeepneyLoop
        fields = [
            'jeepney_loop_id', 'code', 'name', 'description', 'is_active',
            'created_at', 'updated_at', 'updated_by',
        ]
        read_only_fields = ['jeepney_loop_id', 'created_at', 'updated_at']


class JeepneyLoopEdgeSerializer(serializers.ModelSerializer):
    loop_code = serializers.CharField(source='loop.code', read_only=True)
    edge_label = serializers.SerializerMethodField()

    class Meta:
        model = JeepneyLoopEdge
        fields = [
            'jeepney_loop_edge_id', 'loop', 'loop_code', 'edge',
            'edge_label', 'sequence_order', 'is_active', 'updated_by',
        ]
        read_only_fields = ['jeepney_loop_edge_id', 'loop_code', 'edge_label']

    def get_edge_label(self, obj):
        return str(obj.edge)
