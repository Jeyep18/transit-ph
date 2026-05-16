from django.db import transaction
from django.db.models import F
from django.core.exceptions import ValidationError

from transitph.models import (
    Route,
    Station,
    RouteStation
)


@transaction.atomic
def add_station_to_route(
    route_id,
    station_id,
    sequence_order
):

    route = Route.objects.get(
        route_id=route_id
    )

    station = Station.objects.get(
        station_id=station_id
    )

    # Prevent inactive station usage
    if not station.is_active:
        raise ValidationError(
            'Cannot add inactive station to route.'
        )

    # Prevent duplicate station in same route
    if RouteStation.objects.filter(
        route=route,
        station=station
    ).exists():

        raise ValidationError(
            'Station already exists in this route.'
        )

    existing_count = RouteStation.objects.filter(
        route=route
    ).count()

    if sequence_order < 1:
        raise ValidationError(
            'Sequence order must start at 1.'
        )

    # Prevent skipped numbering
    if sequence_order > existing_count + 1:
        raise ValidationError(
            f'Sequence order cannot exceed {existing_count + 1}.'
        )

    # Shift stations downward
    RouteStation.objects.filter(
        route=route,
        sequence_order__gte=sequence_order
    ).update(
        sequence_order=F('sequence_order') + 1
    )

    route_station = RouteStation.objects.create(
        route=route,
        station=station,
        sequence_order=sequence_order
    )

    return route_station


@transaction.atomic
def remove_station_from_route(
    route_id,
    station_id
):

    route_station = RouteStation.objects.get(
        route__route_id=route_id,
        station__station_id=station_id
    )

    removed_order = route_station.sequence_order

    route_station.delete()

    # Reorder remaining stations
    RouteStation.objects.filter(
        route__route_id=route_id,
        sequence_order__gt=removed_order
    ).update(
        sequence_order=F('sequence_order') - 1
    )

    return True