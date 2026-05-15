from rest_framework import serializers
from .models import (
    Station,
    Route,
    RouteStation,
    FareMatrix
)

class StationSerializer(serializers.ModelSerializer):
    class Meta:
        model=Station
        fields='__all__'


class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model=Route
        fields='__all__'


class FareMatrixSerializer(serializers.ModelSerializer):
    class Meta:
        model=FareMatrix
        fields='__all__'


class RouteStationSerializer(serializers.ModelSerializer):
    class Meta:
        model=RouteStation
        fields='__all__'