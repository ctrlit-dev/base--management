"""
LCREE Seed Demo Management Command
=================================

Erstellt Demo-Daten für das LCREE-System.

Verwendung:
    python manage.py seed_demo

Erstellt:
- Demo-Benutzer mit verschiedenen Rollen
- Demo-Düfte und Öl-Chargen
- Demo-Materialien und Container
- Demo-Bestellungen und Produktionen
- Demo-Bewertungen
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal
import random
import string

from accounts.models import UserRole
from fragrances.models import Fragrance, OilBatch, FragranceGender, OilBatchStatus
from materials.models import Material, MaterialCategory, MaterialUnit
from containers.models import Container, ContainerType, Recipe, RecipeComponent, ComponentKind
from orders.models import Order, OrderItem
from production.models import Production, ProductionStatus, ProducedItem, ProducedItemStatus, Sale
from ratings.models import Rating
from tools.models import ToolUsage
from audit.models import AuditLog, AuditAction
from settingsapp.models import SystemSettings

User = get_user_model()


class Command(BaseCommand):
    help = 'Erstellt Demo-Daten für das LCREE-System'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Löscht alle vorhandenen Daten vor dem Erstellen der Demo-Daten',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Lösche vorhandene Daten...')
            self.clear_data()
        
        self.stdout.write('Erstelle Demo-Daten...')
        
        # Erstelle Systemeinstellungen
        self.create_system_settings()
        
        # Erstelle Benutzer
        self.create_users()
        
        # Erstelle Düfte und Öl-Chargen
        self.create_fragrances_and_batches()
        
        # Erstelle Materialien
        self.create_materials()
        
        # Erstelle Container und Rezepte
        self.create_containers_and_recipes()
        
        # Erstelle Bestellungen
        self.create_orders()
        
        # Erstelle Produktionen
        self.create_productions()
        
        # Erstelle Bewertungen
        self.create_ratings()
        
        # Erstelle Tool-Verbräuche
        self.create_tool_usages()
        
        # Erstelle Audit-Logs
        self.create_audit_logs()
        
        self.stdout.write(
            self.style.SUCCESS('Demo-Daten erfolgreich erstellt!')
        )

    def clear_data(self):
        """Löscht alle vorhandenen Daten"""
        Rating.objects.all().delete()
        Sale.objects.all().delete()
        ProducedItem.objects.all().delete()
        Production.objects.all().delete()
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        RecipeComponent.objects.all().delete()
        Recipe.objects.all().delete()
        Container.objects.all().delete()
        Material.objects.all().delete()
        OilBatch.objects.all().delete()
        Fragrance.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()
        SystemSettings.objects.all().delete()

    def create_system_settings(self):
        """Erstellt Systemeinstellungen"""
        settings = SystemSettings.get_settings()
        settings.company_name = 'LCREE Demo'
        settings.currency = 'EUR'
        settings.qr_base_url = 'https://demo.lcree.com'
        settings.print_agent_url = 'http://localhost:5000'
        settings.save()
        
        self.stdout.write('[OK] Systemeinstellungen erstellt')

    def create_users(self):
        """Erstellt Demo-Benutzer"""
        users_data = [
            {
                'email': 'admin@lcree.com',
                'first_name': 'Admin',
                'last_name': 'User',
                'role': UserRole.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'production@lcree.com',
                'first_name': 'Produktions',
                'last_name': 'Mitarbeiter',
                'role': UserRole.PRODUCTION,
            },
            {
                'email': 'warehouse@lcree.com',
                'first_name': 'Lager',
                'last_name': 'Mitarbeiter',
                'role': UserRole.WAREHOUSE,
            },
            {
                'email': 'sales@lcree.com',
                'first_name': 'Verkaufs',
                'last_name': 'Mitarbeiter',
                'role': UserRole.SALES,
            },
            {
                'email': 'viewer@lcree.com',
                'first_name': 'Betrachter',
                'last_name': 'User',
                'role': UserRole.VIEWER,
            },
        ]
        
        for user_data in users_data:
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    **user_data,
                    'username': user_data['email']  # Username = Email für Custom User Model
                }
            )
            if created:
                user.set_password('demo123')
                user.save()
        
        self.stdout.write('[OK] Demo-Benutzer erstellt')

    def create_fragrances_and_batches(self):
        """Erstellt Demo-Düfte und Öl-Chargen"""
        fragrances_data = [
            {
                'internal_code': 'M-001',
                'gender': FragranceGender.M,
                'brand': 'Dior',
                'name': 'Sauvage',
                'official_name': 'Dior - Sauvage',
                'family': 'Holzig',
                'top_notes': ['Bergamotte', 'Pfeffer'],
                'heart_notes': ['Ambroxan', 'Geranium'],
                'base_notes': ['Cedar', 'Labdanum'],
                'description': 'Ein kraftvoller, maskuliner Duft mit holzigen Noten.',
            },
            {
                'internal_code': 'W-001',
                'gender': FragranceGender.W,
                'brand': 'Chanel',
                'name': 'No. 5',
                'official_name': 'Chanel - No. 5',
                'family': 'Blumig',
                'top_notes': ['Aldehyde', 'Ylang-Ylang'],
                'heart_notes': ['Rose', 'Jasmin'],
                'base_notes': ['Sandelholz', 'Vanille'],
                'description': 'Der klassische Chanel No. 5 - zeitlos und elegant.',
            },
            {
                'internal_code': 'U-001',
                'gender': FragranceGender.U,
                'brand': 'Maison Margiela',
                'name': 'Replica Jazz Club',
                'official_name': 'Maison Margiela - Replica Jazz Club',
                'family': 'Orientalisch',
                'top_notes': ['Pink Pepper', 'Lemon'],
                'heart_notes': ['Clary Sage', 'Coffee'],
                'base_notes': ['Tobacco', 'Vanilla'],
                'description': 'Ein warmer, orientalischer Duft inspiriert von Jazz-Clubs.',
            },
        ]
        
        for fragrance_data in fragrances_data:
            fragrance, created = Fragrance.objects.get_or_create(
                internal_code=fragrance_data['internal_code'],
                defaults=fragrance_data
            )
            
            if created:
                # Erstelle Öl-Chargen für jeden Duft
                for i in range(3):
                    batch = OilBatch.objects.create(
                        fragrance=fragrance,
                        barcode=f"{fragrance.internal_code}-BATCH-{i+1:03d}",
                        qty_ml=Decimal('100.00'),
                        cost_total=Decimal('50.00'),
                        theoretical_volume_ml=Decimal('100.00'),
                        status=OilBatchStatus.AVAILABLE,
                    )
        
        self.stdout.write('[OK] Demo-Düfte und Öl-Chargen erstellt')

    def create_materials(self):
        """Erstellt Demo-Materialien"""
        materials_data = [
            # Alkohol
            {
                'name': 'Ethanol 96%',
                'category': MaterialCategory.ALCOHOL,
                'unit': MaterialUnit.ML,
                'stock_qty': Decimal('10000.00'),
                'min_qty': Decimal('1000.00'),
                'cost_per_unit': Decimal('0.05'),
                'sku_or_barcode': 'ALC-001',
            },
            # Wasser
            {
                'name': 'Destilliertes Wasser',
                'category': MaterialCategory.WATER,
                'unit': MaterialUnit.ML,
                'stock_qty': Decimal('5000.00'),
                'min_qty': Decimal('500.00'),
                'cost_per_unit': Decimal('0.01'),
                'sku_or_barcode': 'WAT-001',
            },
            # Verpackung Flakon
            {
                'name': 'Parfum Flakon 50ml',
                'category': MaterialCategory.PACKAGING_BOTTLE,
                'unit': MaterialUnit.PCS,
                'stock_qty': Decimal('100.00'),
                'min_qty': Decimal('10.00'),
                'cost_per_unit': Decimal('2.50'),
                'sku_or_barcode': 'BOT-001',
            },
            # Verpackung Etikett
            {
                'name': 'Parfum Etikett',
                'category': MaterialCategory.PACKAGING_LABEL,
                'unit': MaterialUnit.PCS,
                'stock_qty': Decimal('200.00'),
                'min_qty': Decimal('20.00'),
                'cost_per_unit': Decimal('0.10'),
                'sku_or_barcode': 'LAB-001',
            },
            # Werkzeug
            {
                'name': 'Messbecher 100ml',
                'category': MaterialCategory.TOOL,
                'unit': MaterialUnit.PCS,
                'stock_qty': Decimal('5.00'),
                'min_qty': Decimal('1.00'),
                'cost_per_unit': Decimal('15.00'),
                'cost_included': False,
                'sku_or_barcode': 'TOOL-001',
            },
        ]
        
        for material_data in materials_data:
            Material.objects.get_or_create(
                sku_or_barcode=material_data['sku_or_barcode'],
                defaults=material_data
            )
        
        self.stdout.write('[OK] Demo-Materialien erstellt')

    def create_containers_and_recipes(self):
        """Erstellt Demo-Container und Rezepte"""
        container_data = {
            'name': 'Parfum 50ml',
            'type': ContainerType.PARFUM,
            'fill_volume_ml': 50,
            'barcode': 'CONT-001',
            'price_retail': Decimal('89.90'),
            'loss_factor_oil_percent': Decimal('2.0'),
        }
        
        container, created = Container.objects.get_or_create(
            barcode=container_data['barcode'],
            defaults=container_data
        )
        
        if created:
            # Erstelle Rezept für den Container
            recipe = Recipe.objects.create(
                container=container,
                notes='Standard-Rezept für 50ml Parfum',
            )
            
            # Erstelle Rezept-Komponenten
            components_data = [
                {
                    'component_kind': ComponentKind.PLACEHOLDER_OIL,
                    'material': None,
                    'qty_required': Decimal('1.0'),
                    'unit': 'ML',
                    'is_optional': False,
                },
                {
                    'component_kind': ComponentKind.ALCOHOL,
                    'material': Material.objects.get(sku_or_barcode='ALC-001'),
                    'qty_required': Decimal('40.0'),
                    'unit': 'ML',
                    'is_optional': False,
                },
                {
                    'component_kind': ComponentKind.WATER,
                    'material': Material.objects.get(sku_or_barcode='WAT-001'),
                    'qty_required': Decimal('9.0'),
                    'unit': 'ML',
                    'is_optional': False,
                },
                {
                    'component_kind': ComponentKind.PACKAGING_BOTTLE,
                    'material': Material.objects.get(sku_or_barcode='BOT-001'),
                    'qty_required': Decimal('1.0'),
                    'unit': 'PCS',
                    'is_optional': False,
                },
                {
                    'component_kind': ComponentKind.PACKAGING_LABEL,
                    'material': Material.objects.get(sku_or_barcode='LAB-001'),
                    'qty_required': Decimal('1.0'),
                    'unit': 'PCS',
                    'is_optional': False,
                },
            ]
            
            for component_data in components_data:
                RecipeComponent.objects.create(
                    recipe=recipe,
                    **component_data
                )
        
        self.stdout.write('[OK] Demo-Container und Rezepte erstellt')

    def create_orders(self):
        """Erstellt Demo-Bestellungen"""
        order = Order.objects.create(
            supplier='Demo Lieferant',
            currency='EUR',
            items_subtotal=Decimal('200.00'),
            shipping_cost=Decimal('10.00'),
            customs_cost=Decimal('5.00'),
            total_cost=Decimal('215.00'),
            note='Demo-Bestellung für Testzwecke',
        )
        
        # Erstelle Bestellpositionen
        OrderItem.objects.create(
            order=order,
            target_type='MATERIAL',
            target_id=Material.objects.get(sku_or_barcode='ALC-001').id,
            qty=Decimal('1000.00'),
            unit_cost=Decimal('0.05'),
            allocated_shipping=Decimal('5.00'),
            allocated_customs=Decimal('2.50'),
            effective_cost_per_unit=Decimal('0.0575'),
        )
        
        self.stdout.write('[OK] Demo-Bestellungen erstellt')

    def create_productions(self):
        """Erstellt Demo-Produktionen"""
        user = User.objects.get(email='production@lcree.com')
        fragrance = Fragrance.objects.get(internal_code='M-001')
        container = Container.objects.get(barcode='CONT-001')
        
        production = Production.objects.create(
            user=user,
            fragrance=fragrance,
            container=container,
            qty=1,
            status=ProductionStatus.DONE,
            oil_cost_used=Decimal('1.00'),
            non_oil_cost_used=Decimal('2.50'),
            total_production_cost=Decimal('3.50'),
            loss_factor_oil_percent=Decimal('2.0'),
            started_at=timezone.now(),
            finished_at=timezone.now(),
        )
        
        # Erstelle produzierte Artikel
        uid = self.generate_uid()
        produced_item = ProducedItem.objects.create(
            production=production,
            fragrance=fragrance,
            container=container,
            status=ProducedItemStatus.SOLD,
            unit_cost_snapshot=Decimal('3.50'),
            price_at_sale=Decimal('89.90'),
            serial=1,
            uid=uid,
            qr_code=f'https://demo.lcree.com/p/{uid}',
        )
        
        # Erstelle Verkauf
        Sale.objects.create(
            container=container,
            qty=1,
            price_total=Decimal('89.90'),
            cost_total=Decimal('3.50'),
            profit_total=Decimal('86.40'),
            created_by=user,
        )
        
        self.stdout.write('[OK] Demo-Produktionen erstellt')

    def create_ratings(self):
        """Erstellt Demo-Bewertungen"""
        produced_item = ProducedItem.objects.first()
        if produced_item:
            Rating.objects.create(
                produced_item=produced_item,
                fragrance=produced_item.fragrance,
                container=produced_item.container,
                stars=5,
                comment='Fantastischer Duft! Sehr empfehlenswert.',
                display_name='Demo-Kunde',
            )
        
        self.stdout.write('[OK] Demo-Bewertungen erstellt')

    def create_tool_usages(self):
        """Erstellt Demo-Tool-Verbräuche"""
        user = User.objects.get(email='production@lcree.com')
        tool = Material.objects.get(sku_or_barcode='TOOL-001')
        
        ToolUsage.objects.create(
            material=tool,
            user=user,
            qty_used=Decimal('1.0'),
            reason='Produktion von Demo-Parfum',
        )
        
        self.stdout.write('[OK] Demo-Tool-Verbräuche erstellt')

    def create_audit_logs(self):
        """Erstellt Demo-Audit-Logs"""
        user = User.objects.get(email='admin@lcree.com')
        
        AuditLog.objects.create(
            actor=user,
            action=AuditAction.CRUD_CREATE,
            subject_type='User',
            subject_id=user.id,
            payload_after={'email': user.email, 'role': user.role},
            ip='127.0.0.1',
            user_agent='Demo Browser',
        )
        
        self.stdout.write('[OK] Demo-Audit-Logs erstellt')

    def generate_uid(self):
        """Generiert eine eindeutige UID"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
