from django.urls import include,path
from rest_framework.routers import DefaultRouter

from .views import *

router=DefaultRouter()

router.register(
    'stations',
    StationViewSet
)

router.register(
    'routes',
    RouteViewSet
)

router.register(
    'fare-matrix',
    FareMatrixViewSet
)

router.register(
    'route-stations',
    RouteStationViewSet
)

urlpatterns=[

    path(
        '',
        include(router.urls)
    )

]