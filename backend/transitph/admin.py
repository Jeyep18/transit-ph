from django.contrib import admin
from .models import (
    Admin as AdminModel,
    FareMatrix,
    GraphEdge,
    GraphNode,
    JeepneyLoop,
    JeepneyLoopEdge,
    Route,
    RouteStation,
    Station,
    TransportMode,
)


@admin.register(AdminModel)
class AdminModelAdmin(admin.ModelAdmin):
    list_display = ['id', 'username', 'email', 'is_active', 'created_at', 'last_login_at']
    list_filter = ['is_active']
    search_fields = ['username', 'email']
    readonly_fields = ['created_at', 'last_login_at']


@admin.register(TransportMode)
class TransportModeAdmin(admin.ModelAdmin):
    list_display = ['transport_mode_id', 'name', 'code', 'is_active']
    list_filter = ['is_active']


@admin.register(Station)
class StationAdmin(admin.ModelAdmin):
    list_display = ['station_id', 'name', 'station_type', 'latitude', 'longitude', 'is_active']
    list_filter = ['station_type', 'is_active']
    search_fields = ['name', 'address']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['route_id', 'route_code', 'name', 'transport_mode', 'origin_station', 'terminal_station', 'is_active']
    list_filter = ['is_active', 'transport_mode']
    search_fields = ['route_code', 'name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(RouteStation)
class RouteStationAdmin(admin.ModelAdmin):
    list_display = ['route_station_id', 'route', 'station', 'sequence_order', 'distance_from_prev_km']
    list_filter = ['route']
    ordering = ['route', 'sequence_order']


@admin.register(FareMatrix)
class FareMatrixAdmin(admin.ModelAdmin):
    list_display = ['fare_matrix_id', 'transport_mode', 'base_fare', 'base_km', 'incremental_rate', 'effective_date', 'is_active']
    list_filter = ['is_active', 'transport_mode']
    readonly_fields = ['created_at']


@admin.register(GraphNode)
class GraphNodeAdmin(admin.ModelAdmin):
    list_display = ['graph_node_id', 'name', 'node_type', 'latitude', 'longitude', 'is_active']
    list_filter = ['node_type', 'is_active']
    search_fields = ['name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(GraphEdge)
class GraphEdgeAdmin(admin.ModelAdmin):
    list_display = ['graph_edge_id', 'from_node', 'to_node', 'distance_km', 'travel_time_min', 'is_bidirectional', 'is_active']
    list_filter = ['is_bidirectional', 'is_active']
    autocomplete_fields = ['from_node', 'to_node']
    search_fields = ['from_node__name', 'to_node__name']
    readonly_fields = ['created_at', 'updated_at']


class JeepneyLoopEdgeInline(admin.TabularInline):
    model = JeepneyLoopEdge
    extra = 1
    fields = ['sequence_order', 'edge', 'is_active', 'updated_by']
    autocomplete_fields = ['edge']
    ordering = ['sequence_order']


@admin.register(JeepneyLoop)
class JeepneyLoopAdmin(admin.ModelAdmin):
    list_display = ['jeepney_loop_id', 'code', 'name', 'is_active']
    list_filter = ['is_active']
    search_fields = ['code', 'name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [JeepneyLoopEdgeInline]


@admin.register(JeepneyLoopEdge)
class JeepneyLoopEdgeAdmin(admin.ModelAdmin):
    list_display = ['jeepney_loop_edge_id', 'loop', 'edge', 'sequence_order', 'is_active']
    list_filter = ['loop', 'is_active']
    autocomplete_fields = ['loop', 'edge']
    ordering = ['loop', 'sequence_order']
