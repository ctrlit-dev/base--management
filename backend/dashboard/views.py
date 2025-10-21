"""
User Management Dashboard Views
===============================

Aggregierte Dashboard-Daten für das User Management System.

Features:
- Benutzer-Statistiken und KPIs
- System-Status und Aktivitäten
- Rollenbasierte Berechtigungen
- Audit-Log Integration
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from accounts.models import User, UserRole
from audit.models import AuditLog


class DashboardStatsView(APIView):
    """
    Dashboard-Statistiken für das User Management System
    
    Fokus auf Benutzer-Management und System-Status.
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
            
            # Neue Benutzer (letzte 30 Tage)
            new_users = User.objects.filter(
                is_deleted=False,
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count()
            
            # Benutzer nach Rollen
            role_distribution = self._get_role_distribution()
            
            # System-Status
            system_status = self._get_system_status()
            
            # Letzte Aktivitäten
            recent_activities = self._get_recent_activities()
            
            # Login-Statistiken
            login_stats = self._get_login_stats()

            return Response({
                'total_users': total_users,
                'active_users': active_users,
                'new_users': new_users,
                'role_distribution': role_distribution,
                'system_status': system_status,
                'recent_activities': recent_activities,
                'login_stats': login_stats,
                'generated_at': timezone.now().isoformat(),
            })

        except Exception as e:
            return Response({
                'error': f'Fehler beim Laden der Dashboard-Daten: {str(e)}',
                'total_users': 0,
                'active_users': 0,
                'new_users': 0,
                'role_distribution': {},
                'system_status': {'status': 'error'},
                'recent_activities': [],
                'login_stats': {},
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _get_role_distribution(self):
        """Benutzer-Verteilung nach Rollen"""
        role_distribution = {}
        for role_code, role_name in UserRole.choices:
            count = User.objects.filter(
                is_deleted=False,
                is_active=True,
                role=role_code
            ).count()
            role_distribution[role_code] = {
                'count': count,
                'name': role_name
            }
        return role_distribution

    def _get_system_status(self):
        """System-Status berechnen"""
        # Inaktive Benutzer
        inactive_users = User.objects.filter(
            is_deleted=False,
            is_active=False
        ).count()
        
        # Gelöschte Benutzer
        deleted_users = User.objects.filter(is_deleted=True).count()
        
        # System-Health
        health_status = 'healthy'
        health_issues = []
        
        if inactive_users > 0:
            health_issues.append(f'{inactive_users} inaktive Benutzer')
        
        if deleted_users > 0:
            health_issues.append(f'{deleted_users} gelöschte Benutzer')
        
        if health_issues:
            health_status = 'warning'
        
        return {
            'status': health_status,
            'inactive_users': inactive_users,
            'deleted_users': deleted_users,
            'issues': health_issues
        }

    def _get_recent_activities(self, limit=10):
        """Letzte Aktivitäten aus Audit-Log"""
        try:
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
                    'ip': getattr(log, 'ip', None)
                })

            return activities
        except Exception:
            return []

    def _get_login_stats(self):
        """Login-Statistiken"""
        today = timezone.now().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)
        
        # Logins heute
        logins_today = User.objects.filter(
            last_login__date=today
        ).count()
        
        # Logins diese Woche
        logins_week = User.objects.filter(
            last_login__date__gte=week_ago
        ).count()
        
        # Logins diesen Monat
        logins_month = User.objects.filter(
            last_login__date__gte=month_ago
        ).count()
        
        return {
            'today': logins_today,
            'week': logins_week,
            'month': logins_month
        }


class DashboardChartsView(APIView):
    """
    Dashboard-Charts-Daten für User Management
    
    Liefert Daten für verschiedene Charts auf dem Dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Gibt Chart-Daten zurück
        """
        chart_type = request.query_params.get('type', 'users')
        period = request.query_params.get('period', '30d')  # 7d, 30d, 90d, 1y

        if chart_type == 'users':
            data = self._get_users_chart(period)
        elif chart_type == 'logins':
            data = self._get_logins_chart(period)
        elif chart_type == 'roles':
            data = self._get_roles_chart()
        else:
            return Response({'error': 'Invalid chart type'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(data)

    def _get_users_chart(self, period):
        """Benutzer-Registrierungs-Chart"""
        days = self._get_days_from_period(period)
        today = timezone.now().date()

        labels = []
        data = []

        for i in range(days, -1, -1):
            date = today - timedelta(days=i)
            labels.append(date.strftime('%d.%m'))

            users = User.objects.filter(
                created_at__date=date,
                is_deleted=False
            ).count()

            data.append(users)

        return {
            'type': 'line',
            'labels': labels,
            'datasets': [{
                'label': 'Neue Benutzer',
                'data': data,
                'borderColor': '#3B82F6',
                'backgroundColor': 'rgba(59, 130, 246, 0.1)'
            }]
        }

    def _get_logins_chart(self, period):
        """Login-Aktivitäts-Chart"""
        days = self._get_days_from_period(period)
        today = timezone.now().date()

        labels = []
        data = []

        for i in range(days, -1, -1):
            date = today - timedelta(days=i)
            labels.append(date.strftime('%d.%m'))

            logins = User.objects.filter(
                last_login__date=date
            ).count()

            data.append(logins)

        return {
            'type': 'bar',
            'labels': labels,
            'datasets': [{
                'label': 'Logins',
                'data': data,
                'backgroundColor': '#10B981'
            }]
        }

    def _get_roles_chart(self):
        """Rollen-Verteilungs-Chart"""
        role_data = []
        role_labels = []
        
        for role_code, role_name in UserRole.choices:
            count = User.objects.filter(
                is_deleted=False,
                is_active=True,
                role=role_code
            ).count()
            
            if count > 0:  # Nur Rollen mit Benutzern anzeigen
                role_labels.append(role_name)
                role_data.append(count)

        return {
            'type': 'doughnut',
            'labels': role_labels,
            'datasets': [{
                'label': 'Benutzer nach Rollen',
                'data': role_data,
                'backgroundColor': [
                    '#EF4444',  # ADMIN - Rot
                    '#3B82F6',  # PRODUCTION - Blau
                    '#10B981',  # WAREHOUSE - Grün
                    '#8B5CF6',  # SALES - Lila
                    '#6B7280',  # VIEWER - Grau
                ]
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
        return period_map.get(period, 30)

