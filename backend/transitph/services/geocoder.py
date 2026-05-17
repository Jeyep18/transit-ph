from __future__ import annotations

import json
from urllib.parse import urlencode
from urllib.request import Request, urlopen


NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
PHOTON_URL = 'https://photon.komoot.io/api/'
PHILIPPINES_VIEWBOX = '116.0,21.5,127.0,4.5'
NAGA_VIEWBOX = '123.14,13.67,123.25,13.56'
USER_AGENT = 'TransitPH/1.0 (local development; contact: admin@transitph.local)'


def search_osm_locations(query: str) -> list[dict]:
    cleaned = query.strip()
    if len(cleaned) < 3:
        return []

    results = []
    for candidate in _query_variants(cleaned):
        results.extend(_search_nominatim(candidate))
        if results:
            break

    if not results:
        results.extend(_search_photon(cleaned))

    return _dedupe_results(results)[:8]


def _query_variants(query: str) -> list[str]:
    variants = [query]
    if 'philippines' not in query.lower():
        variants.append(f'{query}, Philippines')
    if 'naga' not in query.lower():
        variants.append(f'{query}, Naga City, Camarines Sur, Philippines')
    return variants


def _search_nominatim(query: str) -> list[dict]:
    common_params = {
        'q': query,
        'format': 'json',
        'limit': '10',
        'addressdetails': '1',
        'namedetails': '1',
        'countrycodes': 'ph',
    }
    attempts = [
        {**common_params, 'viewbox': NAGA_VIEWBOX, 'bounded': '1'},
        {**common_params, 'viewbox': PHILIPPINES_VIEWBOX, 'bounded': '1'},
        common_params,
    ]

    for params in attempts:
        payload = _get_json(NOMINATIM_URL, params)
        if not isinstance(payload, list):
            continue

        parsed = [
            _normalize_nominatim_result(item)
            for item in payload
            if _is_philippines_result(item)
        ]
        if parsed:
            return parsed

    return []


def _search_photon(query: str) -> list[dict]:
    payload = _get_json(PHOTON_URL, {
        'q': query,
        'limit': '10',
        'lang': 'en',
        'lon': '123.1948',
        'lat': '13.6218',
    })
    features = payload.get('features', []) if isinstance(payload, dict) else []
    results = []
    for feature in features:
        props = feature.get('properties', {})
        geometry = feature.get('geometry', {})
        coords = geometry.get('coordinates') or []
        if len(coords) < 2 or props.get('countrycode') != 'PH':
            continue
        name_parts = [
            props.get('name'),
            props.get('street'),
            props.get('city') or props.get('county'),
            props.get('state'),
            'Philippines',
        ]
        display_name = ', '.join(part for part in name_parts if part)
        results.append({
            'display_name': display_name,
            'lat': float(coords[1]),
            'lon': float(coords[0]),
            'source': 'photon_osm',
            'importance': props.get('extent') is not None,
        })
    return results


def _get_json(url: str, params: dict) -> object:
    full_url = f'{url}?{urlencode(params)}'
    request = Request(
        full_url,
        headers={
            'Accept': 'application/json',
            'Accept-Language': 'en-PH,en',
            'User-Agent': USER_AGENT,
        },
    )
    try:
        with urlopen(request, timeout=8) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception:
        return [] if url == NOMINATIM_URL else {}


def _normalize_nominatim_result(item: dict) -> dict:
    return {
        'display_name': item.get('display_name', ''),
        'lat': float(item['lat']),
        'lon': float(item['lon']),
        'source': 'nominatim',
        'importance': float(item.get('importance') or 0),
    }


def _is_philippines_result(item: dict) -> bool:
    address = item.get('address') or {}
    return address.get('country_code') == 'ph'


def _dedupe_results(results: list[dict]) -> list[dict]:
    seen = set()
    unique = []
    for result in sorted(results, key=lambda item: item.get('importance', 0), reverse=True):
        key = f"{result['lat']:.6f}-{result['lon']:.6f}"
        if key in seen:
            continue
        seen.add(key)
        unique.append(result)
    return unique
