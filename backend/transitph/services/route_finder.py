"""
Route-finding service.

Given an origin and destination (as station IDs or coordinates), finds all
valid Jeepney routes that connect them — including direct routes and
single-transfer routes.

Business rules applied:
- BR-SR-01 / BR-SR-02: Only active stations and routes are searched
- BR-SR-03: Results sortable by fare, transfers, time
- BR-SR-06: Tricycle connections display advisory only (no computed fare)
- BR-FCM-03: Haversine fallback flagged as estimated
"""
import math

from ..models import Route, RouteStation, Station, haversine_km
from .fare_calculator import compute_fare, get_active_fare_matrix


def _route_sequence(route: Route) -> list[RouteStation]:
    """Return the active station sequence for a public-searchable route."""
    stations = sorted(
        route.routestation_set.all(),
        key=lambda rs: rs.sequence_order,
    )
    if any(not rs.station.is_active for rs in stations):
        return []
    return stations


def _route_total_distance_km(route: Route) -> float:
    sequence = _route_sequence(route)
    distance = sum(float(rs.distance_from_prev_km or 0) for rs in sequence)
    if distance > 0:
        return distance
    if route.origin_station and route.terminal_station:
        return haversine_km(
            route.origin_station.latitude,
            route.origin_station.longitude,
            route.terminal_station.latitude,
            route.terminal_station.longitude,
        )
    return 0


def _estimate_duration_min(route: Route, leg_distance_km: float) -> int | None:
    if not route.estimated_duration_min:
        return None
    total_distance = _route_total_distance_km(route)
    if total_distance <= 0:
        return route.estimated_duration_min
    return max(1, math.ceil(route.estimated_duration_min * leg_distance_km / total_distance))


def find_routes(origin_station_id: int, destination_station_id: int,
                transport_filter: list[str] | None = None) -> list[dict]:
    """
    Find all route options between two stations.

    Returns a list of route suggestion dicts, each containing:
    - legs: list of individual travel legs
    - total_fare: sum of all leg fares
    - total_distance_km: sum of distances
    - transfer_count: number of transfers
    - is_estimated: whether any leg uses Haversine fallback
    """
    results = []

    # Get all active routes that have station sequences
    active_routes = Route.objects.filter(
        is_active=True,
        transport_mode__code='JEP',
        transport_mode__is_active=True,
        origin_station__is_active=True,
        terminal_station__is_active=True,
    ).select_related(
        'transport_mode', 'origin_station', 'terminal_station'
    ).prefetch_related('routestation_set__station')

    # Build a lookup: station_id → list of (route, route_station) pairs
    station_route_map = {}
    for route in active_routes:
        route_sequence = _route_sequence(route)
        if len(route_sequence) < 2:
            continue
        for rs in route_sequence:
            station_route_map.setdefault(rs.station_id, []).append((route, rs))

    # ─── Direct Routes ─────────────────────────────────────────────────
    # Find routes that contain both origin and destination stations
    origin_routes = station_route_map.get(origin_station_id, [])
    dest_routes = station_route_map.get(destination_station_id, [])

    origin_route_ids = {r.route_id for r, _ in origin_routes}
    dest_route_ids = {r.route_id for r, _ in dest_routes}
    common_route_ids = origin_route_ids & dest_route_ids

    for route_id in common_route_ids:
        route_obj = None
        origin_rs = None
        dest_rs = None

        for r, rs in origin_routes:
            if r.route_id == route_id:
                route_obj = r
                origin_rs = rs
                break

        for r, rs in dest_routes:
            if r.route_id == route_id:
                dest_rs = rs
                break

        if not route_obj or not origin_rs or not dest_rs:
            continue

        # Ensure origin comes before destination in the sequence
        if origin_rs.sequence_order >= dest_rs.sequence_order:
            continue

        # Calculate distance along the route between the two stations
        route_stations = list(
            RouteStation.objects.filter(
                route=route_obj,
                sequence_order__gte=origin_rs.sequence_order,
                sequence_order__lte=dest_rs.sequence_order,
            ).order_by('sequence_order')
        )

        distance_km = sum(
            float(rs.distance_from_prev_km or 0)
            for rs in route_stations
            if rs.sequence_order > origin_rs.sequence_order
        )

        # If no distance data, use Haversine as fallback
        is_estimated = False
        if distance_km == 0:
            origin_station = origin_rs.station
            dest_station = dest_rs.station
            distance_km = haversine_km(
                origin_station.latitude, origin_station.longitude,
                dest_station.latitude, dest_station.longitude,
            )
            is_estimated = True

        # Compute fare
        fm = get_active_fare_matrix(route_obj.transport_mode_id)
        fare = float(compute_fare(distance_km, fm)) if fm else None
        duration_min = _estimate_duration_min(route_obj, distance_km)

        # Build stop sequence for this leg
        stops = []
        for rs in route_stations:
            stops.append({
                'station_id': rs.station_id,
                'station_name': rs.station.name,
                'sequence_order': rs.sequence_order,
                'latitude': float(rs.station.latitude),
                'longitude': float(rs.station.longitude),
            })

        results.append({
            'legs': [{
                'route_id': route_obj.route_id,
                'route_code': route_obj.route_code,
                'route_name': route_obj.name,
                'transport_mode': route_obj.transport_mode.code,
                'transport_mode_name': route_obj.transport_mode.name,
                'origin_station_id': origin_rs.station_id,
                'origin_station_name': origin_rs.station.name,
                'destination_station_id': dest_rs.station_id,
                'destination_station_name': dest_rs.station.name,
                'distance_km': round(distance_km, 2),
                'fare': fare,
                'estimated_duration_min': duration_min,
                'is_estimated': is_estimated,
                'stops': stops,
            }],
            'total_fare': fare,
            'total_distance_km': round(distance_km, 2),
            'total_duration_min': duration_min,
            'transfer_count': 0,
            'is_estimated': is_estimated,
        })

    # ─── Transfer Routes (1 transfer) ─────────────────────────────────
    # Find routes where you ride route A, get off at a transfer station,
    # and board route B to reach the destination.
    for r_origin, rs_origin in origin_routes:
        for r_dest, rs_dest in dest_routes:
            if r_origin.route_id == r_dest.route_id:
                continue  # Already handled as direct route

            # Find common transfer stations between the two routes
            origin_route_stations = {
                rs.station_id: rs
                for rs in r_origin.routestation_set.all()
                if rs.sequence_order > rs_origin.sequence_order
            }
            dest_route_stations = {
                rs.station_id: rs
                for rs in r_dest.routestation_set.all()
            }

            transfer_station_ids = set(origin_route_stations.keys()) & set(dest_route_stations.keys())

            for transfer_id in transfer_station_ids:
                transfer_rs_a = origin_route_stations[transfer_id]
                transfer_rs_b = dest_route_stations[transfer_id]

                # On route B, the transfer station must come before the destination
                if transfer_rs_b.sequence_order >= rs_dest.sequence_order:
                    continue

                # ── Leg 1: origin → transfer on route A ──
                leg1_stations = list(
                    RouteStation.objects.filter(
                        route=r_origin,
                        sequence_order__gte=rs_origin.sequence_order,
                        sequence_order__lte=transfer_rs_a.sequence_order,
                    ).order_by('sequence_order')
                )
                dist_1 = sum(
                    float(rs.distance_from_prev_km or 0)
                    for rs in leg1_stations
                    if rs.sequence_order > rs_origin.sequence_order
                )
                is_est_1 = False
                if dist_1 == 0:
                    dist_1 = haversine_km(
                        rs_origin.station.latitude, rs_origin.station.longitude,
                        transfer_rs_a.station.latitude, transfer_rs_a.station.longitude,
                    )
                    is_est_1 = True

                # ── Leg 2: transfer → destination on route B ──
                leg2_stations = list(
                    RouteStation.objects.filter(
                        route=r_dest,
                        sequence_order__gte=transfer_rs_b.sequence_order,
                        sequence_order__lte=rs_dest.sequence_order,
                    ).order_by('sequence_order')
                )
                dist_2 = sum(
                    float(rs.distance_from_prev_km or 0)
                    for rs in leg2_stations
                    if rs.sequence_order > transfer_rs_b.sequence_order
                )
                is_est_2 = False
                if dist_2 == 0:
                    dist_2 = haversine_km(
                        transfer_rs_b.station.latitude, transfer_rs_b.station.longitude,
                        rs_dest.station.latitude, rs_dest.station.longitude,
                    )
                    is_est_2 = True

                # Compute fares
                fm1 = get_active_fare_matrix(r_origin.transport_mode_id)
                fm2 = get_active_fare_matrix(r_dest.transport_mode_id)
                fare_1 = float(compute_fare(dist_1, fm1)) if fm1 else None
                fare_2 = float(compute_fare(dist_2, fm2)) if fm2 else None
                duration_1 = _estimate_duration_min(r_origin, dist_1)
                duration_2 = _estimate_duration_min(r_dest, dist_2)

                total_fare = None
                if fare_1 is not None and fare_2 is not None:
                    total_fare = round(fare_1 + fare_2, 2)
                total_duration = None
                if duration_1 is not None and duration_2 is not None:
                    total_duration = duration_1 + duration_2

                transfer_station = transfer_rs_a.station

                results.append({
                    'legs': [
                        {
                            'route_id': r_origin.route_id,
                            'route_code': r_origin.route_code,
                            'route_name': r_origin.name,
                            'transport_mode': r_origin.transport_mode.code,
                            'transport_mode_name': r_origin.transport_mode.name,
                            'origin_station_id': rs_origin.station_id,
                            'origin_station_name': rs_origin.station.name,
                            'destination_station_id': transfer_id,
                            'destination_station_name': transfer_station.name,
                            'distance_km': round(dist_1, 2),
                            'fare': fare_1,
                            'estimated_duration_min': duration_1,
                            'is_estimated': is_est_1,
                            'stops': [
                                {
                                    'station_id': rs.station_id,
                                    'station_name': rs.station.name,
                                    'sequence_order': rs.sequence_order,
                                    'latitude': float(rs.station.latitude),
                                    'longitude': float(rs.station.longitude),
                                }
                                for rs in leg1_stations
                            ],
                        },
                        {
                            'route_id': r_dest.route_id,
                            'route_code': r_dest.route_code,
                            'route_name': r_dest.name,
                            'transport_mode': r_dest.transport_mode.code,
                            'transport_mode_name': r_dest.transport_mode.name,
                            'origin_station_id': transfer_id,
                            'origin_station_name': transfer_station.name,
                            'destination_station_id': rs_dest.station_id,
                            'destination_station_name': rs_dest.station.name,
                            'distance_km': round(dist_2, 2),
                            'fare': fare_2,
                            'estimated_duration_min': duration_2,
                            'is_estimated': is_est_2,
                            'stops': [
                                {
                                    'station_id': rs.station_id,
                                    'station_name': rs.station.name,
                                    'sequence_order': rs.sequence_order,
                                    'latitude': float(rs.station.latitude),
                                    'longitude': float(rs.station.longitude),
                                }
                                for rs in leg2_stations
                            ],
                        },
                    ],
                    'total_fare': total_fare,
                    'total_distance_km': round(dist_1 + dist_2, 2),
                    'total_duration_min': total_duration,
                    'transfer_count': 1,
                    'is_estimated': is_est_1 or is_est_2,
                })

    return results


def sort_results(results: list[dict], sort_by: str = 'fare') -> list[dict]:
    """
    Sort route results by the given criterion.

    sort_by: 'fare' | 'transfers' | 'distance' | 'time'
    """
    if sort_by == 'fare':
        return sorted(results, key=lambda r: (r['total_fare'] or 999999, r['transfer_count']))
    elif sort_by == 'transfers':
        return sorted(results, key=lambda r: (r['transfer_count'], r['total_fare'] or 999999))
    elif sort_by == 'distance':
        return sorted(results, key=lambda r: (r['total_distance_km'], r['total_fare'] or 999999))
    elif sort_by == 'time':
        return sorted(results, key=lambda r: (r.get('total_duration_min') or 999999, r['total_fare'] or 999999))
    return results


def find_nearest_stations(lat: float, lng: float, radius_km: float = 1.0,
                          station_type: str | None = None, limit: int = 5) -> list[dict]:
    """
    Find stations nearest to the given coordinates within radius_km.
    Used when the user drops a pin instead of selecting a station.
    """
    stations = Station.objects.filter(is_active=True)
    if station_type:
        stations = stations.filter(station_type=station_type)

    nearby = []
    for s in stations:
        dist = haversine_km(lat, lng, float(s.latitude), float(s.longitude))
        if dist <= radius_km:
            nearby.append({
                'station_id': s.station_id,
                'name': s.name,
                'station_type': s.station_type,
                'latitude': float(s.latitude),
                'longitude': float(s.longitude),
                'distance_km': round(dist, 3),
            })

    nearby.sort(key=lambda x: x['distance_km'])
    return nearby[:limit]
