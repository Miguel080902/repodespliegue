from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.views import APIView
from django.contrib.auth import authenticate, login
from .models import User, Route
from .serializers import UserSerializer, LoginSerializer, RouteSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.http import Http404
from django.contrib.auth import get_user_model

class LastUserRouteView(generics.RetrieveAPIView):
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # Obtiene la última ruta del usuario autenticado ordenada por fecha descendente
        try:
            return Route.objects.filter(
                user=self.request.user
            ).latest('created_at')
        except Route.DoesNotExist:
            raise Http404("No se encontraron rutas para este usuario")
        

from rest_framework.permissions import IsAdminUser

User = get_user_model()

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        # Asegúrate de que el usuario no sea staff/admin por defecto
        user = serializer.save(is_staff=False, is_superuser=False)
        return user
    
    def create(self, request, *args, **kwargs):
        print("Datos recibidos:", request.data)  # Verifica qué datos llegan
        return super().create(request, *args, **kwargs)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    
from rest_framework import serializers

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # Cambia 'username' por 'email' para autenticación
        authenticate_kwargs = {
            'email': attrs[self.username_field],
            'password': attrs['password'],
        }
        
        try:
            authenticate_kwargs['request'] = self.context['request']
        except KeyError:
            pass

        self.user = authenticate(**authenticate_kwargs)

        if not self.user or not self.user.is_active:
            raise serializers.ValidationError(
                'No active account found with the given credentials'
            )

        data = {}
        refresh = self.get_token(self.user)

        data['refresh'] = str(refresh)
        data['access'] = str(refresh.access_token)
        
        # Añade información adicional del usuario
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'is_staff': self.user.is_staff  # Añade esta línea
        }

        return data

class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

from rest_framework.permissions import IsAuthenticated

class RouteListCreateView(generics.ListCreateAPIView):
    serializer_class = RouteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Route.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Asigna automáticamente el usuario actual a la ruta
        serializer.save(user=self.request.user)

class RouteDetailView(generics.RetrieveAPIView):
    serializer_class = RouteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Route.objects.filter(user=self.request.user)

