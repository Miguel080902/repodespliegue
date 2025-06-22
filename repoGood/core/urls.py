from django.urls import path
from .views import UserCreateView, LoginView, RouteListCreateView, RouteDetailView, UserListView
from .views import LastUserRouteView  # Añade esta importación

urlpatterns = [
    path('users/', UserListView.as_view(), name='user-list'),  # Listar usuarios (GET)
    path('users/create/', UserCreateView.as_view(), name='user-create'),  # Crear usuario 
    path('login/', LoginView.as_view(), name='login'),
    path('routes/', RouteListCreateView.as_view(), name='route-list'),
    path('routes/<int:pk>/', RouteDetailView.as_view(), name='route-detail'),
    path('routes/last/', LastUserRouteView.as_view(), name='route-last'),  # Nueva ruta
]