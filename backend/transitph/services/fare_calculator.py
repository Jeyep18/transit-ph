"""
Fare calculation service using the active FareMatrix from the database.

Implements BR-FCM-02:
    fare = base_fare + max(0, distance_km - base_km) * incremental_rate

All fares are rounded to 2 decimal places (BR-FCM-04).
"""
from decimal import Decimal, ROUND_HALF_UP
from ..models import FareMatrix, TransportMode


def get_active_fare_matrix(transport_mode_id: int) -> FareMatrix | None:
    """Return the single active fare matrix for the given transport mode, or None."""
    try:
        return FareMatrix.objects.get(transport_mode_id=transport_mode_id, is_active=True)
    except FareMatrix.DoesNotExist:
        return None


def compute_fare(distance_km: Decimal | float, fare_matrix: FareMatrix) -> Decimal:
    """
    Compute the fare for a given distance using the supplied fare matrix.

    Returns the fare rounded to 2 decimal places.
    """
    distance = Decimal(str(distance_km))
    base_fare = fare_matrix.base_fare
    base_km = fare_matrix.base_km
    rate = fare_matrix.incremental_rate

    extra_km = max(Decimal('0'), distance - base_km)
    fare = base_fare + extra_km * rate
    return fare.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def compute_leg_fare(distance_km: float, transport_mode_id: int) -> dict:
    """
    Compute fare for a single route leg.

    Returns dict with 'fare', 'is_estimated', and 'fare_matrix_id',
    or None if no active fare matrix exists.
    """
    fm = get_active_fare_matrix(transport_mode_id)
    if fm is None:
        return None

    fare = compute_fare(distance_km, fm)
    return {
        'fare': float(fare),
        'is_estimated': False,
        'fare_matrix_id': fm.fare_matrix_id,
        'base_fare': float(fm.base_fare),
        'base_km': float(fm.base_km),
        'incremental_rate': float(fm.incremental_rate),
    }
