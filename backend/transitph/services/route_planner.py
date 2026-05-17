from typing import List, Dict
from collections import deque
from ..models import Route, RouteStation, Station
from ..utils.geospatial import GeospatialUtils

class RoutePlanner:
    def __init__(self):
        self.graph = {}
        self.geo_utils = GeospatialUtils()
    
    def build_graph(self):
        """Build graph from active jeepney routes"""
        self.graph = {}
        
        # Get all active jeepney routes
        active_routes = Route.objects.filter(
            is_active=True,
            transport_mode__code='JEP',
            transport_mode__is_active=True
        ).select_related('transport_mode', 'origin_station', 'terminal_station')
        
        print(f"Building graph from {active_routes.count()} active routes...")
        
        for route in active_routes:
            # Get ordered stations
            route_stations = RouteStation.objects.filter(
                route=route
            ).select_related('station').order_by('sequence_order')
            
            stations_list = list(route_stations)
            
            if len(stations_list) < 2:
                continue
            
            # Create edges between consecutive stations
            for i in range(len(stations_list) - 1):
                current = stations_list[i]
                next_rs = stations_list[i + 1]
                
                # Get distance
                if next_rs.distance_from_prev_km:
                    distance = float(next_rs.distance_from_prev_km)
                else:
                    distance = self.geo_utils.calculate_distance_between_stations(
                        current.station, next_rs.station
                    )
                
                # Calculate duration
                duration = self.geo_utils.calculate_duration_minutes(distance)
                
                # Add forward edge
                self._add_edge(
                    current.station.station_id,
                    next_rs.station.station_id,
                    route,
                    distance,
                    duration,
                    current.station,
                    next_rs.station
                )
                
                # Add backward edge (bidirectional)
                self._add_edge(
                    next_rs.station.station_id,
                    current.station.station_id,
                    route,
                    distance,
                    duration,
                    next_rs.station,
                    current.station
                )
        
        total_edges = sum(len(edges) for edges in self.graph.values())
        print(f"Graph built: {len(self.graph)} stations, {total_edges} edges")
    
    def _add_edge(self, from_id: int, to_id: int, route: Route,
                  distance_km: float, duration_min: int,
                  from_station: Station, to_station: Station):
        """Add edge to graph"""
        if from_id not in self.graph:
            self.graph[from_id] = []
        
        self.graph[from_id].append({
            'to': to_id,
            'route_id': route.route_id,
            'route': route,
            'distance_km': distance_km,
            'duration_min': duration_min,
            'transport_mode': route.transport_mode.name,
            'route_code': route.route_code,
            'route_name': route.name,
            'from_station': from_station,
            'to_station': to_station
        })
    
    def find_routes(self, origin: Station, destination: Station,
                   max_transfers: int = 3) -> List[Dict]:
        """Find all possible routes between origin and destination"""
        if origin.station_id not in self.graph:
            return []
        
        paths = []
        queue = deque([(origin.station_id, [], {origin.station_id})])
        
        while queue:
            current_id, path_edges, visited = queue.popleft()
            
            if current_id == destination.station_id and path_edges:
                paths.append(self._build_route_result(path_edges))
                continue
            
            if len(path_edges) >= max_transfers + 1:
                continue
            
            for edge in self.graph.get(current_id, []):
                if edge['to'] in visited:
                    continue
                
                new_visited = visited | {edge['to']}
                queue.append((edge['to'], path_edges + [edge], new_visited))
        
        # Sort by transfers first, then duration
        paths.sort(key=lambda x: (x['transfers'], x['total_duration_min']))
        return paths
    
    def _build_route_result(self, edges: List[Dict]) -> Dict:
        """Convert edges to structured route result"""
        legs = []
        total_duration = 0
        total_distance = 0
        
        for i, edge in enumerate(edges):
            leg = {
                'sequence': i + 1,
                'from_station': {
                    'id': edge['from_station'].station_id,
                    'name': edge['from_station'].name,
                    'type': edge['from_station'].station_type,
                    'latitude': float(edge['from_station'].latitude),
                    'longitude': float(edge['from_station'].longitude),
                    'address': edge['from_station'].address or '',
                },
                'to_station': {
                    'id': edge['to_station'].station_id,
                    'name': edge['to_station'].name,
                    'type': edge['to_station'].station_type,
                    'latitude': float(edge['to_station'].latitude),
                    'longitude': float(edge['to_station'].longitude),
                    'address': edge['to_station'].address or '',
                },
                'vehicle_type': edge['transport_mode'],
                'route_name': edge['route_name'],
                'route_code': edge['route_code'],
                'distance_km': edge['distance_km'],
                'duration_min': edge['duration_min'],
                'boarding_point': f"Board at {self._extract_landmark(edge['from_station'])}",
                'alighting_point': f"Alight at {self._extract_landmark(edge['to_station'])}",
                'landmark_cue': self._extract_landmark(edge['to_station'])
            }
            legs.append(leg)
            total_distance += edge['distance_km']
            total_duration += edge['duration_min']
        
        # Count transfers
        transfers = 0
        for i in range(1, len(edges)):
            if edges[i]['route_id'] != edges[i-1]['route_id']:
                transfers += 1
        
        return {
            'legs': legs,
            'total_duration_min': total_duration,
            'total_distance_km': round(total_distance, 2),
            'transfers': transfers,
            'leg_count': len(legs)
        }
    
    def _extract_landmark(self, station: Station) -> str:
        """Extract landmark from address or use station name"""
        if station.address:
            parts = station.address.split(',')
            return parts[0].strip()
        return station.name