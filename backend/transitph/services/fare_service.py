from decimal import Decimal
from transitph.models import (
    FareMatrix,
    RouteStation
)


def compute_leg_fare(
    origin_station_id,
    destination_station_id,
    transport_mode_id
):

    # Find route stations
    origin_rs = RouteStation.objects.filter(
        station__station_id=origin_station_id,
        route__transport_mode__transport_mode_id=transport_mode_id
    ).first()

    destination_rs = RouteStation.objects.filter(
        station__station_id=destination_station_id,
        route__transport_mode__transport_mode_id=transport_mode_id
    ).first()

    if not origin_rs or not destination_rs:
        raise Exception(
            'Origin or destination station not found in route.'
        )

    # Ensure same route
    if origin_rs.route != destination_rs.route:
        raise Exception(
            'Stations are not in the same route.'
        )

    # Ensure proper direction
    if destination_rs.sequence_order <= origin_rs.sequence_order:
        raise Exception(
            'Destination must come after origin station.'
        )

    # Get stations between origin and destination
    route_segments = RouteStation.objects.filter(
        route=origin_rs.route,
        sequence_order__gt=origin_rs.sequence_order,
        sequence_order__lte=destination_rs.sequence_order
    ).order_by('sequence_order')

    total_distance = Decimal('0.00')

    for segment in route_segments:

        if segment.distance_from_prev_km:
            total_distance += segment.distance_from_prev_km

    # Get active fare matrix
    fare_matrix = FareMatrix.objects.filter(
        transport_mode__transport_mode_id=transport_mode_id,
        is_active=True
    ).first()

    if not fare_matrix:
        raise Exception(
            'No active fare matrix found.'
        )

    # Fare calculation
    if total_distance <= fare_matrix.base_km:

        fare = fare_matrix.base_fare

    else:

        excess_distance = (
            total_distance - fare_matrix.base_km
        )

        fare = (
            fare_matrix.base_fare +
            (excess_distance * fare_matrix.incremental_rate)
        )

    return round(fare, 2)