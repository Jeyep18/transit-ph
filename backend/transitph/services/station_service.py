from transitph.models import Station


def deactivate_station(station_id):

    station=Station.objects.get(
    station_id=station_id
)

    station.is_active=False

    station.save()

    return station