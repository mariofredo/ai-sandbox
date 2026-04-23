// src/lib/suppliers.ts
import suppliersData from '@/data/suppliers.json'

export interface Product {
  id: string
  name: string
  sku: string
  price: number
  unit: string
  stock: number
}

export interface Supplier {
  id: string
  name: string
  category: string[]
  location: string
  rating: number
  contact: string
  products: Product[]
}

export const suppliers: Supplier[] = suppliersData as Supplier[]

/**
 * Formats supplier data into a structured string
 * that the AI can use as context for recommendations
 */
export function buildSupplierContext(): string {
  return suppliers
    .map((s) => {
      const productList = s.products
        .map(
          (p) =>
            `    - ${p.name} (SKU: ${p.sku}) | Harga: Rp ${p.price.toLocaleString('id-ID')}/${p.unit} | Stok: ${p.stock}`
        )
        .join('\n')

      return `
Supplier: ${s.name} (ID: ${s.id})
Lokasi: ${s.location} | Rating: ${s.rating}/5.0 | Kontak: ${s.contact}
Kategori: ${s.category.join(', ')}
Produk tersedia:
${productList}`
    })
    .join('\n\n---\n')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
