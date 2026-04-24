import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

const suppliersData = [
  {
    id: 'SUP001',
    name: 'PT Maju Bersama Teknik',
    email: 'info@majubersama.co.id',
    phone: '021-5551234',
    location: 'Jakarta',
    rating: 4.8,
    categories: ['elektronik', 'komputer', 'peralatan kantor'],
    products: [
      { id: 'P001', name: 'Laptop ASUS VivoBook 15', sku: 'LAP-ASUS-VB15', price: 8500000, unit: 'unit', stock: 25 },
      { id: 'P002', name: 'Monitor LG 24 inch Full HD', sku: 'MON-LG-24FHD', price: 2800000, unit: 'unit', stock: 40 },
      { id: 'P003', name: 'Keyboard Mechanical Logitech', sku: 'KEY-LOG-MECH', price: 950000, unit: 'unit', stock: 60 },
      { id: 'P004', name: 'Mouse Wireless Logitech MX', sku: 'MOU-LOG-MX', price: 750000, unit: 'unit', stock: 80 },
      { id: 'P005', name: 'UPS APC 650VA', sku: 'UPS-APC-650', price: 1200000, unit: 'unit', stock: 15 },
      { id: 'P006', name: 'Printer HP LaserJet Pro', sku: 'PRT-HP-LJP', price: 3500000, unit: 'unit', stock: 10 },
    ],
  },
  {
    id: 'SUP002',
    name: 'CV Sejahtera Alat Tulis',
    email: 'info@sejahtera-at.co.id',
    phone: '022-4441234',
    location: 'Bandung',
    rating: 4.5,
    categories: ['alat tulis', 'kertas', 'perlengkapan kantor'],
    products: [
      { id: 'P007', name: 'Kertas HVS A4 80gsm (rim)', sku: 'KRT-HVS-A4-80', price: 55000, unit: 'rim', stock: 500 },
      { id: 'P008', name: 'Pulpen Pilot BPS-GP (lusin)', sku: 'PLP-PIL-BPSGP', price: 42000, unit: 'lusin', stock: 200 },
      { id: 'P009', name: 'Stabilo Boss 4 warna', sku: 'STB-BOS-4W', price: 38000, unit: 'set', stock: 150 },
      { id: 'P010', name: 'Map Plastik Mika A4 (pak)', sku: 'MAP-PLT-A4', price: 25000, unit: 'pak', stock: 300 },
      { id: 'P011', name: 'Amplop Panjang 100 pcs', sku: 'AMP-PJG-100', price: 18000, unit: 'box', stock: 400 },
      { id: 'P012', name: 'Binder Clip 51mm (box)', sku: 'BDR-CLP-51', price: 22000, unit: 'box', stock: 250 },
      { id: 'P013', name: 'Sticky Notes 3x3 (6 pads)', sku: 'STK-NOT-3X3', price: 35000, unit: 'set', stock: 180 },
    ],
  },
  {
    id: 'SUP003',
    name: 'PT Furniture Indonesia Prima',
    email: 'info@furniture-prima.co.id',
    phone: '031-3331234',
    location: 'Surabaya',
    rating: 4.6,
    categories: ['furnitur', 'kursi', 'meja', 'lemari'],
    products: [
      { id: 'P014', name: 'Kursi Ergonomis Executive', sku: 'KRS-ERG-EXC', price: 4500000, unit: 'unit', stock: 20 },
      { id: 'P015', name: 'Meja Kerja L-Shape 160cm', sku: 'MJA-LSH-160', price: 3200000, unit: 'unit', stock: 12 },
      { id: 'P016', name: 'Lemari Arsip 4 Laci', sku: 'LMR-ARS-4L', price: 2800000, unit: 'unit', stock: 8 },
      { id: 'P017', name: 'Sofa Tunggu 3 Seater', sku: 'SFA-TGG-3S', price: 6500000, unit: 'unit', stock: 5 },
      { id: 'P018', name: 'Rak Buku 5 Susun', sku: 'RAK-BKU-5S', price: 1800000, unit: 'unit', stock: 15 },
      { id: 'P019', name: 'Partisi Kantor 180x120cm', sku: 'PRT-KNT-180', price: 2200000, unit: 'unit', stock: 30 },
    ],
  },
  {
    id: 'SUP004',
    name: 'UD Teknik Mandiri',
    email: 'info@teknikmandiri.co.id',
    phone: '021-7771234',
    location: 'Jakarta',
    rating: 4.3,
    categories: ['peralatan kebersihan', 'janitorial', 'maintenance'],
    products: [
      { id: 'P020', name: 'Mesin Pel Otomatis Karcher', sku: 'MPL-KRC-OTO', price: 5500000, unit: 'unit', stock: 6 },
      { id: 'P021', name: 'Vacuum Cleaner Industri', sku: 'VAC-IND-15L', price: 3200000, unit: 'unit', stock: 8 },
      { id: 'P022', name: 'Sabun Pembersih Lantai 5L', sku: 'SBN-PLT-5L', price: 85000, unit: 'jerigen', stock: 100 },
      { id: 'P023', name: 'Sapu Ijuk Premium', sku: 'SPU-IJK-PRM', price: 45000, unit: 'unit', stock: 200 },
      { id: 'P024', name: 'Tissue Toilet (48 roll)', sku: 'TSU-TLT-48', price: 120000, unit: 'karton', stock: 150 },
      { id: 'P025', name: 'Hand Sanitizer 5L Refill', sku: 'HNS-5L-REF', price: 175000, unit: 'jerigen', stock: 80 },
    ],
  },
  {
    id: 'SUP005',
    name: 'PT Networking Solusi Digital',
    email: 'info@networkingsolusi.co.id',
    phone: '021-8881234',
    location: 'Jakarta',
    rating: 4.7,
    categories: ['jaringan', 'networking', 'telekomunikasi', 'server'],
    products: [
      { id: 'P026', name: 'Switch Cisco 24 Port PoE', sku: 'SWT-CSC-24P', price: 12000000, unit: 'unit', stock: 10 },
      { id: 'P027', name: 'Router Mikrotik hEX RB750', sku: 'RTR-MKT-HEX', price: 850000, unit: 'unit', stock: 25 },
      { id: 'P028', name: 'Access Point Ubiquiti UniFi', sku: 'AP-UBQ-UAP', price: 2200000, unit: 'unit', stock: 30 },
      { id: 'P029', name: 'Kabel UTP Cat6 (305m roll)', sku: 'KBL-UTP-C6', price: 950000, unit: 'roll', stock: 50 },
      { id: 'P030', name: 'Patch Panel 24 Port', sku: 'PPL-24P-CAT6', price: 680000, unit: 'unit', stock: 20 },
      { id: 'P031', name: 'Server Dell PowerEdge T150', sku: 'SRV-DEL-T150', price: 28000000, unit: 'unit', stock: 4 },
    ],
  },
  {
    id: 'SUP006',
    name: 'CV Pantry & Kitchen Supply',
    email: 'info@pantry-kitchen.co.id',
    phone: '021-5559876',
    location: 'Tangerang',
    rating: 4.4,
    categories: ['pantry', 'dapur', 'makanan', 'minuman', 'konsumsi'],
    products: [
      { id: 'P032', name: 'Kopi Kapal Api Special (50 sachet)', sku: 'KPI-KAP-50S', price: 35000, unit: 'box', stock: 200 },
      { id: 'P033', name: 'Teh Sariwangi (100 bag)', sku: 'TEH-SRW-100', price: 28000, unit: 'box', stock: 300 },
      { id: 'P034', name: 'Gula Pasir 1kg', sku: 'GUL-PAS-1KG', price: 16000, unit: 'kg', stock: 500 },
      { id: 'P035', name: 'Creamer Frisian Flag (1kg)', sku: 'CRM-FFS-1KG', price: 48000, unit: 'pack', stock: 150 },
      { id: 'P036', name: 'Air Mineral Aqua 600ml (24 btl)', sku: 'AIR-AQA-600', price: 42000, unit: 'karton', stock: 400 },
      { id: 'P037', name: 'Cup Sealer Machine', sku: 'CSL-MCH-AUTO', price: 1800000, unit: 'unit', stock: 5 },
      { id: 'P038', name: 'Dispenser Hot & Cold', sku: 'DSP-HOT-CLD', price: 650000, unit: 'unit', stock: 20 },
    ],
  },
]

async function main() {
  console.log('Seeding database...')

  await prisma.admin.upsert({
    where: { email: 'mario@team.superfk.co' },
    update: {},
    create: {
      id: 'admin_1',
      email: 'mario@team.superfk.co',
      name: 'Mario',
      password: 'hashed_password_placeholder',
    },
  })
  console.log('Admin seeded: mario@team.superfk.co')

  for (const s of suppliersData) {
    const supplier = await prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        location: s.location,
        rating: s.rating,
        categories: s.categories,
      },
    })

    for (const p of s.products) {
      await prisma.product.upsert({
        where: { sku: p.sku },
        update: {},
        create: {
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price,
          unit: p.unit,
          stock: p.stock,
          supplierId: supplier.id,
        },
      })
    }
    console.log(`Supplier seeded: ${supplier.name} (${s.products.length} products)`)
  }

  console.log('Seeding complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
