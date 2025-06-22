from rest_framework import serializers
from core.models import User, Route
from django.contrib.auth import authenticate
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
User = get_user_model()

from django.utils import timezone
class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)  # Asegúrate de incluir explícitamente el campo
    date_joined = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'is_staff', 'is_active', 'date_joined')
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def get_date_joined(self, obj):
        # Convierte a la zona horaria configurada en settings.py
        local_time = timezone.localtime(obj.date_joined)
        return local_time.strftime("%Y-%m-%d %H:%M:%S")
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            is_active=True  # Asegura que el usuario esté activo
        )
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data['email'], password=data['password'])
        if user and user.is_active:
            return user
        raise serializers.ValidationError("Credenciales incorrectas")

class RouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Route
        fields = ('id', 'user', 'coordinates', 'created_at')
        read_only_fields = ('user', 'created_at')  # Hace que user y created_at sean de solo lectura