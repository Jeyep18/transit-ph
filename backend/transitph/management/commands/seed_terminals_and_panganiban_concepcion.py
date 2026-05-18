from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from transitph.models import (
    Admin,
    GraphEdge,
    GraphNode,
    JeepneyLoop,
    JeepneyLoopEdge,
    Station,
    haversine_km,
)


TERMINALS = [
    ('Ateneo Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.630258, 123.185606),
    ('Gen. Luna St. Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.624534, 123.185006),
    ('Mabolo Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.614076, 123.182542),
    ('Robinsons Place Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.615498, 123.192786),
    ('Eastbound Van/Jeep Terminal', 'JEEPNEY_TERMINAL', 13.618733, 123.193513),
    ('SM City Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.620371, 123.189413),
    ('Abella Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.622713, 123.183579),
    ('Greenland Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.620777, 123.203845),
    ('Naga City Science Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.627352, 123.204935),
    ('Balatas Rd. Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.631555, 123.196936),
    ('LCC CBD Tricycle Terminal', 'TRICYCLE_TERMINAL', 13.619658, 123.189029),
    ('Bicol Central Bus Station', 'BUS_TERMINAL', 13.619215, 123.189704),
    ("Naga City People's Market Tricycle/Jeep Terminal", 'MIXED_TERMINAL', 13.620581, 123.183772),
]

PANGANIBAN_CONCEPCION_NODES = [
    (13.623127, 123.185956),
    (13.622923, 123.187537),
    (13.622584, 123.189876),
    (13.622183, 123.192902),
    (13.621911, 123.194744),
    (13.621415, 123.198290),
    (13.621030, 123.200707),
    (13.620931, 123.201417),
    (13.620941, 123.203795),
    (13.621119, 123.206228),
    (13.621166, 123.207627),
    (13.620914, 123.209500),
    (13.621020, 123.211564),
    (13.621807, 123.213517),
    (13.621698, 123.215073),
    (13.621562, 123.217552),
    (13.620905, 123.219686),
    (13.619479, 123.221373),
    (13.617793, 123.225007),
    (13.616839, 123.227384),
    (13.617734, 123.231332),
    (13.618136, 123.233808),
    (13.617308, 123.237466),
    (13.616186, 123.241532),
]


class Command(BaseCommand):
    help = 'Add public terminal markers and the Panganiban-Concepcion jeepney line.'

    @transaction.atomic
    def handle(self, *args, **options):
        admin = Admin.objects.filter(is_active=True).order_by('id').first()
        terminal_names = {name for name, _station_type, _lat, _lng in TERMINALS}
        Station.objects.exclude(name__in=terminal_names).update(
            is_active=False,
            updated_by=admin,
        )

        terminal_count = 0
        for name, station_type, lat, lng in TERMINALS:
            Station.objects.update_or_create(
                name=name,
                defaults={
                    'station_type': station_type,
                    'latitude': Decimal(str(lat)),
                    'longitude': Decimal(str(lng)),
                    'address': 'Naga City terminal point',
                    'is_active': True,
                    'updated_by': admin,
                },
            )
            terminal_count += 1

        loop, _ = JeepneyLoop.objects.update_or_create(
            code='PANGANIBAN-CONCEPCION',
            defaults={
                'name': 'Panganiban - Concepcion Loop',
                'description': 'Bidirectional jeepney line along Panganiban-Concepcion Road.',
                'is_active': True,
                'updated_by': admin,
            },
        )

        old_edge_ids = list(
            JeepneyLoopEdge.objects.filter(loop=loop).values_list('edge_id', flat=True)
        )
        JeepneyLoopEdge.objects.filter(loop=loop).delete()
        GraphEdge.objects.filter(pk__in=old_edge_ids).delete()
        GraphNode.objects.filter(name__startswith='Panganiban-Concepcion node').delete()

        nodes = []
        for index, (lat, lng) in enumerate(PANGANIBAN_CONCEPCION_NODES, start=1):
            node = GraphNode.objects.create(
                name=f'Panganiban-Concepcion node {index:02d}',
                node_type='POI',
                latitude=Decimal(str(lat)),
                longitude=Decimal(str(lng)),
                is_active=True,
                updated_by=admin,
            )
            nodes.append(node)

        for index, (from_node, to_node) in enumerate(zip(nodes, nodes[1:]), start=1):
            distance_km = haversine_km(
                from_node.latitude,
                from_node.longitude,
                to_node.latitude,
                to_node.longitude,
            )
            edge = GraphEdge.objects.create(
                from_node=from_node,
                to_node=to_node,
                distance_km=Decimal(str(round(distance_km, 3))),
                travel_time_min=Decimal(str(max(1, distance_km / 18 * 60))).quantize(Decimal('0.01')),
                is_bidirectional=True,
                is_active=True,
                updated_by=admin,
            )
            JeepneyLoopEdge.objects.create(
                loop=loop,
                edge=edge,
                sequence_order=index,
                is_active=True,
                updated_by=admin,
            )

        self.stdout.write(self.style.SUCCESS(
            f'Added/updated {terminal_count} terminals and {len(nodes)} Panganiban-Concepcion nodes.'
        ))
