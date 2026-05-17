# backend/transitph/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('plan-route/', views.RoutePlanView.as_view(), name='plan-route'),
]