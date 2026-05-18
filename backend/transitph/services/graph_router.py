"""
Graph-based routing for arbitrary origin/destination coordinates.

The road network is represented as nodes and edges. Edges tagged by active
JeepneyLoopEdge records are treated as jeepney loop segments with lower
pathfinding weights, so Dijkstra naturally prefers public transport coverage
while still allowing non-tagged first/last-mile branches.
"""
from __future__ import annotations

import heapq
import json
import math
from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from functools import lru_cache
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from ..models import GraphEdge, GraphNode, JeepneyLoopEdge, haversine_km

JEEPNEY_BASE_FARE = Decimal('13.00')
JEEPNEY_BASE_KM = Decimal('4.00')
JEEPNEY_INCREMENTAL_RATE = Decimal('1.80')
TRICYCLE_BASE_FARE = Decimal('15.00')
TRICYCLE_RATE_PER_KM = Decimal('2.00')
TRICYCLE_BASE_KM = Decimal('5.00')

JEEPNEY_WEIGHT_FACTOR = 0.35
TRICYCLE_WEIGHT_FACTOR = 1.0
AVERAGE_JEEPNEY_KPH = 18
AVERAGE_WALKING_KPH = 5
AVERAGE_TRICYCLE_KPH = 14
WALKING_MAX_KM = 0.5
LOOP_TRANSFER_MAX_KM = 2.5
OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1'
OSRM_USER_AGENT = 'TransitPH/1.0 (local development; contact: admin@transitph.local)'
USE_EXTERNAL_ROAD_GEOMETRY = False


@dataclass(frozen=True)
class EdgeStep:
    edge: GraphEdge | None
    from_node_id: int
    to_node_id: int
    mode: str
    loop_name: str | None
    loop_code: str | None


def _money(value: Decimal | int | float) -> float:
    if not isinstance(value, Decimal):
        value = Decimal(str(value))
    return float(value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def _jeepney_fare(distance_km: float) -> float:
    distance = Decimal(str(distance_km))
    fare = JEEPNEY_BASE_FARE + max(Decimal('0'), distance - JEEPNEY_BASE_KM) * JEEPNEY_INCREMENTAL_RATE
    return _money(fare)


def _tricycle_fare(distance_km: float) -> float:
    if distance_km <= 0:
        return 0.0
    distance = Decimal(str(distance_km))
    return _money(
        TRICYCLE_BASE_FARE
        + max(Decimal('0'), distance - TRICYCLE_BASE_KM) * TRICYCLE_RATE_PER_KM
    )


def _road_route(profile: str, from_point: dict, to_point: dict) -> dict | None:
    route = _road_route_cached(
        profile,
        round(float(from_point['latitude']), 6),
        round(float(from_point['longitude']), 6),
        round(float(to_point['latitude']), 6),
        round(float(to_point['longitude']), 6),
    )
    if not route:
        return None

    points = [
        _virtual_point(None, point['latitude'], point['longitude'])
        for point in route['geometry']
    ]
    points[0] = from_point
    points[-1] = to_point

    return {
        **route,
        'geometry': points,
    }


def _road_route_waypoints(profile: str, points: list[dict]) -> dict | None:
    if len(points) < 2:
        return None
    waypoint_key = tuple(
        (
            round(float(point['latitude']), 6),
            round(float(point['longitude']), 6),
        )
        for point in points
    )
    route = _road_route_waypoints_cached(profile, waypoint_key)
    if not route:
        return None

    geometry = [
        _virtual_point(None, point['latitude'], point['longitude'])
        for point in route['geometry']
    ]
    geometry[0] = points[0]
    geometry[-1] = points[-1]
    return {
        **route,
        'geometry': geometry,
    }


def _point_to_segment_distance_km(point: dict, first: dict, second: dict) -> float:
    lat_scale = 111.32
    lng_scale = 111.32 * math.cos(math.radians(float(first['latitude'])))
    px = (float(point['longitude']) - float(first['longitude'])) * lng_scale
    py = (float(point['latitude']) - float(first['latitude'])) * lat_scale
    ax = 0.0
    ay = 0.0
    bx = (float(second['longitude']) - float(first['longitude'])) * lng_scale
    by = (float(second['latitude']) - float(first['latitude'])) * lat_scale
    dx = bx - ax
    dy = by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px, py)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    nearest_x = ax + t * dx
    nearest_y = ay + t * dy
    return math.hypot(px - nearest_x, py - nearest_y)


def _road_route_stays_on_corridor(
    route: dict | None,
    first_payload: dict,
    second_payload: dict,
    straight_distance: float,
) -> bool:
    if not route:
        return False
    route_distance = route.get('distance_km', 0)
    if route_distance > max(straight_distance * 1.75, straight_distance + 0.25):
        return False
    max_deviation = max(
        (
            _point_to_segment_distance_km(point, first_payload, second_payload)
            for point in route.get('geometry', [])
        ),
        default=0,
    )
    return max_deviation <= max(0.08, straight_distance * 0.45)


@lru_cache(maxsize=256)
def _road_route_waypoints_cached(
    profile: str,
    waypoint_key: tuple[tuple[float, float], ...],
) -> dict | None:
    coordinates = ';'.join(
        f'{lng},{lat}'
        for lat, lng in waypoint_key
    )
    params = urlencode({
        'overview': 'full',
        'geometries': 'geojson',
        'steps': 'false',
    })
    request = Request(
        f'{OSRM_ROUTE_URL}/{profile}/{coordinates}?{params}',
        headers={
            'Accept': 'application/json',
            'User-Agent': OSRM_USER_AGENT,
        },
    )

    try:
        with urlopen(request, timeout=12) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except Exception:
        return None

    routes = payload.get('routes') or []
    if payload.get('code') != 'Ok' or not routes:
        return None

    route = routes[0]
    raw_points = route.get('geometry', {}).get('coordinates') or []
    if len(raw_points) < 2:
        return None

    return {
        'distance_km': round(float(route.get('distance', 0)) / 1000, 3),
        'duration_min': max(1, math.ceil(float(route.get('duration', 0)) / 60)),
        'geometry': [
            {
                'latitude': float(lat),
                'longitude': float(lng),
            }
            for lng, lat in raw_points
        ],
    }


@lru_cache(maxsize=2048)
def _road_route_cached(
    profile: str,
    from_lat: float,
    from_lng: float,
    to_lat: float,
    to_lng: float,
) -> dict | None:
    coordinates = (
        f'{from_lng},{from_lat};'
        f'{to_lng},{to_lat}'
    )
    params = urlencode({
        'overview': 'full',
        'geometries': 'geojson',
        'steps': 'false',
    })
    request = Request(
        f'{OSRM_ROUTE_URL}/{profile}/{coordinates}?{params}',
        headers={
            'Accept': 'application/json',
            'User-Agent': OSRM_USER_AGENT,
        },
    )

    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except Exception:
        return None

    routes = payload.get('routes') or []
    if payload.get('code') != 'Ok' or not routes:
        return None

    route = routes[0]
    raw_points = route.get('geometry', {}).get('coordinates') or []
    if len(raw_points) < 2:
        return None

    return {
        'distance_km': round(float(route.get('distance', 0)) / 1000, 3),
        'duration_min': max(1, math.ceil(float(route.get('duration', 0)) / 60)),
        'geometry': [
            {
                'latitude': float(lat),
                'longitude': float(lng),
            }
            for lng, lat in raw_points
        ],
    }


@lru_cache(maxsize=1)
def _active_nodes() -> tuple[GraphNode, ...]:
    return tuple(GraphNode.objects.filter(is_active=True))


def nearest_node(lat: float, lng: float) -> GraphNode | None:
    nodes = _active_nodes()
    if not nodes:
        return None
    return min(
        nodes,
        key=lambda node: haversine_km(lat, lng, node.latitude, node.longitude),
    )


def nearest_nodes(lat: float, lng: float, limit: int = 8) -> list[GraphNode]:
    nodes = _active_nodes()
    return sorted(
        nodes,
        key=lambda node: haversine_km(lat, lng, node.latitude, node.longitude),
    )[:limit]


def _loop_tag_map() -> dict[int, tuple[str, str]]:
    tags = (
        JeepneyLoopEdge.objects.filter(is_active=True, loop__is_active=True)
        .select_related('loop')
    )
    return {
        tag.edge_id: (tag.loop.code, tag.loop.name)
        for tag in tags
    }


def _node_loop_codes() -> dict[int, set[str]]:
    tags = (
        JeepneyLoopEdge.objects.filter(is_active=True, loop__is_active=True)
        .select_related('loop', 'edge')
    )
    node_codes: dict[int, set[str]] = defaultdict(set)
    for tag in tags:
        node_codes[tag.edge.from_node_id].add(tag.loop.code)
        node_codes[tag.edge.to_node_id].add(tag.loop.code)
    return node_codes


@lru_cache(maxsize=1)
def _build_adjacency() -> dict[int, list[tuple[int, float, EdgeStep]]]:
    loop_tags = _loop_tag_map()
    adjacency: dict[int, list[tuple[int, float, EdgeStep]]] = defaultdict(list)
    edges = (
        GraphEdge.objects.filter(
            is_active=True,
            from_node__is_active=True,
            to_node__is_active=True,
        )
        .select_related('from_node', 'to_node')
    )

    for edge in edges:
        if edge.distance_km is None:
            continue

        loop = loop_tags.get(edge.graph_edge_id)
        mode = 'JEEPNEY' if loop else 'TRICYCLE'
        weight_factor = JEEPNEY_WEIGHT_FACTOR if loop else TRICYCLE_WEIGHT_FACTOR
        distance = float(edge.distance_km)
        time_weight = float(edge.travel_time_min) if edge.travel_time_min else distance
        cost = time_weight * weight_factor
        loop_code = loop[0] if loop else None
        loop_name = loop[1] if loop else None

        adjacency[edge.from_node_id].append((
            edge.to_node_id,
            cost,
            EdgeStep(edge, edge.from_node_id, edge.to_node_id, mode, loop_name, loop_code),
        ))
        if edge.is_bidirectional:
            adjacency[edge.to_node_id].append((
                edge.from_node_id,
                cost,
                EdgeStep(edge, edge.to_node_id, edge.from_node_id, mode, loop_name, loop_code),
            ))

    node_codes = _node_loop_codes()
    nodes = _active_nodes()
    for index, from_node in enumerate(nodes):
        from_codes = node_codes.get(from_node.graph_node_id, set())
        if not from_codes:
            continue
        for to_node in nodes[index + 1:]:
            to_codes = node_codes.get(to_node.graph_node_id, set())
            if not to_codes or from_codes.intersection(to_codes):
                continue

            distance = haversine_km(
                from_node.latitude,
                from_node.longitude,
                to_node.latitude,
                to_node.longitude,
            )
            if distance > LOOP_TRANSFER_MAX_KM:
                continue

            mode = 'WALKING' if distance <= WALKING_MAX_KM else 'TRICYCLE'
            speed = AVERAGE_WALKING_KPH if mode == 'WALKING' else AVERAGE_TRICYCLE_KPH
            minutes = max(1, distance / speed * 60)
            cost = minutes * TRICYCLE_WEIGHT_FACTOR
            adjacency[from_node.graph_node_id].append((
                to_node.graph_node_id,
                cost,
                EdgeStep(None, from_node.graph_node_id, to_node.graph_node_id, mode, None, None),
            ))
            adjacency[to_node.graph_node_id].append((
                from_node.graph_node_id,
                cost,
                EdgeStep(None, to_node.graph_node_id, from_node.graph_node_id, mode, None, None),
            ))

    return adjacency


def _dijkstra(start_node_id: int, end_node_id: int) -> list[EdgeStep]:
    adjacency = _build_adjacency()
    queue: list[tuple[float, int]] = [(0, start_node_id)]
    distances = {start_node_id: 0.0}
    previous: dict[int, tuple[int, EdgeStep]] = {}

    while queue:
        cost, node_id = heapq.heappop(queue)
        if node_id == end_node_id:
            break
        if cost > distances.get(node_id, math.inf):
            continue
        for next_node_id, edge_cost, step in adjacency.get(node_id, []):
            next_cost = cost + edge_cost
            if next_cost < distances.get(next_node_id, math.inf):
                distances[next_node_id] = next_cost
                previous[next_node_id] = (node_id, step)
                heapq.heappush(queue, (next_cost, next_node_id))

    if end_node_id not in previous and start_node_id != end_node_id:
        return []

    steps: list[EdgeStep] = []
    cursor = end_node_id
    while cursor != start_node_id:
        prev_node_id, step = previous[cursor]
        steps.append(step)
        cursor = prev_node_id
    return list(reversed(steps))


def _path_distance(steps: list[EdgeStep]) -> float:
    distance = 0.0
    for step in steps:
        if step.edge is not None:
            distance += float(step.edge.distance_km or 0)
            continue
        from_node = GraphNode.objects.get(pk=step.from_node_id)
        to_node = GraphNode.objects.get(pk=step.to_node_id)
        distance += haversine_km(
            from_node.latitude,
            from_node.longitude,
            to_node.latitude,
            to_node.longitude,
        )
    return distance


def _best_connected_node_path(
    origin_lat: float,
    origin_lng: float,
    dest_lat: float,
    dest_lng: float,
) -> tuple[GraphNode, GraphNode, list[EdgeStep]] | None:
    best: tuple[float, GraphNode, GraphNode, list[EdgeStep]] | None = None
    for origin_candidate in nearest_nodes(origin_lat, origin_lng):
        for destination_candidate in nearest_nodes(dest_lat, dest_lng):
            steps = _dijkstra(
                origin_candidate.graph_node_id,
                destination_candidate.graph_node_id,
            )
            if not steps and origin_candidate.graph_node_id != destination_candidate.graph_node_id:
                continue

            score = (
                haversine_km(origin_lat, origin_lng, origin_candidate.latitude, origin_candidate.longitude)
                + _path_distance(steps)
                + haversine_km(dest_lat, dest_lng, destination_candidate.latitude, destination_candidate.longitude)
            )
            if best is None or score < best[0]:
                best = (score, origin_candidate, destination_candidate, steps)

    if best is None:
        return None
    return best[1], best[2], best[3]


def _node_payload(node: GraphNode) -> dict:
    return {
        'node_id': node.graph_node_id,
        'name': node.name,
        'latitude': float(node.latitude),
        'longitude': float(node.longitude),
    }


def _edge_points(step: EdgeStep) -> list[dict]:
    edge = step.edge
    first = edge.from_node if step.from_node_id == edge.from_node_id else edge.to_node
    second = edge.to_node if step.to_node_id == edge.to_node_id else edge.from_node
    return [_node_payload(first), _node_payload(second)]


def _edge_geometry(step: EdgeStep) -> tuple[list[dict], float, int, bool]:
    if step.edge is None:
        first_payload = _node_payload(GraphNode.objects.get(pk=step.from_node_id))
        second_payload = _node_payload(GraphNode.objects.get(pk=step.to_node_id))
        distance = haversine_km(
            first_payload['latitude'],
            first_payload['longitude'],
            second_payload['latitude'],
            second_payload['longitude'],
        )
        if not USE_EXTERNAL_ROAD_GEOMETRY:
            speed = AVERAGE_WALKING_KPH if step.mode == 'WALKING' else AVERAGE_TRICYCLE_KPH
            return (
                [first_payload, second_payload],
                round(distance, 3),
                max(1, math.ceil(distance / speed * 60)),
                True,
            )

        profile = 'foot' if step.mode == 'WALKING' else 'driving'
        road_route = _road_route(profile, first_payload, second_payload)
        if road_route:
            return (
                road_route['geometry'],
                road_route['distance_km'],
                road_route['duration_min'],
                False,
            )

        speed = AVERAGE_WALKING_KPH if step.mode == 'WALKING' else AVERAGE_TRICYCLE_KPH
        return (
            [first_payload, second_payload],
            round(distance, 3),
            max(1, math.ceil(distance / speed * 60)),
            True,
        )

    edge = step.edge
    first = edge.from_node if step.from_node_id == edge.from_node_id else edge.to_node
    second = edge.to_node if step.to_node_id == edge.to_node_id else edge.from_node
    first_payload = _node_payload(first)
    second_payload = _node_payload(second)
    straight_distance = haversine_km(
        first_payload['latitude'],
        first_payload['longitude'],
        second_payload['latitude'],
        second_payload['longitude'],
    )
    distance = float(edge.distance_km or 0)
    duration = (
        math.ceil(float(edge.travel_time_min))
        if edge.travel_time_min is not None
        else max(1, math.ceil((distance or straight_distance) / AVERAGE_JEEPNEY_KPH * 60))
    )

    # Fast path: use pre-computed OSRM geometry stored in the database
    if edge.road_geometry:
        enriched = [first_payload, second_payload]
        for pt in edge.road_geometry[1:-1]:
            enriched.append({
                'latitude': pt['latitude'],
                'longitude': pt['longitude'],
                'name': None,
                'node_id': None,
            })
        enriched.append(second_payload)
        return enriched, distance or round(straight_distance, 3), duration, False

    if not USE_EXTERNAL_ROAD_GEOMETRY:
        return [first_payload, second_payload], distance or round(straight_distance, 3), duration, True

    road_route = _road_route('driving', first_payload, second_payload)
    if step.mode != 'JEEPNEY' or _road_route_stays_on_corridor(
        road_route,
        first_payload,
        second_payload,
        straight_distance,
    ):
        return (
            road_route['geometry'],
            road_route['distance_km'],
            road_route['duration_min'],
            False,
        ) if road_route else ([first_payload, second_payload], round(straight_distance, 3), max(1, math.ceil(straight_distance / AVERAGE_JEEPNEY_KPH * 60)), True)

    return [first_payload, second_payload], distance, duration, True


def _virtual_point(name: str | None, lat: float, lng: float) -> dict:
    return {
        'node_id': None,
        'name': name,
        'latitude': lat,
        'longitude': lng,
    }


def _connector_leg(label: str, from_point: dict, to_point: dict) -> dict | None:
    straight_distance = haversine_km(
        from_point['latitude'],
        from_point['longitude'],
        to_point['latitude'],
        to_point['longitude'],
    )
    if straight_distance < 0.05:
        return None

    walking_route = _road_route('foot', from_point, to_point) if USE_EXTERNAL_ROAD_GEOMETRY else None
    route_distance = walking_route['distance_km'] if walking_route else round(straight_distance, 3)
    is_walking = route_distance <= WALKING_MAX_KM

    if is_walking:
        mode = 'WALKING'
        fare = 0.0
        speed = AVERAGE_WALKING_KPH
        route = walking_route
        instruction = label.replace('Walk/Tricycle', 'Walk')
    else:
        mode = 'TRICYCLE'
        fare = _tricycle_fare(route_distance)
        speed = AVERAGE_TRICYCLE_KPH
        route = (
            _road_route('driving', from_point, to_point)
            if USE_EXTERNAL_ROAD_GEOMETRY
            else None
        ) or walking_route
        instruction = label.replace('Walk/Tricycle', 'Take a tricycle')

    distance = route['distance_km'] if route else route_distance
    duration = (
        route['duration_min']
        if route
        else max(1, math.ceil(distance / speed * 60))
    )
    geometry = route['geometry'] if route else [from_point, to_point]

    return {
        'mode': mode,
        'loop_code': None,
        'loop_name': None,
        'from_node': from_point,
        'to_node': to_point,
        'distance_km': round(distance, 3),
        'estimated_duration_min': duration,
        'geometry': geometry,
        'fare': fare,
        'instruction': instruction,
        'is_estimated': route is None,
    }


def _collapse_legs(steps: list[EdgeStep]) -> list[dict]:
    legs: list[dict] = []
    for step in steps:
        if step.edge is not None and step.edge.distance_km is None:
            continue

        points, distance, minutes, is_estimated = _edge_geometry(step)
        key = (step.mode, step.loop_code)

        if legs and legs[-1]['_key'] == key:
            legs[-1]['distance_km'] += distance
            legs[-1]['estimated_duration_min'] += minutes
            legs[-1]['to_node'] = points[-1]
            legs[-1]['geometry'].extend(points[1:])
            legs[-1]['is_estimated'] = legs[-1]['is_estimated'] or is_estimated
        else:
            legs.append({
                '_key': key,
                'mode': step.mode,
                'loop_code': step.loop_code,
                'loop_name': step.loop_name,
                'from_node': points[0],
                'to_node': points[-1],
                'distance_km': distance,
                'estimated_duration_min': minutes,
                'geometry': points,
                'is_estimated': is_estimated,
            })

    output = []
    for leg in legs:
        distance = round(leg['distance_km'], 3)
        duration = max(1, math.ceil(leg['estimated_duration_min']))
        if leg['mode'] == 'JEEPNEY':
            fare = _jeepney_fare(distance)
        elif leg['mode'] == 'WALKING':
            fare = 0.0
        else:
            fare = _tricycle_fare(distance)
        instruction = (
            f"Ride {leg['loop_name']} from {leg['from_node']['name'] or 'node'} "
            f"to {leg['to_node']['name'] or 'node'}"
            if leg['mode'] == 'JEEPNEY'
            else (
                f"Walk from {leg['from_node']['name'] or 'node'} "
                f"to {leg['to_node']['name'] or 'the next point'}"
                if leg['mode'] == 'WALKING'
                else f"Take a tricycle from {leg['from_node']['name'] or 'node'} "
                f"to {leg['to_node']['name'] or 'the next point'}"
            )
        )
        clean = {k: v for k, v in leg.items() if k != '_key'}
        clean.update({
            'distance_km': distance,
            'estimated_duration_min': duration,
            'fare': fare,
            'instruction': instruction,
        })
        output.append(clean)
    return output


def _build_route_result(
    origin_point: dict,
    destination_point: dict,
    origin_node: GraphNode,
    destination_node: GraphNode,
    steps: list[EdgeStep],
    routing_model: str = 'GRAPH_DIJKSTRA',
) -> dict | None:
    origin_node_payload = _node_payload(origin_node)
    destination_node_payload = _node_payload(destination_node)

    if not steps:
        direct_leg = _connector_leg(
            'Walk/Tricycle from Origin to Destination',
            origin_point,
            destination_point,
        )
        legs = [direct_leg] if direct_leg else []
    else:
        legs = []
        origin_connector = _connector_leg(
            f"Walk/Tricycle from Origin to {origin_node.name or 'nearest loop node'}",
            origin_point,
            origin_node_payload,
        )
        if origin_connector:
            legs.append(origin_connector)
        legs.extend(_collapse_legs(steps))
        destination_connector = _connector_leg(
            f"Walk/Tricycle from {destination_node.name or 'nearest loop node'} to Destination",
            destination_node_payload,
            destination_point,
        )
        if destination_connector:
            legs.append(destination_connector)

    if not legs:
        return None

    total_distance = round(sum(leg['distance_km'] for leg in legs), 3)
    total_fare = _money(sum(Decimal(str(leg['fare'])) for leg in legs))
    total_duration = sum(leg['estimated_duration_min'] for leg in legs)

    return {
        'routing_model': routing_model,
        'legs': legs,
        'total_fare': total_fare,
        'total_distance_km': total_distance,
        'total_duration_min': total_duration,
        'transfer_count': max(0, sum(1 for leg in legs if leg['mode'] == 'JEEPNEY') - 1),
        'geometry': [
            point
            for leg in legs
            for point in leg['geometry']
        ],
    }


def _route_signature(route: dict) -> tuple:
    return tuple(
        (
            leg.get('mode'),
            leg.get('loop_code'),
            leg.get('from_node', {}).get('node_id'),
            leg.get('to_node', {}).get('node_id'),
        )
        for leg in route['legs']
    )


def _commuter_route_signature(route: dict) -> tuple:
    """
    Collapse a route into the sequence a commuter actually sees.

    Nearby candidate nodes can create several technically different graph paths
    that still read as the same commute, such as Tricycle -> same Jeepney Loop
    -> Walk. Those should not be presented as separate suggestions.
    """
    signature = []
    for leg in route['legs']:
        mode = leg.get('mode')
        if mode == 'JEEPNEY':
            token = ('JEEPNEY', leg.get('loop_code') or leg.get('loop_name'))
        elif mode in {'TRICYCLE', 'WALKING'}:
            token = (mode,)
        else:
            token = (mode, leg.get('transport_mode_name'))

        if signature and signature[-1] == token:
            continue
        signature.append(token)

    return tuple(signature)


def _route_sort_key(route: dict) -> tuple:
    return (
        route['total_fare'],
        route['total_distance_km'],
        route['total_duration_min'],
        route['transfer_count'],
    )


def _dedupe_commuter_routes(route_options: list[dict]) -> list[dict]:
    best_by_signature: dict[tuple, dict] = {}
    for route in route_options:
        signature = _commuter_route_signature(route)
        current = best_by_signature.get(signature)
        if current is None or _route_sort_key(route) < _route_sort_key(current):
            best_by_signature[signature] = route

    return sorted(best_by_signature.values(), key=_route_sort_key)


def _jeepney_loop_count(route: dict) -> int:
    return len({
        leg.get('loop_code')
        for leg in route['legs']
        if leg.get('mode') == 'JEEPNEY' and leg.get('loop_code')
    })


def _non_jeepney_distance(route: dict) -> float:
    return sum(
        leg.get('distance_km', 0)
        for leg in route['legs']
        if leg.get('mode') != 'JEEPNEY'
    )


def _rank_route_options(route_options: list[dict], limit: int = 4) -> list[dict]:
    return _dedupe_commuter_routes(route_options)[:limit]


def find_graph_route(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> dict:
    origin_node = nearest_node(origin_lat, origin_lng)
    destination_node = nearest_node(dest_lat, dest_lng)
    if not origin_node or not destination_node:
        return {
            'result_count': 0,
            'results': [],
            'error': 'No graph nodes are available for routing.',
        }

    origin_point = _virtual_point('Origin', origin_lat, origin_lng)
    destination_point = _virtual_point('Destination', dest_lat, dest_lng)
    origin_node_payload = _node_payload(origin_node)
    destination_node_payload = _node_payload(destination_node)

    route_options: list[dict] = []
    seen = set()
    for origin_candidate in nearest_nodes(origin_lat, origin_lng, limit=5):
        for destination_candidate in nearest_nodes(dest_lat, dest_lng, limit=5):
            steps = _dijkstra(
                origin_candidate.graph_node_id,
                destination_candidate.graph_node_id,
            )
            if not steps and origin_candidate.graph_node_id != destination_candidate.graph_node_id:
                continue

            route = _build_route_result(
                origin_point,
                destination_point,
                origin_candidate,
                destination_candidate,
                steps,
            )
            if not route:
                continue
            signature = _route_signature(route)
            if signature in seen:
                continue
            seen.add(signature)
            route_options.append(route)

    if not route_options:
        connected_path = _best_connected_node_path(
            origin_lat,
            origin_lng,
            dest_lat,
            dest_lng,
        )
        if connected_path:
            connected_origin, connected_destination, steps = connected_path
            route = _build_route_result(
                origin_point,
                destination_point,
                connected_origin,
                connected_destination,
                steps,
                'GRAPH_DIJKSTRA_TRANSFER_FALLBACK',
            )
            if route:
                route_options.append(route)
        else:
            fallback = _fallback_cross_component_route(
                origin_point,
                origin_node_payload,
                destination_node_payload,
                destination_point,
                origin_node,
                destination_node,
            )
            return fallback

    route_options = _rank_route_options(route_options)

    return {
        'result_count': len(route_options),
        'origin_node': _node_payload(origin_node),
        'destination_node': _node_payload(destination_node),
        'results': route_options,
    }


def _fallback_cross_component_route(
    origin_point: dict,
    origin_node_payload: dict,
    destination_node_payload: dict,
    destination_point: dict,
    origin_node: GraphNode,
    destination_node: GraphNode,
) -> dict:
    legs = []
    origin_connector = _connector_leg(
        f"Walk/Tricycle from Origin to {origin_node.name or 'nearest loop node'}",
        origin_point,
        origin_node_payload,
    )
    if origin_connector:
        legs.append(origin_connector)

    transfer_connector = _connector_leg(
        f"Walk/Tricycle from {origin_node.name or 'nearest loop node'} "
        f"to {destination_node.name or 'destination loop node'}",
        origin_node_payload,
        destination_node_payload,
    )
    if transfer_connector:
        legs.append(transfer_connector)

    destination_connector = _connector_leg(
        f"Walk/Tricycle from {destination_node.name or 'nearest loop node'} to Destination",
        destination_node_payload,
        destination_point,
    )
    if destination_connector:
        legs.append(destination_connector)

    total_distance = round(sum(leg['distance_km'] for leg in legs), 3)
    total_fare = _money(sum(Decimal(str(leg['fare'])) for leg in legs))
    total_duration = sum(leg['estimated_duration_min'] for leg in legs)

    return {
        'result_count': 1 if legs else 0,
        'origin_node': origin_node_payload,
        'destination_node': destination_node_payload,
        'results': [{
            'routing_model': 'GRAPH_DIJKSTRA_TRANSFER_FALLBACK',
            'legs': legs,
            'total_fare': total_fare,
            'total_distance_km': total_distance,
            'total_duration_min': total_duration,
            'transfer_count': 0,
            'geometry': [
                point
                for leg in legs
                for point in leg['geometry']
            ],
        }] if legs else [],
    }


def active_loop_polylines() -> list[dict]:
    loops = JeepneyLoopEdge.objects.filter(
        is_active=True,
        loop__is_active=True,
        edge__is_active=True,
    ).select_related(
        'loop',
        'edge__from_node',
        'edge__to_node',
    ).order_by('loop_id', 'sequence_order')

    grouped: dict[int, dict] = {}
    for tag in loops:
        entry = grouped.setdefault(tag.loop_id, {
            'loop_id': tag.loop_id,
            'code': tag.loop.code,
            'name': tag.loop.name,
            'geometry': [],
            'nodes': [],
        })
        edge = tag.edge
        from_node = _node_payload(edge.from_node)
        to_node = _node_payload(edge.to_node)

        if not entry['nodes']:
            entry['nodes'].append(from_node)
        entry['nodes'].append(to_node)

    for entry in grouped.values():
        geometry = []
        node_pairs = zip(entry['nodes'], entry['nodes'][1:])
        for first_payload, second_payload in node_pairs:
            straight_distance = haversine_km(
                first_payload['latitude'],
                first_payload['longitude'],
                second_payload['latitude'],
                second_payload['longitude'],
            )
            road_route = _road_route('driving', first_payload, second_payload)
            if _road_route_stays_on_corridor(
                road_route,
                first_payload,
                second_payload,
                straight_distance,
            ):
                points = road_route['geometry']
            else:
                points = [first_payload, second_payload]

            if geometry:
                geometry.extend(points[1:])
            else:
                geometry.extend(points)

        entry['geometry'] = geometry if geometry else entry['nodes']

    return list(grouped.values())
