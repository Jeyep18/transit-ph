import math
from decimal import Decimal

from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError


def haversine_km(lat1, lon1, lat2, lon2):
    """Return the great-circle distance in km between two points."""
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(float(lat1)), math.radians(float(lat2))
    dphi = math.radians(float(lat2) - float(lat1))
    dlam = math.radians(float(lon2) - float(lon1))
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Create your models here.

# ADMIN
class Admin(models.Model):
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(
        max_length=80, 
        unique=True, 
        null=False,
        error_messages={'unique': 'Username must be unique.'}
    )
    email = models.CharField(
        max_length=254, 
        unique=True,
        null=False,
        error_messages={'unique': 'Email address must be unique.'}
    )
    password_hash = models.CharField(max_length=255, null=False)  # Bcrypt/Argon2 hash
    is_active = models.BooleanField(
        null=False, 
        default=True
    )
    created_at = models.DateTimeField(
        null=False, 
        default=timezone.now
    )
    last_login_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'admin'
        verbose_name = 'Administrator'
        verbose_name_plural = 'Administrators'
    
    def __str__(self):
        return self.username


# TRANSPORT MODE
class TransportMode(models.Model):
    JEEPNEY_CODE = 'JEP'
    TRANSPORT_CODES = [
        (JEEPNEY_CODE, 'Jeepney'),
        # Add E-Jeeps transpo mode here?
    ]
    
    transport_mode_id = models.BigAutoField(primary_key=True)
    name = models.CharField(
        max_length=60, 
        unique=True, 
        null=False
    )
    code = models.CharField(
        max_length=10, 
        unique=True, 
        null=False,
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9]+$',
                message='Code must be uppercase alphanumeric only.'
            )
        ]
    )
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(
        null=False, 
        default=True  
    )
    
    class Meta:
        db_table = 'transport_mode'
        verbose_name = 'Transport Mode'
        verbose_name_plural = 'Transport Modes'
    
    def __str__(self):
        return self.name
    
    def can_deactivate(self):
        #Check if mode can be deactivated
        return not self.route_set.filter(is_active=True).exists()


# STATION
class Station(models.Model): 
    STATION_TYPES = [
        ('JEEPNEY_STOP', 'Jeepney Stop'),  
        ('TRICYCLE_TERMINAL', 'Tricycle Terminal'),  
    ]
    
    station_id = models.BigAutoField(primary_key=True)
    name = models.CharField(
        max_length=150, 
        unique=True, 
        null=False
    )
    station_type = models.CharField( 
        max_length=20, 
        choices=STATION_TYPES,
        null=False,
        default='JEEPNEY_STOP'
    )
    latitude = models.DecimalField( 
        max_digits=9, 
        decimal_places=6,
        null=False,
        validators=[
            MinValueValidator(Decimal('-90.0')),
            MaxValueValidator(Decimal('90.0'))
        ]
    )
    longitude = models.DecimalField(
        max_digits=9, 
        decimal_places=6,
        null=False,
        validators=[
            MinValueValidator(Decimal('-180.0')),
            MaxValueValidator(Decimal('180.0'))
        ]
    )
    address = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(
        null=False, 
        default=True
    )
    created_at = models.DateTimeField(
        null=False, 
        default=timezone.now
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        Admin, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        db_table = 'station'
        verbose_name = 'Station'
        verbose_name_plural = 'Stations'
    
    def __str__(self):
        return self.name
    
    def can_be_in_route(self):
        # BR-ST-03: Check if station can be in route sequence
        return self.station_type == 'JEEPNEY_STOP'
    
    def clean(self):
        # BR-ST-02: Validate coordinate ranges
        if self.latitude and (self.latitude < -90 or self.latitude > 90):
            raise ValidationError({'latitude': 'Latitude must be between -90 and 90.'})
        if self.longitude and (self.longitude < -180 or self.longitude > 180):
            raise ValidationError({'longitude': 'Longitude must be between -180 and 180.'})

        # BR-ST-02: Reject new stations within 50 meters of an existing active station
        if self.latitude and self.longitude:
            nearby = Station.objects.filter(is_active=True)
            if self.pk:
                nearby = nearby.exclude(pk=self.pk)
            for other in nearby:
                dist = haversine_km(self.latitude, self.longitude, other.latitude, other.longitude)
                if dist < 0.05:  # 50 meters = 0.05 km
                    raise ValidationError(
                        f'A station "{other.name}" already exists within 50 meters of this location.'
                    )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# ROUTE
class Route(models.Model):
    route_id = models.BigAutoField(primary_key=True)
    route_code = models.CharField(
        max_length=30, 
        unique=True, 
        null=False,
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9\-]+$',
                message='Route code must be uppercase alphanumeric with hyphens only, no spaces or special characters.'
            )
        ]
    )
    name = models.CharField(max_length=30, null=False)
    transport_mode = models.ForeignKey( 
        TransportMode, 
        on_delete=models.PROTECT, 
        null=False
    )
    origin_station = models.ForeignKey( 
        Station, 
        on_delete=models.PROTECT,  
        null=False,
        related_name='origin_routes'
    )
    terminal_station = models.ForeignKey(  
        Station, 
        on_delete=models.PROTECT,  
        null=False,
        related_name='terminal_routes'
    )
    estimated_duration_min = models.IntegerField(
        null=True, 
        blank=True,
        validators=[MinValueValidator(1)]
    )
    is_active = models.BooleanField(
        null=False, 
        default=True 
    )
    created_at = models.DateTimeField(
        null=False, 
        default=timezone.now
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        Admin, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        db_table = 'route'
        verbose_name = 'Route'
        verbose_name_plural = 'Routes'
    
    def __str__(self):
        return f"{self.route_code} - {self.name}"
    
    def clean(self):
        """BR-RO-02: Origin and terminal must be different"""
        if self.origin_station == self.terminal_station:
            raise ValidationError('Origin and terminal stations must be different.')
        
        # BR-ST-03: Origin and terminal must be jeepney stops
        if self.origin_station and self.origin_station.station_type != 'JEEPNEY_STOP':
            raise ValidationError({'origin_station': 'Origin station must be a Jeepney Stop.'})
        if self.terminal_station and self.terminal_station.station_type != 'JEEPNEY_STOP':
            raise ValidationError({'terminal_station': 'Terminal station must be a Jeepney Stop.'})
        
        # BR-TM-01: Only Jeepney mode is valid
        if self.transport_mode and self.transport_mode.code != 'JEP':
            raise ValidationError({'transport_mode': 'Only Jeepney (JEP) transport mode is currently supported.'})
    
    def save(self, *args, **kwargs):
        self.full_clean() 
        super().save(*args, **kwargs)


# ROUTE STATION
class RouteStation(models.Model):
    route_station_id = models.BigAutoField(primary_key=True)
    route = models.ForeignKey( 
        Route, 
        on_delete=models.CASCADE,  
        null=False
    )
    station = models.ForeignKey(  
        Station, 
        on_delete=models.PROTECT,  
        null=False
    )
    sequence_order = models.IntegerField(
        null=False,
        validators=[MinValueValidator(1)]
    )
    distance_from_prev_km = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        null=True, 
        blank=True,
        validators=[MinValueValidator(0)]
    )
    updated_by = models.ForeignKey(
        Admin, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        db_table = 'route_station'
        verbose_name = 'Route Station'
        verbose_name_plural = 'Route Stations'
        unique_together = [['route', 'station']]  # BR-RS-02: Station cannot appear twice in same route
        ordering = ['route', 'sequence_order']  # BR-RS-03: Order by sequence
    
    def __str__(self):
        return f"{self.route.route_code} - {self.station.name} (Order: {self.sequence_order})"
    
    def clean(self):
        """BR-RS-04: Validate sequence continuity and station type"""
        # BR-ST-03: Only jeepney stops can be in route sequence
        if self.station and self.station.station_type != 'JEEPNEY_STOP':
            raise ValidationError({'station': 'Only Jeepney Stops can be added to route sequences.'})
        
        # BR-RS-03: Order 1 must be origin station
        if self.sequence_order == 1:
            if self.station != self.route.origin_station:
                raise ValidationError('First station in sequence (order 1) must be the origin station.')
        
        # Check for duplicate sequence order within route (caught by unique_together but adding custom check)
        if RouteStation.objects.filter(route=self.route, sequence_order=self.sequence_order).exists():
            if not self.pk or RouteStation.objects.get(route=self.route, sequence_order=self.sequence_order).pk != self.pk:
                raise ValidationError(f'Sequence order {self.sequence_order} already exists for this route.')
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


# GRAPH ROUTING
class GraphNode(models.Model):
    NODE_TYPES = [
        ('INTERSECTION', 'Intersection'),
        ('CORNER', 'Corner'),
        ('POI', 'Point of Interest'),
        ('VIRTUAL', 'Virtual Search Point'),
    ]

    graph_node_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=150, null=True, blank=True)
    node_type = models.CharField(
        max_length=20,
        choices=NODE_TYPES,
        default='INTERSECTION',
    )
    latitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(Decimal('-90.0')),
            MaxValueValidator(Decimal('90.0')),
        ],
    )
    longitude = models.DecimalField(
        max_digits=9,
        decimal_places=6,
        validators=[
            MinValueValidator(Decimal('-180.0')),
            MaxValueValidator(Decimal('180.0')),
        ],
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'graph_node'
        verbose_name = 'Graph Node'
        verbose_name_plural = 'Graph Nodes'

    def __str__(self):
        label = self.name or f'Node {self.graph_node_id}'
        return f'{label} ({self.latitude}, {self.longitude})'


class GraphEdge(models.Model):
    graph_edge_id = models.BigAutoField(primary_key=True)
    from_node = models.ForeignKey(
        GraphNode,
        on_delete=models.PROTECT,
        related_name='outgoing_edges',
    )
    to_node = models.ForeignKey(
        GraphNode,
        on_delete=models.PROTECT,
        related_name='incoming_edges',
    )
    distance_km = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.001'))],
    )
    travel_time_min = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    is_bidirectional = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'graph_edge'
        verbose_name = 'Graph Edge'
        verbose_name_plural = 'Graph Edges'
        unique_together = [['from_node', 'to_node']]

    def __str__(self):
        return f'{self.from_node_id} -> {self.to_node_id} ({self.distance_km} km)'

    def clean(self):
        if self.from_node_id and self.to_node_id and self.from_node_id == self.to_node_id:
            raise ValidationError('Graph edge endpoints must be different nodes.')

    def save(self, *args, **kwargs):
        if not self.distance_km and self.from_node_id and self.to_node_id:
            self.distance_km = Decimal(str(round(haversine_km(
                self.from_node.latitude,
                self.from_node.longitude,
                self.to_node.latitude,
                self.to_node.longitude,
            ), 3)))
        self.full_clean()
        super().save(*args, **kwargs)


class JeepneyLoop(models.Model):
    jeepney_loop_id = models.BigAutoField(primary_key=True)
    code = models.CharField(
        max_length=30,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[A-Z0-9\-]+$',
                message='Loop code must be uppercase alphanumeric with hyphens only.',
            )
        ],
    )
    name = models.CharField(max_length=150)
    description = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'jeepney_loop'
        verbose_name = 'Jeepney Loop'
        verbose_name_plural = 'Jeepney Loops'

    def __str__(self):
        return f'{self.code} - {self.name}'


class JeepneyLoopEdge(models.Model):
    jeepney_loop_edge_id = models.BigAutoField(primary_key=True)
    loop = models.ForeignKey(
        JeepneyLoop,
        on_delete=models.CASCADE,
        related_name='loop_edges',
    )
    edge = models.ForeignKey(
        GraphEdge,
        on_delete=models.PROTECT,
        related_name='loop_tags',
    )
    sequence_order = models.IntegerField(validators=[MinValueValidator(1)])
    is_active = models.BooleanField(default=True)
    updated_by = models.ForeignKey(
        Admin,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    class Meta:
        db_table = 'jeepney_loop_edge'
        verbose_name = 'Jeepney Loop Edge'
        verbose_name_plural = 'Jeepney Loop Edges'
        unique_together = [['loop', 'edge'], ['loop', 'sequence_order']]
        ordering = ['loop', 'sequence_order']

    def __str__(self):
        return f'{self.loop.code} edge {self.sequence_order}'


# FARE MATRIX
class FareMatrix(models.Model):  
    fare_matrix_id = models.BigAutoField(primary_key=True)
    transport_mode = models.ForeignKey(  
        TransportMode, 
        on_delete=models.PROTECT,
        null=False
    )
    base_fare = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=False,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    base_km = models.DecimalField(
        max_digits=6, 
        decimal_places=2,
        null=False,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    incremental_rate = models.DecimalField(
        max_digits=8, 
        decimal_places=2,
        null=False,
        validators=[MinValueValidator(Decimal('0'))]
    )
    effective_date = models.DateField(null=False)
    is_active = models.BooleanField(
        null=False, 
        default=False
    )
    created_at = models.DateTimeField(
        null=False, 
        default=timezone.now
    )
    updated_by = models.ForeignKey(
        Admin, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True
    )
    
    class Meta:
        db_table = 'fare_matrix'
        verbose_name = 'Fare Matrix'
        verbose_name_plural = 'Fare Matrices'
        get_latest_by = 'effective_date'
    
    def __str__(self):
        return f"{self.transport_mode.name} - {self.effective_date} ({'Active' if self.is_active else 'Inactive'})"
    
    def clean(self):
        """BR-FM-01 & BR-TM-04: Only one active fare matrix per transport mode"""
        if self.is_active:
            # Check if another active matrix exists for this transport mode
            existing_active = FareMatrix.objects.filter(
                transport_mode=self.transport_mode,
                is_active=True
            ).exclude(pk=self.pk)
            
            if existing_active.exists():
                raise ValidationError(
                    f'Transport mode "{self.transport_mode.name}" already has an active fare matrix. '
                    'Deactivate the existing one first or set this as inactive.'
                )
    
    def save(self, *args, **kwargs):
        # BR-FM-01: Automatically deactivate previous active matrix
        if self.is_active:
            FareMatrix.objects.filter(
                transport_mode=self.transport_mode,
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)

        self.full_clean()
        
        super().save(*args, **kwargs)
