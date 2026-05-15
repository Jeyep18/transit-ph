from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status
from transitph.services.fare_service import compute_leg_fare
from transitph.services.route_service import (
    add_station_to_route,
    remove_station_from_route
)

from .models import (
    Station,
    Route,
    FareMatrix,
    RouteStation
)

from .serializers import (
    StationSerializer,
    RouteSerializer,
    FareMatrixSerializer,
    RouteStationSerializer
)


class StationViewSet(viewsets.ModelViewSet):

    queryset=Station.objects.all()

    serializer_class=StationSerializer


class RouteViewSet(viewsets.ModelViewSet):

    queryset=Route.objects.all()

    serializer_class=RouteSerializer

    @action(
        detail=False,
        methods=['get'],
        url_path='calculate-fare'
    )
    def calculate_fare(self, request):

        origin_station_id = request.query_params.get(
            'origin_station_id'
        )

        destination_station_id = request.query_params.get(
            'destination_station_id'
        )

        transport_mode_id = request.query_params.get(
            'transport_mode_id'
        )

        if not all([
            origin_station_id,
            destination_station_id,
            transport_mode_id
        ]):

            return Response(
                {
                    'error': 'Missing required query parameters.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            fare = compute_leg_fare(
                origin_station_id,
                destination_station_id,
                transport_mode_id
            )

            return Response(
                {
                    'fare': fare
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:

            return Response(
                {
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )


    @action(
        detail=True,
        methods=['post']
    )
    def add_station(
        self,
        request,
        pk=None
    ):

        try:

            add_station_to_route(

                route_id=pk,

                station_id=request.data[
                    'station_id'
                ],

                sequence_order=request.data[
                    'sequence_order'
                ]

            )


            return Response(
                {
                    "message":
                    "Station added"
                }
            )


        except Exception as e:

            return Response(
                {
                    "error":str(e)
                },
                status=400
            )


    @action(
        detail=True,
        methods=['delete']
    )
    def remove_station(
        self,
        request,
        pk=None
    ):

        try:

            remove_station_from_route(

                route_id=pk,

                station_id=request.data[
                    'station_id'
                ]

            )


            return Response(
                {
                    "message":
                    "Station removed"
                }
            )


        except Exception as e:

            return Response(
                {
                    "error":str(e)
                },
                status=400
            )


class FareMatrixViewSet(viewsets.ModelViewSet):

    queryset=FareMatrix.objects.all()

    serializer_class=FareMatrixSerializer


class RouteStationViewSet(viewsets.ModelViewSet):

    queryset=RouteStation.objects.all()

    serializer_class=RouteStationSerializer