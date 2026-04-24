import Link from 'next/link'
import { db } from '@/lib/db'

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Dikirim ke Supplier',
  REVIEWING: 'Meninjau Penawaran',
  AWARDED: 'Terpilih',
  CLOSED: 'Ditutup',
}

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT: 'bg-blue-100 text-blue-700',
  REVIEWING: 'bg-amber-100 text-amber-700',
  AWARDED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-700',
}

export default async function AdminDashboard() {
  const [orders, supplierCount] = await Promise.all([
    db.order.findMany({
      include: {
        rfqItems: true,
        _count: { select: { assignments: true, responses: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.supplier.count(),
  ])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top nav */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">AI</span>
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-sm">AI Procurement</h1>
              <p className="text-xs text-slate-500">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              {supplierCount} supplier terdaftar
            </span>
            <Link
              href="/rfq/create"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              + Buat RFQ Baru
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total RFQ', value: orders.length, color: 'text-slate-900' },
            { label: 'Aktif', value: orders.filter((o) => o.status === 'SENT' || o.status === 'REVIEWING').length, color: 'text-blue-600' },
            { label: 'Terpilih', value: orders.filter((o) => o.status === 'AWARDED').length, color: 'text-green-600' },
            { label: 'Supplier DB', value: supplierCount, color: 'text-indigo-600' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* RFQ List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 dark:text-white">Daftar RFQ</h2>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-slate-500 text-sm mb-4">Belum ada RFQ. Buat RFQ pertama Anda!</p>
              <Link
                href="/rfq/create"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Buat RFQ Baru
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/rfq/${order.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate group-hover:text-indigo-600 transition-colors">
                      {order.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {order.rfqItems.length} item · {order._count.assignments} supplier dinotifikasi · {order._count.responses} respon
                    </p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 text-right">
                    <div>
                      <p className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-4 flex gap-3">
          <Link
            href="/supplier/SUP001"
            className="text-xs text-slate-500 hover:text-indigo-600 underline"
          >
            Demo: Portal Supplier
          </Link>
          <span className="text-slate-300">|</span>
          <Link
            href="/website-checker"
            className="text-xs text-slate-500 hover:text-indigo-600 underline"
          >
            Website Checker
          </Link>
        </div>
      </main>
    </div>
  )
}
