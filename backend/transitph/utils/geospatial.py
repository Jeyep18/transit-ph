# backend/transitph/utils/geospatial.py
import math
from typing import Optional
from ..models import Station

class GeospatialUtils:
    """Pure Python geospatial utilities - NO GDAL required"""
    
    @staticmethod
    def haversine_distance(lat1: float, lon1: float, 
                          lat2: float, lon2: float) -> float:
        """
        Calculate distance between two points in kilometers.
        Uses haversine formula - accurate enough for jeepney routes.
        """
        R = 6371  # Earth's radius in kilometers
        
        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        # Haversine formula
        a = math.sin(delta_lat/2)**2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * \
            math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return round(R * c, 2)
    
    @staticmethod
    def find_nearest_station(lat: float, lon: float, 
                            station_type: str = 'JEEPNEY_STOP',
                            max_distance_km: float = 0.5) -> Optional[Station]:
        """Find the nearest station to given coordinates."""
        stations = Station.objects.filter(
            is_active=True,
            station_type=station_type
        )
        
        if not stations.exists():
            return None
        
        nearest = None
        min_distance = float('inf')
        
        for station in stations:
            distance = GeospatialUtils.haversine_distance(
                lat, lon,
                float(station.latitude), float(station.longitude)
            )
            
            if distance < min_distance:
                min_distance = distance
                nearest = station
        
        if min_distance <= max_distance_km:
            return nearest
        return None
    
    @staticmethod
    def calculate_distance_between_stations(station1: Station, station2: Station) -> float:
        """Calculate distance between two stations in kilometers."""
        return GeospatialUtils.haversine_distance(
            float(station1.latitude), float(station1.longitude),
            float(station2.latitude), float(station2.longitude)
        )
    
    @staticmethod
    def calculate_duration_minutes(distance_km: float, speed_kmh: float = 20) -> int:
        """Calculate estimated travel time in minutes."""
        if distance_km <= 0:
            return 1
        
        duration_hours = distance_km / speed_kmh
        duration_minutes = max(1, int(duration_hours * 60))
        return duration_minutes