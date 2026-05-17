"""
Management command to seed the database with initial data.

Creates:
- Default admin account (admin / Admin123!)
- Jeepney transport mode
- Active fare matrix (LTFRB rates)
- Sample Naga City jeepney stations and routes

Usage:
    python manage.py seed_data
    python manage.py seed_data --flush   # Delete all data first
"""
from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from transitph.models import (
    Admin,
    FareMatrix,
    GraphEdge,
    GraphNode,
    JeepneyLoop,
    JeepneyLoopEdge,
    Route,
    RouteStation,
    Station,
    TransportMode,
    haversine_km,
)
from transitph.authentication import hash_password


class Command(BaseCommand):
    help = 'Seed the database with initial TransitPH data for Naga City.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Delete all existing data before seeding.',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write(self.style.WARNING('Flushing existing data...'))
            RouteStation.objects.all().delete()
            JeepneyLoopEdge.objects.all().delete()
            JeepneyLoop.objects.all().delete()
            GraphEdge.objects.all().delete()
            GraphNode.objects.all().delete()
            Route.objects.all().delete()
            FareMatrix.objects.all().delete()
            Station.objects.all().delete()
            TransportMode.objects.all().delete()
            Admin.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('All data flushed.'))

        # ─── 1. Admin Account ─────────────────────────────────────────
        admin, created = Admin.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@transitph.local',
                'password_hash': hash_password('Admin123!'),
                'is_active': True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Admin created (admin / Admin123!)'))
        else:
            self.stdout.write('  Admin already exists, skipping.')

        # ─── 2. Transport Mode ────────────────────────────────────────
        jeepney, created = TransportMode.objects.get_or_create(
            code='JEP',
            defaults={
                'name': 'Jeepney',
                'description': 'Traditional Philippine public utility jeepney.',
                'is_active': True,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Transport mode "Jeepney" (JEP) created.'))
        else:
            self.stdout.write('  Transport mode JEP already exists, skipping.')

        # ─── 3. Fare Matrix (LTFRB rates) ─────────────────────────────
        fm, created = FareMatrix.objects.get_or_create(
            transport_mode=jeepney,
            is_active=True,
            defaults={
                'base_fare': Decimal('13.00'),
                'base_km': Decimal('4.00'),
                'incremental_rate': Decimal('1.80'),
                'effective_date': date(2024, 1, 1),
                'updated_by': admin,
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS(
                '✓ Fare matrix created: ₱13.00 base (4 km) + ₱1.80/km'
            ))
        else:
            self.stdout.write('  Active fare matrix already exists, skipping.')

        # ─── 4. Stations (Naga City Jeepney Stops) ────────────────────
        station_data = [
            # (name, type, lat, lon, address)
            ('SM City Naga', 'JEEPNEY_STOP', 13.6265, 123.1875, 'Central Business District 2, Naga City'),
            ('Naga City Hall', 'JEEPNEY_STOP', 13.6219, 123.1948, 'J. Miranda Ave, Naga City'),
            ('Panganiban Drive', 'JEEPNEY_STOP', 13.6235, 123.1932, 'Panganiban Drive, Naga City'),
            ('Naga Cathedral', 'JEEPNEY_STOP', 13.6197, 123.1944, 'Near Plaza Quince Martires, Naga City'),
            ('Ateneo de Naga', 'JEEPNEY_STOP', 13.6380, 123.1835, 'Ateneo Ave, Naga City'),
            ('USS Naga', 'JEEPNEY_STOP', 13.6150, 123.1900, 'University of Saint Anthony, Naga City'),
            ('Pacific Mall', 'JEEPNEY_STOP', 13.6210, 123.1870, 'Magsaysay Ave, Naga City'),
            ('Robinsons Naga', 'JEEPNEY_STOP', 13.6170, 123.1990, 'Elias Angeles St, Naga City'),
            ('Concepcion Pequeña', 'JEEPNEY_STOP', 13.6300, 123.1910, 'Concepcion Pequeña, Naga City'),
            ('Peñafrancia Basilica', 'JEEPNEY_STOP', 13.6160, 123.1950, 'Peñafrancia Ave, Naga City'),
            ('Magsaysay Crossing', 'JEEPNEY_STOP', 13.6225, 123.1860, 'Magsaysay Ave, Naga City'),
            ('CBD Terminal', 'JEEPNEY_STOP', 13.6250, 123.1895, 'Central Business District, Naga City'),

            # Tricycle terminals (connection advisory only)
            ('Concepcion Grande Terminal', 'TRICYCLE_TERMINAL', 13.6340, 123.1870, 'Concepcion Grande, Naga City'),
            ('San Felipe Terminal', 'TRICYCLE_TERMINAL', 13.6100, 123.2020, 'San Felipe, Naga City'),
        ]

        stations = {}
        for name, stype, lat, lng, addr in station_data:
            # Use get_or_create to avoid duplicate station errors
            station, created = Station.objects.get_or_create(
                name=name,
                defaults={
                    'station_type': stype,
                    'latitude': Decimal(str(lat)),
                    'longitude': Decimal(str(lng)),
                    'address': addr,
                    'is_active': True,
                    'updated_by': admin,
                },
            )
            stations[name] = station
            if created:
                self.stdout.write(self.style.SUCCESS(f'  ✓ Station: {name} ({stype})'))

        # ─── 5. Routes ────────────────────────────────────────────────
        route_data = [
            {
                'route_code': 'CBD-ATENEO',
                'name': 'CBD to Ateneo',
                'origin': 'CBD Terminal',
                'terminal': 'Ateneo de Naga',
                'stations': [
                    ('CBD Terminal', 0),
                    ('SM City Naga', 0.5),
                    ('Concepcion Pequeña', 0.8),
                    ('Ateneo de Naga', 1.5),
                ],
                'duration': 20,
            },
            {
                'route_code': 'CBD-PENA',
                'name': 'CBD to Peñafrancia',
                'origin': 'CBD Terminal',
                'terminal': 'Peñafrancia Basilica',
                'stations': [
                    ('CBD Terminal', 0),
                    ('Magsaysay Crossing', 0.3),
                    ('Pacific Mall', 0.5),
                    ('Naga City Hall', 0.7),
                    ('Naga Cathedral', 0.4),
                    ('Peñafrancia Basilica', 0.5),
                ],
                'duration': 15,
            },
            {
                'route_code': 'SM-ROB',
                'name': 'SM to Robinsons',
                'origin': 'SM City Naga',
                'terminal': 'Robinsons Naga',
                'stations': [
                    ('SM City Naga', 0),
                    ('CBD Terminal', 0.5),
                    ('Magsaysay Crossing', 0.4),
                    ('Pacific Mall', 0.3),
                    ('Naga City Hall', 0.6),
                    ('Robinsons Naga', 0.8),
                ],
                'duration': 18,
            },
            {
                'route_code': 'ATENEO-ROB',
                'name': 'Ateneo to Robinsons',
                'origin': 'Ateneo de Naga',
                'terminal': 'Robinsons Naga',
                'stations': [
                    ('Ateneo de Naga', 0),
                    ('Concepcion Pequeña', 1.5),
                    ('SM City Naga', 0.8),
                    ('Panganiban Drive', 0.5),
                    ('Naga City Hall', 0.3),
                    ('Robinsons Naga', 0.9),
                ],
                'duration': 25,
            },
        ]

        for rd in route_data:
            route, created = Route.objects.get_or_create(
                route_code=rd['route_code'],
                defaults={
                    'name': rd['name'],
                    'transport_mode': jeepney,
                    'origin_station': stations[rd['origin']],
                    'terminal_station': stations[rd['terminal']],
                    'estimated_duration_min': rd['duration'],
                    'is_active': True,
                    'updated_by': admin,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(
                    f'  ✓ Route: {rd["route_code"]} ({rd["name"]})'
                ))

                # Create route stations with sequence
                for idx, (station_name, dist) in enumerate(rd['stations'], start=1):
                    RouteStation.objects.create(
                        route=route,
                        station=stations[station_name],
                        sequence_order=idx,
                        distance_from_prev_km=Decimal(str(dist)) if dist > 0 else None,
                        updated_by=admin,
                    )
            else:
                self.stdout.write(f'  Route {rd["route_code"]} already exists, skipping.')

        # Graph routing seed: replace old sample loops with current jeepney loop coverage.
        JeepneyLoopEdge.objects.all().delete()
        JeepneyLoop.objects.all().delete()
        GraphEdge.objects.all().delete()
        GraphNode.objects.all().delete()

        loop_definitions = [
            {
                'code': 'PANGANIBAN-MAGSAYSAY',
                'name': 'Panganiban to Magsaysay Loop',
                'description': 'Loop traced from the provided Panganiban-Magsaysay reference map.',
                'nodes': [
                    ('Panganiban-Dinaga Bridge', 13.623900, 123.190100),
                    ('Panganiban west stop', 13.623720, 123.192050),
                    ('Panganiban central stop', 13.623520, 123.194760),
                    ('Panganiban-Concepcion corner', 13.623220, 123.199820),
                    ('Magsaysay south turn', 13.624650, 123.200160),
                    ('Magsaysay middle stop', 13.626260, 123.200260),
                    ('Magsaysay-Dayangdang turn', 13.627420, 123.199260),
                    ('Magsaysay-Penafrancia bridge', 13.629320, 123.197050),
                    ('Penafrancia top turn', 13.630620, 123.195520),
                    ('Penafrancia Avenue stop', 13.628520, 123.193050),
                    ('Penafrancia-San Francisco turn', 13.626080, 123.190720),
                    ('Elias Angeles connector', 13.624720, 123.188920),
                ],
            },
            {
                'code': 'MAGSAYSAY-DIVERSION',
                'name': 'Magsaysay - Diversion Loop',
                'description': 'Loop created from supplied Magsaysay-Diversion coordinates.',
                'nodes': [
                    ('Magsaysay-Diversion node 01', 13.620864, 123.200958),
                    ('Magsaysay-Diversion node 02', 13.617632, 123.197162),
                    ('Magsaysay-Diversion node 03', 13.615755, 123.193642),
                    ('Magsaysay-Diversion node 04', 13.615878, 123.190579),
                    ('Magsaysay-Diversion node 05', 13.618277, 123.190799),
                    ('Magsaysay-Diversion node 06', 13.618894, 123.188866),
                    ('Magsaysay-Diversion node 07', 13.618021, 123.188707),
                    ('Magsaysay-Diversion node 08', 13.616306, 123.187614),
                    ('Magsaysay-Diversion node 09', 13.616414, 123.184304),
                    ('Magsaysay-Diversion node 10', 13.616925, 123.183158),
                    ('Magsaysay-Diversion node 11', 13.621235, 123.184119),
                    ('Magsaysay-Diversion node 12', 13.622546, 123.184384),
                    ('Magsaysay-Diversion node 13', 13.624298, 123.184920),
                    ('Magsaysay-Diversion node 14', 13.624126, 123.185933),
                    ('Magsaysay-Diversion node 15', 13.624668, 123.186249),
                    ('Magsaysay-Diversion node 16', 13.627477, 123.188500),
                    ('Magsaysay-Diversion node 17', 13.630275, 123.191246),
                    ('Magsaysay-Diversion node 18', 13.633276, 123.194684),
                    ('Magsaysay-Diversion node 19', 13.631376, 123.196804),
                    ('Magsaysay-Diversion node 20', 13.626233, 123.200927),
                    ('Magsaysay-Diversion node 21', 13.620978, 123.200949),
                ],
            },
        ]

        for loop_data in loop_definitions:
            graph_nodes = []
            for name, lat, lng in loop_data['nodes']:
                node = GraphNode.objects.create(
                    name=name,
                    node_type='POI',
                    latitude=Decimal(str(lat)),
                    longitude=Decimal(str(lng)),
                    is_active=True,
                    updated_by=admin,
                )
                graph_nodes.append(node)

            loop = JeepneyLoop.objects.create(
                code=loop_data['code'],
                name=loop_data['name'],
                description=loop_data['description'],
                is_active=True,
                updated_by=admin,
            )

            loop_pairs = list(zip(graph_nodes, graph_nodes[1:])) + [(graph_nodes[-1], graph_nodes[0])]
            for idx, (from_node, to_node) in enumerate(loop_pairs, start=1):
                distance_km = haversine_km(
                    from_node.latitude,
                    from_node.longitude,
                    to_node.latitude,
                    to_node.longitude,
                )
                distance = Decimal(str(round(distance_km, 3)))
                edge = GraphEdge.objects.create(
                    from_node=from_node,
                    to_node=to_node,
                    distance_km=distance,
                    travel_time_min=Decimal(str(max(1, distance_km / 18 * 60))).quantize(Decimal('0.01')),
                    is_bidirectional=True,
                    is_active=True,
                    updated_by=admin,
                )
                JeepneyLoopEdge.objects.create(
                    loop=loop,
                    edge=edge,
                    sequence_order=idx,
                    is_active=True,
                    updated_by=admin,
                )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=== Seed data complete! ==='))
        self.stdout.write(f'  Admins:          {Admin.objects.count()}')
        self.stdout.write(f'  Transport Modes: {TransportMode.objects.count()}')
        self.stdout.write(f'  Fare Matrices:   {FareMatrix.objects.count()}')
        self.stdout.write(f'  Stations:        {Station.objects.count()}')
        self.stdout.write(f'  Routes:          {Route.objects.count()}')
        self.stdout.write(f'  Route Stations:  {RouteStation.objects.count()}')
        self.stdout.write(f'  Graph Nodes:     {GraphNode.objects.count()}')
        self.stdout.write(f'  Graph Edges:     {GraphEdge.objects.count()}')
        self.stdout.write(f'  Jeepney Loops:   {JeepneyLoop.objects.count()}')
