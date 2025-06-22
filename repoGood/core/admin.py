from django.contrib import admin
from .models import Route, User  # Importación correcta usando punto

@admin.register(Route)
class RouteAdmin(admin.ModelAdmin):
    list_display = ['coordinates','user', 'created_at']  # Usa campos que realmente existen

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'username', 'is_staff']