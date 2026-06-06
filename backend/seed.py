import os
import django
import sys
from datetime import date, timedelta
from django.utils import timezone

# Set up Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from django.contrib.auth import get_user_model
from api.models import VendorProfile, RFQ, RFQItem, Quotation, QuotationItem, Approval, PurchaseOrder, Invoice, ActivityLog

User = get_user_model()

def seed_db():
    print("Clearing database...")
    ActivityLog.objects.all().delete()
    Invoice.objects.all().delete()
    PurchaseOrder.objects.all().delete()
    Approval.objects.all().delete()
    QuotationItem.objects.all().delete()
    Quotation.objects.all().delete()
    RFQItem.objects.all().delete()
    RFQ.objects.all().delete()
    VendorProfile.objects.all().delete()
    User.objects.exclude(is_superuser=True).delete()

    print("Creating users...")
    # Create Admin
    admin_user = User.objects.create_user(
        username="admin",
        email="admin@vendorbridge.com",
        password="admin123",
        first_name="Sarah",
        last_name="Jenkins",
        role="admin",
        company_name="VendorBridge Corp",
        phone="555-0199",
        address="100 Procurement Blvd",
        city="New York",
        state="NY",
        country="USA"
    )
    
    # Create Manager
    manager_user = User.objects.create_user(
        username="manager",
        email="manager@vendorbridge.com",
        password="manager123",
        first_name="David",
        last_name="Miller",
        role="manager",
        company_name="VendorBridge Corp",
        phone="555-0188",
        address="100 Procurement Blvd",
        city="New York",
        state="NY",
        country="USA"
    )

    # Create Vendor 1 (Approved)
    vendor1_user = User.objects.create_user(
        username="techsupply",
        email="sales@techsupply.com",
        password="vendor123",
        first_name="Alex",
        last_name="Carter",
        role="vendor",
        company_name="TechSupply Ltd",
        phone="555-0211",
        address="404 Silicon Valley Rd",
        city="San Jose",
        state="CA",
        country="USA"
    )
    v1_profile = VendorProfile.objects.create(
        user=vendor1_user,
        contact_person="Alex Carter",
        status="approved",
        category="IT Hardware",
        rating=4.85
    )

    # Create Vendor 2 (Approved)
    vendor2_user = User.objects.create_user(
        username="officedepot",
        email="orders@officedepot.com",
        password="vendor123",
        first_name="Emily",
        last_name="Stone",
        role="vendor",
        company_name="Office Depot Co",
        phone="555-0222",
        address="800 Commercial Ave",
        city="Chicago",
        state="IL",
        country="USA"
    )
    v2_profile = VendorProfile.objects.create(
        user=vendor2_user,
        contact_person="Emily Stone",
        status="approved",
        category="Office Furniture",
        rating=4.50
    )

    # Create Vendor 3 (Pending)
    vendor3_user = User.objects.create_user(
        username="stationerypro",
        email="info@stationerypro.com",
        password="vendor123",
        first_name="Robert",
        last_name="Chen",
        role="vendor",
        company_name="Stationery Pro",
        phone="555-0233",
        address="12 Paper Mill Lane",
        city="Boston",
        state="MA",
        country="USA"
    )
    v3_profile = VendorProfile.objects.create(
        user=vendor3_user,
        contact_person="Robert Chen",
        status="pending",
        category="Stationery",
        rating=5.00
    )

    # Create Vendor 4 (Rejected)
    vendor4_user = User.objects.create_user(
        username="fastshipping",
        email="contact@fastshipping.com",
        password="vendor123",
        first_name="Frank",
        last_name="Knight",
        role="vendor",
        company_name="FastShipping Logistics",
        phone="555-0244",
        address="90 Express Way",
        city="Seattle",
        state="WA",
        country="USA"
    )
    v4_profile = VendorProfile.objects.create(
        user=vendor4_user,
        contact_person="Frank Knight",
        status="rejected",
        category="Logistics",
        rating=3.20
    )

    print("Creating RFQs...")
    # RFQ 1: IT Hardware
    rfq1 = RFQ.objects.create(
        title="Office Laptops & Monitors Upgrade",
        description="We are upgrading our engineering team's laptops and adding high-res 27-inch secondary monitors. Please bid with unit prices meeting the specifications listed.",
        deadline=date.today() + timedelta(days=12),
        status="open",
        created_by=admin_user
    )
    item1_1 = RFQItem.objects.create(
        rfq=rfq1,
        item_name="Dell XPS 15 Laptop (32GB RAM, 1TB SSD)",
        description="High-performance laptops for engineering work.",
        quantity=10,
        target_price=1600.00
    )
    item1_2 = RFQItem.objects.create(
        rfq=rfq1,
        item_name="Dell 27-Inch 4K USB-C Monitor",
        description="High-res monitors with USB-C Hub capability.",
        quantity=15,
        target_price=350.00
    )

    # RFQ 2: Office Furniture
    rfq2 = RFQ.objects.create(
        title="Ergonomic Chairs & Desks for Floor 3",
        description="Procuring ergonomic office chairs and height-adjustable standing desks for the new department expansion on Floor 3.",
        deadline=date.today() + timedelta(days=20),
        status="open",
        created_by=admin_user
    )
    item2_1 = RFQItem.objects.create(
        rfq=rfq2,
        item_name="Steelcase Gesture Ergonomic Chair",
        description="Fully adjustable ergonomic chairs, black frame.",
        quantity=30,
        target_price=800.00
    )
    item2_2 = RFQItem.objects.create(
        rfq=rfq2,
        item_name="Fully Jarvis Standing Desk (60x30 Bamboo)",
        description="Electric motor height-adjustable desks.",
        quantity=15,
        target_price=500.00
    )

    # RFQ 3: Closed RFQ with PO
    rfq3 = RFQ.objects.create(
        title="Pantry Refrigerator Procurement",
        description="Urgent replacement of a broken refrigerator in the main staff pantry.",
        deadline=date.today() - timedelta(days=5),
        status="closed",
        created_by=admin_user
    )
    item3 = RFQItem.objects.create(
        rfq=rfq3,
        item_name="Samsung French Door Smart Refrigerator",
        description="Large capacity refrigerator for office pantry.",
        quantity=1,
        target_price=2500.00
    )

    print("Creating quotations...")
    # Quotes for RFQ 1 (Laptops)
    # Quote from TechSupply (total 10*1550 + 15*300 = 15500 + 4500 = 20000)
    q1 = Quotation.objects.create(
        rfq=rfq1,
        vendor=vendor1_user,
        delivery_date=date.today() + timedelta(days=15),
        shipping_cost=250.00,
        total_price=20250.00,
        status="submitted",
        comments="We have these items in stock. Dell laptops come with a 3-year warranty."
    )
    QuotationItem.objects.create(
        quotation=q1,
        rfq_item=item1_1,
        unit_price=1550.00,
        total_price=15500.00
    )
    QuotationItem.objects.create(
        quotation=q1,
        rfq_item=item1_2,
        unit_price=300.00,
        total_price=4500.00
    )

    # Quote from Office Depot for RFQ 1 (total 10*1650 + 15*320 = 16500 + 4800 = 21300)
    q2 = Quotation.objects.create(
        rfq=rfq1,
        vendor=vendor2_user,
        delivery_date=date.today() + timedelta(days=25),
        shipping_cost=100.00,
        total_price=21400.00,
        status="submitted",
        comments="Slightly longer delivery timeframe, but competitive rates and free monitors bracket setup."
    )
    QuotationItem.objects.create(
        quotation=q2,
        rfq_item=item1_1,
        unit_price=1650.00,
        total_price=16500.00
    )
    QuotationItem.objects.create(
        quotation=q2,
        rfq_item=item1_2,
        unit_price=320.00,
        total_price=4800.00
    )

    # Quotes for RFQ 3 (Refrigerator - Accepted and Completed)
    q3 = Quotation.objects.create(
        rfq=rfq3,
        vendor=vendor1_user,
        delivery_date=date.today() - timedelta(days=3),
        shipping_cost=150.00,
        total_price=2450.00,
        status="accepted",
        comments="Includes free delivery, installation, and disposal of old unit."
    )
    QuotationItem.objects.create(
        quotation=q3,
        rfq_item=item3,
        unit_price=2300.00,
        total_price=2300.00
    )

    print("Creating purchase orders and invoices...")
    # PO for Refrigerator
    po = PurchaseOrder.objects.create(
        rfq=rfq3,
        quotation=q3,
        po_number="PO-20260601-901",
        status="completed",
        total_amount=2450.00,
        terms="Net 15 days upon successful installation."
    )
    
    # Invoice for Refrigerator
    Invoice.objects.create(
        po=po,
        invoice_number="INV-20260602-094",
        total_amount=2450.00,
        status="paid",
        due_date=date.today() - timedelta(days=2),
        comments="Pantry refrigerator installation completed on June 3rd. Standard payment received."
    )

    # Create Approvals
    Approval.objects.create(
        rfq=rfq3,
        quotation=q3,
        stage="final_approval",
        status="approved",
        comments="Pantry replacement refrigerator approved.",
        actioned_by=manager_user,
        actioned_at=timezone.now() - timedelta(days=4)
    )

    print("Creating activity logs...")
    ActivityLog.objects.create(
        user=admin_user,
        action="System Seeding",
        description="Database initialized and populated with seed procurement data."
    )
    ActivityLog.objects.create(
        user=admin_user,
        action="RFQ Created",
        description="Created RFQ 'Office Laptops & Monitors Upgrade' (RFQ-1)."
    )
    ActivityLog.objects.create(
        user=admin_user,
        action="RFQ Created",
        description="Created RFQ 'Ergonomic Chairs & Desks for Floor 3' (RFQ-2)."
    )
    ActivityLog.objects.create(
        user=vendor1_user,
        action="Quotation Submitted",
        description="Submitted quotation for RFQ-1 ($20,250.00)."
    )
    ActivityLog.objects.create(
        user=vendor2_user,
        action="Quotation Submitted",
        description="Submitted quotation for RFQ-1 ($21,400.00)."
    )
    ActivityLog.objects.create(
        user=manager_user,
        action="PO Approved",
        description="Approved Samsung Refrigerator quote from TechSupply Ltd (PO-20260601-901)."
    )

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_db()
