import json
import math
import time
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand
from django.db import transaction

from transitph.models import GraphEdge

OSRM_ROUTE_URL = 'https://router.project-osrm.org/route/v1'
OSRM_USER_AGENT = 'TransitPH/1.0 (local development; contact: admin@transitph.local)'
OSRM_TIMEOUT = 10
REQUEST_DELAY = 0.5  # seconds between requests to avoid rate limiting


class Command(BaseCommand):
    help = 'Pre-compute OSRM road geometry for all GraphEdge records and store in road_geometry field.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Re-compute geometry even if road_geometry is already set.',
        )
        parser.add_argument(
            '--profile',
            default='driving',
            help='OSRM profile (driving, walking, cycling). Default: driving.',
        )

    def _fetch_osrm_geometry(self, from_lat, from_lng, to_lat, to_lng, profile):
        coordinates = f'{from_lng},{from_lat};{to_lng},{to_lat}'
        params = urlencode({
            'overview': 'full',
            'geometries': 'geojson',
            'steps': 'false',
        })
        request = Request(
            f'{OSRM_ROUTE_URL}/{profile}/{coordinates}?{params}',
            headers={
                'Accept': 'application/json',
                'User-Agent': OSRM_USER_AGENT,
            },
        )

        try:
            with urlopen(request, timeout=OSRM_TIMEOUT) as response:
                payload = json.loads(response.read().decode('utf-8'))
        except Exception as exc:
            return None, str(exc)

        routes = payload.get('routes') or []
        if payload.get('code') != 'Ok' or not routes:
            return None, f'OSRM returned code={payload.get("code")}, no routes'

        route = routes[0]
        raw_points = route.get('geometry', {}).get('coordinates') or []
        if len(raw_points) < 2:
            return None, 'Less than 2 points in OSRM response'

        geometry = [
            {
                'latitude': float(lat),
                'longitude': float(lng),
            }
            for lng, lat in raw_points
        ]

        # Replace first/last points with exact node coords for precision
        geometry[0] = {'latitude': float(from_lat), 'longitude': float(from_lng)}
        geometry[-1] = {'latitude': float(to_lat), 'longitude': float(to_lng)}

        return geometry, None

    def handle(self, *args, **options):
        profile = options['profile']
        force = options['force']

        edges = GraphEdge.objects.select_related('from_node', 'to_node').all()
        total = edges.count()
        self.stdout.write(f'Found {total} graph edges to process (profile={profile}).')

        success_count = 0
        skip_count = 0
        fail_count = 0

        for i, edge in enumerate(edges, 1):
            if edge.road_geometry and not force:
                skip_count += 1
                continue

            from_lat = float(edge.from_node.latitude)
            from_lng = float(edge.from_node.longitude)
            to_lat = float(edge.to_node.latitude)
            to_lng = float(edge.to_node.longitude)

            geometry, error = self._fetch_osrm_geometry(
                from_lat, from_lng, to_lat, to_lng, profile
            )

            if geometry is None:
                fail_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'[{i}/{total}] Edge {edge.graph_edge_id}: FAILED ({error})'
                    )
                )
                # Brief pause before retrying next
                time.sleep(REQUEST_DELAY)
                continue

            edge.road_geometry = geometry
            with transaction.atomic():
                edge.save(update_fields=['road_geometry'])

            success_count += 1
            self.stdout.write(
                f'[{i}/{total}] Edge {edge.graph_edge_id}: OK ({len(geometry)} points, {edge.distance_km} km)'
            )

            # Rate limit delay
            if i < total:
                time.sleep(REQUEST_DELAY)

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=== OSRM geometry pre-computation complete! ==='))
        self.stdout.write(f'  Succeeded: {success_count}')
        self.stdout.write(f'  Skipped (already set): {skip_count}')
        self.stdout.write(f'  Failed: {fail_count}')
        if fail_count > 0:
            self.stdout.write(
                self.style.WARNING(
                    '  Some edges failed. Run with --force to retry, or check OSRM availability.'
                )
            )
