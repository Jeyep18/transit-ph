from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'transport-modes', views.TransportModeViewSet, basename='transport-mode')
router.register(r'stations', views.StationViewSet, basename='station')
router.register(r'routes', views.RouteViewSet, basename='route')
router.register(r'fare-matrix', views.FareMatrixViewSet, basename='fare-matrix')

# Nested route for route stations: /api/routes/<route_pk>/stations/
route_station_list = views.RouteStationViewSet.as_view({
    'get': 'list',
    'post': 'create',
})
route_station_detail = views.RouteStationViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})
route_station_reorder = views.RouteStationViewSet.as_view({
    'post': 'reorder',
})

urlpatterns = [
    # Auth
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/logout/', views.logout_view, name='auth-logout'),
    path('auth/me/', views.me_view, name='auth-me'),

    # Public search
    path('geocode/search/', views.geocode_search_view, name='geocode-search'),
    path('search/', views.search_routes_view, name='search-routes'),
    path('jeepney-loops/', views.active_jeepney_loops_view, name='active-jeepney-loops'),
    path('stations/nearby/', views.nearby_stations_view, name='nearby-stations'),
    path('fare-matrix/active/', views.active_fare_matrix_view, name='active-fare-matrix'),

    # Route stations (nested under routes)
    path('routes/<int:route_pk>/stations/', route_station_list, name='route-station-list'),
    path('routes/<int:route_pk>/stations/<int:pk>/', route_station_detail, name='route-station-detail'),
    path('routes/<int:route_pk>/stations/reorder/', route_station_reorder, name='route-station-reorder'),

    # Router-generated CRUD
    path('', include(router.urls)),
]
