import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { RFQDetailClient } from './RFQDetailClient'

export default async function RFQDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    include: {
      rfqItems: true,
      assignments: { include: { supplier: true } },
      responses: { include: { supplier: true }, orderBy: { totalPrice: 'asc' } },
    },
  })

  if (!order) notFound()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-slate-900 dark:text-white text-sm truncate">{order.title}</h1>
            <p className="text-xs text-slate-500">{order.rfqItems.length} item · {order.assignments.length} supplier · {order.responses.length} respon</p>
          </div>
        </div>
      </header>

      <RFQDetailClient order={order as any} />
    </div>
  )
}
