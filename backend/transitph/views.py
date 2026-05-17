from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Station, Route, RouteStation, TransportMode
from .services.route_planner import RoutePlanner
from .utils.geospatial import GeospatialUtils

class RoutePlanView(APIView):
    """Route planning API endpoint"""
    
    def post(self, request):
        try:
            data = request.data
            
            # Resolve origin
            origin = self._resolve_station(
                name=data.get('origin'),
                lat=data.get('origin_lat'),
                lon=data.get('origin_lon')
            )
            
            if not origin:
                return Response({
                    'error': 'Could not find origin station'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Resolve destination
            destination = self._resolve_station(
                name=data.get('destination'),
                lat=data.get('dest_lat'),
                lon=data.get('dest_lon')
            )
            
            if not destination:
                return Response({
                    'error': 'Could not find destination station'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if same station
            if origin.station_id == destination.station_id:
                return Response({
                    'warning': 'Origin and destination are the same',
                    'origin': self._serialize_station(origin),
                    'destination': self._serialize_station(destination),
                    'routes': []
                })
            
            # Plan routes
            planner = RoutePlanner()
            planner.build_graph()
            
            max_transfers = data.get('max_transfers', 3)
            routes = planner.find_routes(origin, destination, max_transfers)
            
            return Response({
                'origin': self._serialize_station(origin),
                'destination': self._serialize_station(destination),
                'routes': routes[:5],  # Top 5 routes
                'summary': {
                    'total_routes_found': len(routes),
                    'max_transfers': max_transfers
                }
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _resolve_station(self, name=None, lat=None, lon=None):
        """Resolve station from text or coordinates"""
        geo_utils = GeospatialUtils()
        
        # Priority 1: Coordinates
        if lat is not None and lon is not None:
            return geo_utils.find_nearest_station(lat, lon)
        
        # Priority 2: Text search
        if name:
            # Exact match
            try:
                return Station.objects.get(
                    Q(name__iexact=name.strip()),
                    is_active=True,
                    station_type='JEEPNEY_STOP'
                )
            except Station.DoesNotExist:
                pass
            
            # Partial match
            stations = Station.objects.filter(
                Q(name__icontains=name) | Q(address__icontains=name),
                is_active=True,
                station_type='JEEPNEY_STOP'
            )[:5]
            
            if stations.exists():
                return stations.first()
        
        return None
    
    def _serialize_station(self, station):
        """Serialize station for API response"""
        return {
            'id': station.station_id,
            'name': station.name,
            'type': station.station_type,
            'latitude': float(station.latitude),
            'longitude': float(station.longitude),
            'address': station.address,
            'landmark': station.address.split(',')[0] if station.address else station.name
        }