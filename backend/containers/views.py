"""
LCREE Containers Views & Serializers
=====================================
"""

from rest_framework import viewsets
from .models import Container, Recipe, RecipeComponent
from .serializers import ContainerSerializer, RecipeSerializer, RecipeComponentSerializer


class ContainerViewSet(viewsets.ModelViewSet):
    """ViewSet für Container"""
    queryset = Container.objects.filter(is_deleted=False)
    serializer_class = ContainerSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    """ViewSet für Rezepte"""
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer


class RecipeComponentViewSet(viewsets.ModelViewSet):
    """ViewSet für Rezept-Komponenten"""
    queryset = RecipeComponent.objects.all()
    serializer_class = RecipeComponentSerializer