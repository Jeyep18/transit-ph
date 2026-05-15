from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from transitph.services.route_service import RouteService

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
        detail=True,
        methods=['post']
    )
    def add_station(
        self,
        request,
        pk=None
    ):

        try:

            RouteService.add_station_to_route(

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

            RouteService.remove_station_from_route(

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