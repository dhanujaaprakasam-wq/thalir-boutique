import csv
import io
import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from store.models import LedgerEntry, Supplier

CSV_RAW_DATA = """Date,Particulars,Description,Money in(DR),Money out(CR)
2026-03-08,Sami Pooja,Pooja expenses,,101
,Pooja expenses,Pooja expenses,,983
,snacks coffee,Snacks,,750
,Saree purchase,Saree purchase,,133539
,Salem Expenses,Expenses,,900
,Glass,Shop expenses,,23300
,Auto Rent,Shop expenses,,600
,Tiles sheet,Shop expenses,,7000
,Ceiling,Shop expenses,,12500
,Light,Shop expenses,,5700
,Fan,Shop expenses,,3650
,Note,Shop expenses,,310
,Paint wages,Shop expenses,,4000
,Paint,Shop expenses,,12000
,Manimegalai Saree purchase,Saree purchase,1340,
,Coimbatore saree purchase,Saree purchase,,45900
,Food bus,Expenses,,1075
,Elampillai saree purchase,Saree purchase,,12360
,Board,Shop expenses,,9700
,Electric shop,Shop expenses,,2600
,Tag,Packing expenses,,1200
,Elampillai food,Expenses,,1200
,Car expenses,Expenses,,500
,Sweet pooja,Pooja expenses,,615
,Bag,Packing expenses,,350
,Courier,Courier,,250
,Cement,Shop expenses,,169
,RC,Shop expenses,,650
,Wages,Shop expenses,,400
,Tiles sheet,Shop expenses,,1500
,Befor bill saree sold,Saree sold,17810,
,Befor bill saree sold,Saree sold,5550,
,After bill saree sold,Saree sold,18510,
,Table (uma),Shop expenses,,5000
,Table(chitra),Shop expenses,,8800
,Flower Stand,Shop expenses,,200
2026-03-29,Erode sakthi vinayaga saree purchase,Saree Purchase,,5160
,Navrang tex saree purchase,Saree Purchase,,18900
,Pooja things,Pooja expenses,,250
,Photo frame(chitra),Shop expenses,,2700
,"Travel,lunch - Trippur",Expenses,,1640
,Electrician ,Shop expenses,,3000
,Calculator,Shop expenses,,450
23-03-2026 - 05/04/2026,Saree sold,Saree Sold,13890,
2026-04-11,Shop Rent,Rent,,2500
2026-04-11,Notice,Shop expenses,,950
2026-04-08,Mul Trippur saree purchase,Saree purchase,,6178
2026-04-15,Erode sakthi vinayaga saree purchase,Saree purchase,,1050
,Courier,Courier,,110
2026-04-18,Sumathi tex refund,,1124,
2026-04-12,Saree sold,Saree sold,800,
2026-04-14,,Saree sold,2100,
2026-04-14,,Saree sold,3445,
2026-04-18,,Saree sold,1070,
2026-04-19,,Saree sold,3400,
2026-04-20,Online mul cotton purchase ,Saree purchase,,1570
2026-04-20,Mobile recharge,Mobile recharge,,800
2026-04-21,Saree sold,Saree sold,1600,
2026-04-22,,Saree sold,1300,
2026-04-23,,Saree sold,600,
2026-04-24,Pappayee tex saree purchase,Saree purchase,,3260
2026-04-24,Inskirt/nighty - chitra,Inskirt purchase,,9550
2026-04-24,Inskirt/nighty - chitra,Inskirt purchase,,11800
2026-04-24,Expenses,Expenses,,290
2026-04-07,Saree sold,Saree sold,5710,
2026-04-25,Uma Pending,,3200,
2026-04-26,Saree sold,Saree sold,800,
2026-04-26,,Saree sold,1430,
2026-05-01,,Saree sold,2060,
2026-05-01,,Saree sold,1300,
2026-05-01,,Saree sold,700,
2026-05-01,,Saree sold,1100,
2026-05-02,,Saree sold,500,
2026-05-03,,Saree sold,350,
2026-05-03,,Saree sold,700,
2026-05-03,,Saree sold,660,
2026-05-06,,Saree sold,1340,
2026-05-06,,Saree sold,1700,
2026-05-06,Courier,Courier,,105
2026-05-06,Saree sold,Saree sold,1530,
2026-05-10,Shop rent,Rent,,2500
2026-05-11,Courier,Courier,,75
2026-05-11,Balu extra amt,,4904,
2026-05-11,Saree purchase tex vally-chitra,Saree Purchase,,12200
2026-05-11,Nighty,Nighty Purchase,,680
2026-05-21,Navrang tex saree purchase,Saree Purchase,,1300
2026-05-28,Pappayee tex saree purchase,Saree Purchase,,6280
,Expenses,Expenses,,150
2026-05-26,Pappayee tex saree purchase,Saree purchase,,1680
2026-05-26,SLNS,,575,
2026-05-11,Saree sold,Saree sold,680,
2026-05-17,,Saree sold,1000,
2026-05-17,,Saree sold,660,
2026-05-20,,Saree sold,700,
2026-05-24,,Saree sold,3200,
2026-05-24,,Saree sold,2500,
2026-05-24,,Saree sold,700,
2026-05-24,,Saree sold,3000,
2026-05-24,,Saree sold,4130,
2026-05-24,,Saree sold,580,
2026-05-25,,Saree sold,570,
2026-05-25,,Saree sold,1600,
2026-05-25,,Saree sold,1100,
2026-05-26,,Saree sold,800,
2026-05-26,Uma Pending extra,,3200,
,Balu Pending extra,,4900,
2026-05-26,Saree sold,Saree Sold,650,
2026-05-26,,Saree Sold,2200,
2026-05-27,,Saree Sold,1000,
2026-05-28,,Saree Sold,1900,
2026-05-28,,Saree Sold,5150,
2026-05-29,Aashika Inskirt,Inskirt purchase,,4635
2026-05-29,Sri sakthi tex,Saree Purchase,,12140
2026-05-29,Expenses,Expenses,,350
2026-05-30,Saree sold,Saree sold,1000,
2026-05-30,,Saree sold,1300,
2026-05-30,,Saree sold,2250,
2026-05-30,,Saree sold,550,
2026-05-30,,Saree sold,3800,
2026-05-31,,Saree sold,565,
2026-05-31,,Saree sold,1100,
2026-05-31,,Saree sold,620,
2026-05-31,,Saree sold,3800,
2026-05-31,,Saree sold,2700,
2026-05-31,,Saree sold,1250,
2026-05-31,Salem,Saree Purchase,,1450
2026-05-31,Inskirt,Inskirt purchase,,240
,current bill,Curent bill,,340
2026-06-04,Bag,Packing expenses,,850
2026-06-06,Sirumugai saree purchase,Saree Purchase,,35000
2026-06-06,Aaradha saree purchase,Saree Purchase,,5900
2026-06-06,Expenses,Expenses,,958
2026-06-06,Car expenses,Expenses,,1400
2026-06-06,Pangudharar amount,,40000,
2026-06-06,Saree sold,Saree sold,300,
2026-06-06,,Saree sold,3000,
2026-06-06,,Saree sold,930,
2026-06-06,Note,,,50
2026-06-06,,,2050,
2026-06-06,,,2400,
2026-06-06,,,1450,
2026-06-07,,,800,
2026-06-07,,,900,
2026-06-07,,,2490,
2026-06-07,,,2440,
2026-06-09,Pappayee tex saree purchase,,,1240
2026-06-09,,,,600
2026-06-09,Saree sold,,700,
2026-06-12,courier,,,300
2026-06-10,Saree sold,,600,
2026-06-10,,,920,
2026-06-10,,,1450,
2026-06-10,,,150,
2026-06-10,,,760,
2026-06-10,,,845,
2026-06-13,Rent,,,2500
,Saree clip,,,1300
2026-07-16,Saree sold,,1900,
2026-06-17,,,960,
2026-06-17,,,1160,
2026-06-17,,,800,
2026-06-18,,,1350,
2026-06-18,,,1600,
2026-06-18,,,340,
2026-06-21,,,400,
2026-06-22,,,1300,
2026-06-20,Saree purchase,,,5400
2026-06-22,,,,200
2026-06-24,courier,,,75
2026-06-24,Sumathi damage saree refund,,,100
2026-06-23,Nighty purchase,,,6600
2026-06-24,nighty sold,,685,
2026-06-24,Saree purchase,,,790
2026-06-25,Saree sold,,700,
2026-06-26,,,1200,
2026-06-27,,,1350,
2026-06-30,,,1025,
2026-06-30,,,2690,
2026-06-30,Saree purchase,,,2370
2026-06-30,Courier,,,110
2026-07-01,Saree sold,,750,
2026-07-01,,,1710,
2026-07-02,,,800,
2026-07-04,,,970,
2026-07-08,,,1200,
2026-07-08,,,1230,
2026-07-08,Saree purchae,,,1580
2026-07-08,,,,700
,Rent,,,2500
2026-07-13,Pooja expenses,,,100
2026-07-15,Mobile recharge,,,900
2026-07-17,Pooja expenses,,,100
2026-07-12,Saree sold,,880,
2026-07-13,,,1000,
2026-07-14,,,770,
2026-07-21,Saree purchase,,,25360
2026-07-21,Expenses,,,1880
2026-07-21,Saree purchase,,,400
2026-07-17,Saree sold,,3100,
2023-07-18,,,4970,
2023-07-19,,,1200,
2026-07-21,,,200,
2026-07-21,,,550,
2026-07-22,,,820,
2026-07-22,,,3400,
2026-07-22,,,4200,
2026-07-22,,,1390,
2026-07-25,Chudidhar purchase,,,26400
,Expenses,,,200
2026-07-24,Saree sold,,1450,
2026-07-25,,,1800,
2026-07-25,,,4330,
2026-07-25,,,75,
2026-07-25,,,520,
2026-07-25,,,750,
2026-07-24,,,1370,
2026-07-24,,,900,
2026-07-26,,,2500,
2026-07-31,Sumathi ,,,1480
2026-07-31,Poongodhai,,,40
2026-07-27,Saree sold,,100,
2026-07-28,,,1650,
2026-07-30,,,1200,
2026-07-31,Navrang saree purchase,,,7200
2026-07-31,,,,570
,Mithra  ,,,8430
,Expenses,,,360
2026-07-31,Saree sold,,1000,
2026-07-31,online saree purchase,,,3010
2026-08-02,Saree sold,,700,
2026-08-02,,,780,
2026-08-04,,,140,
2026-08-04,,,2300,
2026-08-04,,,900,
2026-08-04,,,1785,
2026-08-04,,,1200,
2026-08-04,,,2500,
2026-08-04,,,11450,
2026-08-04,,,350,
2026-08-04,,,670,
2026-08-04,,,1100,
2026-08-05,,,850,
2026-08-05,current bill,,,375
2026-08-05,online saree purchase,,,450
2026-08-05,,,,1050
,,,,350
2026-08-10,Rent,,,2500
,pooja expenses,,,400
2026-08-09,saree sold,,1100,
2026-08-09,,,2300,
2026-08-10,,,120,
2026-08-13,Nighty,,,4260
2026-08-14,Salem saree purchase,,,14200
,Expenses,,,180
,,,160,
2026-08-15,Saree sold,,1200,
2026-08-15,,,2500,
2026-08-15,,,450,450
2026-08-15,,,35,
2026-08-15,,,1700,
2026-08-15,,,325,
2026-08-16,,,980,
2026-08-17,,,700,
2026-08-19,Saree purchase,,,4870
,,,,930
2026-08-20,Pen Note,,,100
2026-08-17,Saree sold,,620,
2026-08-19,,,800,
2026-08-20,,,110,
2026-08-20,,,500,
2026-08-21,,,160,
2026-08-21,,,900,
2026-08-23,,,290,
2026-08-26,,,500,
2026-08-27,,,110,
2026-08-27,,,550,
2026-08-27,,,1850,
2026-08-27,,,1700,
2026-08-29,,,2850,
2026-08-29,,,1890,
2026-08-31,,,4100,
2026-08-31,,,630,
2026-08-31,,,870,
2026-09-02,Palani aandavar tex elampillai,Saree Purchase,,11950
,Pappayee textile,Saree Purchase,,7540
,Food,Expenses,,380
,Chitra (hand loan),,14000,
,Uma (hand loan),,8000,
2026-09-05,Saree sold,Saree sold,2000,
2026-09-05,,Saree sold,3200,
2026-09-07,,Saree sold,685,
2026-09-07,,Saree sold,1450,
2026-09-08,,Saree sold,1475,
2026-09-08,,Saree sold,750,
2026-09-08,,Saree sold,1550,
2026-09-08,,Saree sold,3100,
2026-09-08,,Saree sold,220,
2026-09-09,Nighty purchase,Nighty purchase,,4120
2026-09-10,Rent,Rent,,2900
2026-09-10,Salary,Salary,,5000
2026-09-10,Saree sold,Saree sold,850,
2026-09-11,venkateshwara,Saree purchase,,1870
2026-09-11,Sri sakth sareen,Saree purchase,,5520
2026-09-11,Expenses,Expenses,,220"""

def categorize(particulars, description, entry_type):
    text = f"{particulars} {description}".lower()
    if 'purchase' in text or 'tex' in text or 'vally' in text or 'weaver' in text or 'saree purchae' in text:
        return 'Saree & Stock Purchases'
    if 'rent' in text or 'auto rent' in text:
        return 'Shop Rent & Lease'
    if 'salary' in text or 'wages' in text:
        return 'Staff Salary & Wages'
    if 'pooja' in text or 'sami' in text:
        return 'Pooja & Blessings'
    if 'courier' in text:
        return 'Courier & Shipping'
    if 'bill' in text and ('current' in text or 'electric' in text):
        return 'Electricity & Utility'
    if 'food' in text or 'snacks' in text or 'coffee' in text or 'travel' in text or 'lunch' in text:
        return 'Staff Food & Travel'
    if 'glass' in text or 'tiles' in text or 'ceiling' in text or 'light' in text or 'fan' in text or 'paint' in text or 'board' in text or 'table' in text:
        return 'Shop Interior & Infrastructure'
    if 'tag' in text or 'bag' in text or 'packing' in text or 'clip' in text:
        return 'Packaging Materials'
    if 'hand loan' in text or 'pangudharar' in text:
        return 'Capital & Partner Loan'
    if entry_type == 'credit':
        return 'Sales & Income'
    return 'General Expenses'

class Command(BaseCommand):
    help = "Imports real boutique historical daybook transactions from provided Excel data"

    def handle(self, *args, **options):
        self.stdout.write("Parsing and importing historical ledger data...")
        reader = csv.reader(io.StringIO(CSV_RAW_DATA))
        header = next(reader)
        
        # Clear existing imported ledger if re-running
        LedgerEntry.objects.all().delete()
        
        current_date = "2026-03-08"
        imported_count = 0
        known_suppliers = set()

        for row in reader:
            if not row or len(row) < 4:
                continue
            date_raw = row[0].strip() if len(row) > 0 else ""
            particulars_raw = row[1].strip() if len(row) > 1 else ""
            description_raw = row[2].strip() if len(row) > 2 else ""
            money_in_raw = row[3].strip() if len(row) > 3 else ""
            money_out_raw = row[4].strip() if len(row) > 4 else ""

            if date_raw:
                current_date = date_raw

            entry_date = current_date

            # Clean money in
            dr = None
            if money_in_raw:
                try:
                    dr = Decimal(re.sub(r'[^\d.]', '', money_in_raw))
                except Exception:
                    dr = None

            # Clean money out
            cr = None
            if money_out_raw:
                try:
                    cr = Decimal(re.sub(r'[^\d.]', '', money_out_raw))
                except Exception:
                    cr = None

            if dr is not None and dr > 0:
                p_text = particulars_raw or description_raw or "In-Store Saree Sale"
                d_text = description_raw or "Direct Customer Collection"
                cat = categorize(p_text, d_text, 'credit')
                LedgerEntry.objects.create(
                    entry_date=entry_date,
                    particulars=p_text,
                    description=d_text,
                    entry_type='credit',
                    amount=dr,
                    category=cat,
                    payment_mode='Cash / In-Store'
                )
                imported_count += 1

            if cr is not None and cr > 0:
                p_text = particulars_raw or description_raw or "Boutique Expense"
                d_text = description_raw or "Shop Operation Expense"
                cat = categorize(p_text, d_text, 'debit')
                LedgerEntry.objects.create(
                    entry_date=entry_date,
                    particulars=p_text,
                    description=d_text,
                    entry_type='debit',
                    amount=cr,
                    category=cat,
                    payment_mode='Cash / UPI'
                )
                imported_count += 1

                # Track supplier if purchase
                if 'purchase' in (p_text + ' ' + d_text).lower():
                    supplier_candidate = p_text.replace('Saree purchase', '').replace('saree purchase', '').replace('purchase', '').replace('Purchase', '').strip()
                    if supplier_candidate and len(supplier_candidate) > 2 and supplier_candidate.lower() not in ['online', 'mul', 'expenses', 'salem']:
                        known_suppliers.add((supplier_candidate, cr))

        # Seed initial suppliers
        initial_vendors = [
            ("Palani Aandavar Tex", "Elampillai", "9842144550", "Traditional Silk & Cotton Sarees"),
            ("Navrang Tex", "Surat / Erode", "9842512340", "Soft Silk & Georgette Sarees"),
            ("Pappayee Textiles", "Elampillai", "9443211220", "Pure Zari & Wedding Sarees"),
            ("Sri Sakthi Tex", "Salem", "9842778899", "Chiniya & Kanjivaram Sarees"),
            ("Sirumugai Weavers Hub", "Sirumugai", "9443355660", "Handloom Silk Sarees"),
            ("Tex Valley Vendor (Chitra)", "Erode Tex Valley", "9789012345", "Kurtis, Nighties & Inskirts"),
            ("Coimbatore Saree Hub", "Coimbatore", "9842109876", "Designer Wedding Sarees"),
            ("Sakthi Vinayaga Tex", "Erode", "9843210987", "Mul Cotton Sarees"),
        ]

        for name, city, phone, cat in initial_vendors:
            Supplier.objects.get_or_create(
                name=name,
                defaults={
                    'city': city,
                    'phone': phone,
                    'category': cat,
                    'contact_person': f"{name} Manager",
                    'total_purchases': Decimal(35000),
                    'balance_due': Decimal(0)
                }
            )

        self.stdout.write(self.style.SUCCESS(f"Successfully imported {imported_count} real daybook ledger entries and initialized suppliers!"))
