from django.db import transaction
from django.db.models import F
from transitph.models import (
    Route,
    RouteStation,
    Station
)

class RouteService:

    @staticmethod
    @transaction.atomic
    def add_station_to_route(
        route_id,
        station_id,
        sequence_order
    ):

        route=Route.objects.get(
            id=route_id
        )

        station=Station.objects.get(
            id=station_id
        )

        duplicate=RouteStation.objects.filter(
            route=route,
            station=station
        ).exists()

        if duplicate:
            raise ValueError(
                "Station already exists in route"
            )


        RouteStation.objects.filter(
            route=route,
            sequence_order__gte=sequence_order
        ).update(
            sequence_order=
            F('sequence_order')+1
        )


        route_station=RouteStation.objects.create(
            route=route,
            station=station,
            sequence_order=sequence_order
        )

        return route_station


    @staticmethod
    @transaction.atomic
    def remove_station_from_route(
        route_id,
        station_id
    ):

        route_station=RouteStation.objects.get(
            route_id=route_id,
            station_id=station_id
        )

        removed_position=route_station.sequence_order

        route_station.delete()


        RouteStation.objects.filter(
            route_id=route_id,
            sequence_order__gt=removed_position
        ).update(
            sequence_order=
            F('sequence_order')-1
        )


    @staticmethod
    @transaction.atomic
    def update_route_information(
        route_id,
        route_name=None,
        route_code=None
    ):

        route=Route.objects.get(
            id=route_id
        )


        if route_name:
            route.name=route_name


        if route_code:
            route.route_code=route_code


        route.save()

        return route


    @staticmethod
    def get_route_stations(
        route_id
    ):

        return RouteStation.objects.filter(
            route_id=route_id
        ).order_by(
            'sequence_order'
        )