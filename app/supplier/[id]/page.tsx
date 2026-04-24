import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { SupplierPortalClient } from './SupplierPortalClient'

export default async function SupplierPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supplier = await db.supplier.findUnique({ where: { id } })
  if (!supplier) notFound()

  const assignments = await db.rFQAssignment.findMany({
    where: { supplierId: id },
    include: { order: { include: { rfqItems: true } } },
    orderBy: { notifiedAt: 'desc' },
  })

  const orderIds = assignments.map((a) => a.orderId)
  const responses = await db.rFQResponse.findMany({
    where: { supplierId: id, orderId: { in: orderIds } },
  })

  const supplierProducts = await db.product.findMany({ where: { supplierId: id } })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">SP</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-sm">{supplier.name}</h1>
              <p className="text-xs text-slate-500">Portal Supplier · {supplier.location} · ⭐ {supplier.rating}</p>
            </div>
          </div>
        </div>
      </header>

      <SupplierPortalClient
        supplier={{ ...supplier, categories: supplier.categories }}
        assignments={assignments as any}
        responses={responses as any}
        products={supplierProducts}
      />
    </div>
  )
}
