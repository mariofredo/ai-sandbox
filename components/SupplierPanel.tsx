'use client'

// src/components/SupplierPanel.tsx
import { suppliers } from '@/lib/suppliers'

export function SupplierPanel() {
  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-white text-sm">Database Supplier</h2>
        <p className="text-xs text-slate-500 mt-0.5">{suppliers.length} supplier terdaftar</p>
      </div>

      {/* Supplier list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700"
          >
            {/* Supplier header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight truncate">
                  {supplier.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  📍 {supplier.location} · ID: {supplier.id}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg px-1.5 py-0.5">
                <span className="text-amber-500 text-xs">★</span>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {supplier.rating}
                </span>
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1 mb-2">
              {supplier.category.slice(0, 3).map((cat) => (
                <span
                  key={cat}
                  className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-full px-2 py-0.5 capitalize"
                >
                  {cat}
                </span>
              ))}
              {supplier.category.length > 3 && (
                <span className="text-[10px] text-slate-400">+{supplier.category.length - 3}</span>
              )}
            </div>

            {/* Product count */}
            <p className="text-[10px] text-slate-400">
              {supplier.products.length} produk tersedia
            </p>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <p className="text-[10px] text-slate-400 text-center">
          Data diinject otomatis ke AI sebagai konteks
        </p>
      </div>
    </aside>
  )
}
