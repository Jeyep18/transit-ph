# backend/create_test_data.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from transitph.models import TransportMode, Station, Route, RouteStation

# transport mode
jeepney, _ = TransportMode.objects.get_or_create(
    code='JEP',
    defaults={
        'name': 'Jeepney',
        'description': 'Public utility jeepney'
    }
)
print("✓ Transport mode created")

# test stations
stations_data = [
    {"name": "Manila City Hall", "lat": 14.5898, "lon": 120.9822, "address": "Manila City Hall, Padre Burgos Ave, Ermita, Manila"},
    {"name": "Quezon Memorial Circle", "lat": 14.6516, "lon": 121.0481, "address": "Quezon Memorial Circle, Elliptical Rd, Quezon City"},
    {"name": "Lawton", "lat": 14.5900, "lon": 120.9830, "address": "Lawton, Manila"},
    {"name": "Cubao", "lat": 14.6200, "lon": 121.0530, "address": "Cubao, Quezon City"},
]

stations = []
for s in stations_data:
    station, _ = Station.objects.get_or_create(
        name=s["name"],
        defaults={
            'station_type': 'JEEPNEY_STOP',
            'latitude': s["lat"],
            'longitude': s["lon"],
            'address': s["address"],
            'is_active': True
        }
    )
    stations.append(station)
    print(f"✓ Station created: {station.name}")

# test route
route, _ = Route.objects.get_or_create(
    route_code='TEST-01',
    defaults={
        'name': 'Test Route',
        'transport_mode': jeepney,
        'origin_station': stations[0],
        'terminal_station': stations[1],
        'estimated_duration_min': 30,
        'is_active': True
    }
)
print(f"✓ Route created: {route.route_code}")

# test route stations
for i, station in enumerate(stations[:3], 1):
    route_station, _ = RouteStation.objects.get_or_create(
        route=route,
        station=station,
        defaults={'sequence_order': i}
    )
    print(f"✓ Added to route: {station.name} (order {i})")

print("\n✅ Test data created successfully!")