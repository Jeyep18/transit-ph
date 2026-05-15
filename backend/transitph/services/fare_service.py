from decimal import Decimal


def compute_leg_fare(distance, fare_matrix):

    excess=max(
        Decimal('0'),
        Decimal(distance)-fare_matrix.base_km
    )

    fare=(
        fare_matrix.base_fare
        +(excess*fare_matrix.incremental_rate)
    )

    return round(fare,2)