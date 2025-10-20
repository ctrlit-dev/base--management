"""
LCREE Dashboard Views
=====================

Aggregierte Dashboard-Daten für das Frontend.

Features:
- KPI-Aggregation aus allen Apps
- Statistiken und Charts
- Echtzeit-Daten
- Rollenbasierte Berechtigungen
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Sum, Count, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

# Models aus allen Apps importieren
try:
    from production.models import Production, Sale, ProducedItem
except ImportError:
    Production = Sale = ProducedItem = None

try:
    from materials.models import Material
except ImportError:
    Material = None

try:
    from fragrances.models import Fragrance, OilBatch
except ImportError:
    Fragrance = OilBatch = None

try:
    from containers.models import Container, Recipe
except ImportError:
    Container = Recipe = None

try:
    from orders.models import Order
except ImportError:
    Order = None

try:
    from ratings.models import Rating
except ImportError:
    Rating = None

try:
    from audit.models import AuditLog
except ImportError:
    AuditLog = None

from accounts.models import User


class DashboardStatsView(APIView):
    """
    Dashboard-Statistiken für das Frontend
    
    Vereinfachte Version, die mit vorhandenen Modellen funktioniert.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Gibt grundlegende Dashboard-Statistiken zurück
        """
        try:
            # Benutzer-Statistiken
            total_users = User.objects.filter(is_deleted=False).count()
            active_users = User.objects.filter(
                is_deleted=False, 
                is_active=True,
                last_login__gte=timezone.now() - timedelta(days=7)
            ).count()

            # Bestellungen (falls Order-Model vorhanden)
            total_orders = 0
            pending_orders = 0
            if Order:
                total_orders = Order.objects.count()
                pending_orders = Order.objects.filter(status='pending').count()

            # Umsatz (vereinfacht)
            total_revenue = 0
            monthly_revenue = 0
            if Sale:
                total_revenue = Sale.objects.aggregate(
                    total=Sum('price_total')
                )['total'] or 0
                
                month_start = timezone.now().replace(day=1)
                monthly_revenue = Sale.objects.filter(
                    sold_at__gte=month_start
                ).aggregate(total=Sum('price_total'))['total'] or 0

            # Niedrige Lagerbestände
            low_stock_materials = 0
            if Material:
                low_stock_materials = Material.objects.filter(
                    stock_quantity__lte=F('min_stock_level')
                ).count()

            # Letzte Bestellungen (vereinfacht)
            recent_orders = []
            if Order:
                recent_orders = list(Order.objects.order_by('-created_at')[:5].values(
                    'id', 'order_number', 'customer_name', 'total_amount', 
                    'status', 'created_at'
                ))

            # Top Düfte (vereinfacht)
            top_fragrances = []
            if Fragrance:
                top_fragrances = list(Fragrance.objects.filter(is_active=True)[:5].values(
                    'id', 'name', 'brand', 'base_price'
                ))

            return Response({
                'total_users': total_users,
                'active_users': active_users,
                'total_orders': total_orders,
                'pending_orders': pending_orders,
                'total_revenue': float(total_revenue),
                'monthly_revenue': float(monthly_revenue),
                'low_stock_materials': low_stock_materials,
                'recent_orders': recent_orders,
                'top_fragrances': top_fragrances,
                'generated_at': timezone.now().isoformat(),
            })

        except Exception as e:
            return Response({
                'error': f'Fehler beim Laden der Dashboard-Daten: {str(e)}',
                'total_users': 0,
                'active_users': 0,
                'total_orders': 0,
                'pending_orders': 0,
                'total_revenue': 0,
                'monthly_revenue': 0,
                'low_stock_materials': 0,
                'recent_orders': [],
                'top_fragrances': [],
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_sales_kpis(self, today, week_start, month_start):
        """Verkaufs-KPIs berechnen"""
        # Verkäufe nach Zeitraum
        sales_today = Sale.objects.filter(
            sold_at__date=today
        )
        sales_week = Sale.objects.filter(
            sold_at__date__gte=week_start
        )
        sales_month = Sale.objects.filter(
            sold_at__date__gte=month_start
        )

        # Umsätze berechnen
        revenue_today = sales_today.aggregate(
            total=Sum('price_total')
        )['total'] or Decimal('0.00')

        revenue_week = sales_week.aggregate(
            total=Sum('price_total')
        )['total'] or Decimal('0.00')

        revenue_month = sales_month.aggregate(
            total=Sum('price_total')
        )['total'] or Decimal('0.00')

        # Gewinn berechnen
        profit_today = sales_today.aggregate(
            total=Sum('profit_total')
        )['total'] or Decimal('0.00')

        profit_week = sales_week.aggregate(
            total=Sum('profit_total')
        )['total'] or Decimal('0.00')

        return {
            'revenue': {
                'today': float(revenue_today),
                'week': float(revenue_week),
                'month': float(revenue_month),
                'currency': 'EUR'
            },
            'profit': {
                'today': float(profit_today),
                'week': float(profit_week),
                'currency': 'EUR'
            },
            'sales_count': {
                'today': sales_today.count(),
                'week': sales_week.count(),
                'month': sales_month.count()
            },
            'average_order_value': {
                'today': float(revenue_today / sales_today.count()) if sales_today.count() > 0 else 0,
                'week': float(revenue_week / sales_week.count()) if sales_week.count() > 0 else 0,
            }
        }

    def _get_production_kpis(self, today, week_start, month_start):
        """Produktions-KPIs berechnen"""
        # Produktionen nach Status
        productions_done = Production.objects.filter(
            status='DONE'
        )

        productions_today = productions_done.filter(finished_at__date=today)
        productions_week = productions_done.filter(finished_at__date__gte=week_start)
        productions_month = productions_done.filter(finished_at__date__gte=month_start)

        # Produzierte Items
        items_today = ProducedItem.objects.filter(
            production__finished_at__date=today
        ).count()

        items_week = ProducedItem.objects.filter(
            production__finished_at__date__gte=week_start
        ).count()

        # Top Düfte (meist produziert)
        top_fragrances = Production.objects.filter(
            status='DONE',
            finished_at__date__gte=month_start
        ).values(
            'fragrance__name',
            'fragrance__code'
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        return {
            'productions_count': {
                'today': productions_today.count(),
                'week': productions_week.count(),
                'month': productions_month.count()
            },
            'items_produced': {
                'today': items_today,
                'week': items_week
            },
            'top_fragrances': list(top_fragrances),
            'active_productions': Production.objects.filter(
                status__in=['READY', 'IN_PROGRESS']
            ).count()
        }

    def _get_inventory_kpis(self):
        """Bestands-KPIs berechnen"""
        # Materialien
        materials_total = Material.objects.filter(is_deleted=False).count()
        materials_low_stock = Material.objects.filter(
            is_deleted=False
        ).filter(
            Q(stock_qty__lte=F('min_qty'))
        ).count()

        # Öl-Chargen
        oil_batches_available = OilBatch.objects.filter(
            status='AVAILABLE',
            is_deleted=False
        ).count()

        oil_batches_low = OilBatch.objects.filter(
            status='AVAILABLE',
            is_deleted=False,
            qty_ml__lt=100  # Unter 100ml als "niedrig" betrachten
        ).count()

        # Low-Stock-Warnungen
        low_stock_items = []

        # Materialien unter Mindestbestand
        low_materials = Material.objects.filter(
            is_deleted=False
        ).filter(
            Q(stock_qty__lte=F('min_qty'))
        )[:5]

        for material in low_materials:
            low_stock_items.append({
                'type': 'material',
                'name': material.name,
                'current': float(material.stock_qty),
                'minimum': float(material.min_qty),
                'unit': material.unit,
                'severity': 'critical' if material.stock_qty <= 0 else 'warning'
            })

        return {
            'materials': {
                'total': materials_total,
                'low_stock': materials_low_stock
            },
            'oil_batches': {
                'available': oil_batches_available,
                'low': oil_batches_low
            },
            'warnings': low_stock_items,
            'warnings_count': materials_low_stock + oil_batches_low
        }

    def _get_ratings_kpis(self):
        """Bewertungs-KPIs berechnen"""
        ratings = Rating.objects.all()

        # Durchschnittliche Bewertung
        avg_rating = ratings.aggregate(Avg('stars'))['stars__avg'] or 0

        # Bewertungsverteilung
        rating_distribution = {}
        for i in range(1, 6):
            rating_distribution[f'{i}_stars'] = ratings.filter(stars=i).count()

        # Neue Bewertungen (letzte 7 Tage)
        week_ago = timezone.now() - timedelta(days=7)
        new_ratings = ratings.filter(created_at__gte=week_ago).count()

        # Nicht moderierte Bewertungen
        pending_moderation = ratings.filter(is_public=False).count()

        return {
            'average_rating': round(float(avg_rating), 2),
            'total_ratings': ratings.count(),
            'new_ratings': new_ratings,
            'pending_moderation': pending_moderation,
            'distribution': rating_distribution
        }

    def _get_users_kpis(self):
        """Benutzer-KPIs berechnen (nur für Admins)"""
        users = User.objects.filter(is_deleted=False, is_active=True)

        # Benutzer nach Rollen
        role_distribution = {}
        from accounts.models import UserRole
        for role_code, role_name in UserRole.choices:
            role_distribution[role_code] = users.filter(role=role_code).count()

        # Aktive Benutzer (letzte 24h)
        day_ago = timezone.now() - timedelta(days=1)
        active_users = users.filter(last_login__gte=day_ago).count()

        return {
            'total_users': users.count(),
            'active_users': active_users,
            'role_distribution': role_distribution
        }

    def _get_system_status(self):
        """System-Status berechnen"""
        # Offene Bestellungen
        open_orders = Order.objects.filter(
            received_at__isnull=True
        ).count()

        # Aktive Produktionen
        active_productions = Production.objects.filter(
            status__in=['READY', 'IN_PROGRESS']
        ).count()

        # System-Health (vereinfacht)
        health_status = 'healthy'
        health_issues = []

        # Prüfe kritische Bestände
        critical_materials = Material.objects.filter(
            is_deleted=False,
            stock_qty=0
        ).count()

        if critical_materials > 0:
            health_status = 'warning'
            health_issues.append(f'{critical_materials} Materialien aufgebraucht')

        return {
            'status': health_status,
            'open_orders': open_orders,
            'active_productions': active_productions,
            'issues': health_issues
        }

    def _get_recent_activities(self, limit=10):
        """Letzte Aktivitäten aus Audit-Log"""
        recent_logs = AuditLog.objects.select_related('actor').order_by('-created_at')[:limit]

        activities = []
        for log in recent_logs:
            activities.append({
                'id': log.id,
                'action': log.action,
                'actor': log.actor.get_full_name() if log.actor else 'System',
                'subject_type': log.subject_type,
                'subject_id': log.subject_id,
                'timestamp': log.created_at.isoformat(),
                'ip': log.ip
            })

        return activities

    def _get_quick_actions(self, user):
        """Schnellzugriffs-Aktionen basierend auf Benutzerrolle"""
        actions = []

        # Admins sehen alle Aktionen
        if user.is_admin():
            actions = [
                {'id': 'new_production', 'label': 'Neue Produktion', 'icon': 'beaker', 'route': '/production/new'},
                {'id': 'warehouse_receipt', 'label': 'Wareneingang', 'icon': 'truck', 'route': '/orders/receive'},
                {'id': 'tool_scan', 'label': 'Tool scannen', 'icon': 'wrench', 'route': '/tools/scan'},
                {'id': 'moderate_ratings', 'label': 'Bewertungen', 'icon': 'star', 'route': '/ratings/moderate'},
            ]
        # Produktions-User
        elif user.can_produce():
            actions = [
                {'id': 'new_production', 'label': 'Neue Produktion', 'icon': 'beaker', 'route': '/production/new'},
                {'id': 'tool_scan', 'label': 'Tool scannen', 'icon': 'wrench', 'route': '/tools/scan'},
            ]
        # Lager-User
        elif user.can_manage_warehouse():
            actions = [
                {'id': 'warehouse_receipt', 'label': 'Wareneingang', 'icon': 'truck', 'route': '/orders/receive'},
                {'id': 'inventory_check', 'label': 'Bestand prüfen', 'icon': 'clipboard', 'route': '/materials'},
            ]
        # Verkaufs-User
        elif user.can_sell():
            actions = [
                {'id': 'new_sale', 'label': 'Neuer Verkauf', 'icon': 'shopping-cart', 'route': '/sales/new'},
            ]

        return actions


class DashboardChartsView(APIView):
    """
    Dashboard-Charts-Daten

    Liefert Daten für verschiedene Charts auf dem Dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Gibt Chart-Daten zurück
        """
        chart_type = request.query_params.get('type', 'sales')
        period = request.query_params.get('period', '7d')  # 7d, 30d, 90d, 1y

        if chart_type == 'sales':
            data = self._get_sales_chart(period)
        elif chart_type == 'production':
            data = self._get_production_chart(period)
        elif chart_type == 'inventory':
            data = self._get_inventory_chart(period)
        else:
            return Response({'error': 'Invalid chart type'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(data)

    def _get_sales_chart(self, period):
        """Verkaufs-Chart-Daten"""
        days = self._get_days_from_period(period)
        today = timezone.now().date()

        labels = []
        data = []

        for i in range(days, -1, -1):
            date = today - timedelta(days=i)
            labels.append(date.strftime('%d.%m'))

            sales = Sale.objects.filter(
                sold_at__date=date
            ).aggregate(total=Sum('price_total'))['total'] or 0

            data.append(float(sales))

        return {
            'type': 'line',
            'labels': labels,
            'datasets': [{
                'label': 'Umsatz (EUR)',
                'data': data,
                'borderColor': '#3B82F6',
                'backgroundColor': 'rgba(59, 130, 246, 0.1)'
            }]
        }

    def _get_production_chart(self, period):
        """Produktions-Chart-Daten"""
        days = self._get_days_from_period(period)
        today = timezone.now().date()

        labels = []
        data = []

        for i in range(days, -1, -1):
            date = today - timedelta(days=i)
            labels.append(date.strftime('%d.%m'))

            items = ProducedItem.objects.filter(
                production__finished_at__date=date
            ).count()

            data.append(items)

        return {
            'type': 'bar',
            'labels': labels,
            'datasets': [{
                'label': 'Produzierte Artikel',
                'data': data,
                'backgroundColor': '#10B981'
            }]
        }

    def _get_inventory_chart(self, period):
        """Bestands-Chart-Daten - Top Materialien nach Bestand"""
        materials = Material.objects.filter(
            is_deleted=False
        ).order_by('-stock_qty')[:10]

        labels = [m.name for m in materials]
        data = [float(m.stock_qty) for m in materials]

        return {
            'type': 'bar',
            'labels': labels,
            'datasets': [{
                'label': 'Bestand',
                'data': data,
                'backgroundColor': '#F59E0B'
            }]
        }

    def _get_days_from_period(self, period):
        """Wandelt Period-String in Tage um"""
        period_map = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365
        }
        return period_map.get(period, 7)
