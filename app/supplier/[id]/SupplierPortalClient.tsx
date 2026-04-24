'use client'

import { useState } from 'react'

interface Product { id: string; name: string; sku: string; price: number; unit: string; stock: number }
interface Supplier { id: string; name: string; email: string; location: string; rating: number; categories: string[] }
interface RFQItem { id: string; productName: string; quantity: number; unit: string }
interface Order { id: string; title: string; description: string; status: string; rfqItems: RFQItem[] }
interface Assignment { id: string; orderId: string; order: Order; status: string; notifiedAt: string }
interface RFQResponse { id: string; orderId: string; canSupply: boolean; notes?: string | null; totalPrice?: number | null; items?: unknown }

interface ResponseItem { productName: string; quantity: number; unitPrice: number; totalPrice: number }

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export function SupplierPortalClient({
  supplier,
  assignments,
  responses: initialResponses,
  products,
}: {
  supplier: Supplier
  assignments: Assignment[]
  responses: RFQResponse[]
  products: Product[]
}) {
  const [responses, setResponses] = useState<Map<string, RFQResponse>>(
    new Map(initialResponses.map((r) => [r.orderId, r]))
  )
  const [activeRFQ, setActiveRFQ] = useState<Assignment | null>(null)
  const [canSupply, setCanSupply] = useState(true)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ResponseItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  function openRespond(a: Assignment) {
    setActiveRFQ(a)
    const existing = responses.get(a.orderId)
    if (existing) {
      setCanSupply(existing.canSupply)
      setNotes(existing.notes ?? '')
      setItems(Array.isArray(existing.items) ? (existing.items as ResponseItem[]) : [])
    } else {
      setCanSupply(true)
      setNotes('')
      // Pre-fill items from RFQ items, matched with supplier products
      const pre = a.order.rfqItems.map((rfqItem) => {
        const matched = products.find((p) =>
          p.name.toLowerCase().includes(rfqItem.productName.toLowerCase().split(' ')[0]) ||
          rfqItem.productName.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
        )
        return {
          productName: matched?.name ?? rfqItem.productName,
          quantity: rfqItem.quantity,
          unitPrice: matched?.price ?? 0,
          totalPrice: (matched?.price ?? 0) * rfqItem.quantity,
        }
      })
      setItems(pre)
    }
  }

  function updateItem(index: number, field: keyof ResponseItem, value: string) {
    setItems((prev) => {
      const updated = [...prev]
      const item = { ...updated[index] }
      if (field === 'productName') {
        item.productName = value
      } else {
        const num = parseFloat(value) || 0
        ;(item as any)[field] = num
        if (field === 'unitPrice' || field === 'quantity') {
          item.totalPrice = item.unitPrice * item.quantity
        }
      }
      updated[index] = item
      return updated
    })
  }

  async function submitResponse() {
    if (!activeRFQ) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/supplier/${supplier.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: activeRFQ.orderId,
          canSupply,
          notes: notes || null,
          items: canSupply ? items : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResponses((prev) => new Map(prev).set(activeRFQ.orderId, data))
      setActiveRFQ(null)
    } catch (err) {
      alert(`Gagal submit: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const pending = assignments.filter((a) => !responses.has(a.orderId))
  const responded = assignments.filter((a) => responses.has(a.orderId))

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total RFQ', value: assignments.length, color: 'text-slate-900' },
          { label: 'Menunggu Respon', value: pending.length, color: 'text-amber-600' },
          { label: 'Sudah Direspon', value: responded.length, color: 'text-green-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Pending RFQs */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
            RFQ Menunggu Respon ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((a) => (
              <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-200 dark:border-amber-800 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{a.order.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.order.description}</p>
                  </div>
                  <button
                    onClick={() => openRespond(a)}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0 ml-3"
                  >
                    Beri Respon
                  </button>
                </div>
                <div className="space-y-1">
                  {a.order.rfqItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                      <span className="text-slate-600 dark:text-slate-400">{item.productName}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{item.quantity} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Responded RFQs */}
      {responded.length > 0 && (
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
            Sudah Direspon ({responded.length})
          </h2>
          <div className="space-y-3">
            {responded.map((a) => {
              const r = responses.get(a.orderId)!
              return (
                <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">{a.order.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.canSupply ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {r.canSupply ? 'Bisa Supply' : 'Tidak Bisa'}
                        </span>
                        {r.totalPrice && (
                          <span className="text-xs text-slate-500">Total: {fmt(r.totalPrice)}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openRespond(a)}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium ml-3"
                    >
                      Edit
                    </button>
                  </div>
                  {r.notes && <p className="text-xs text-slate-500 mt-2 italic">"{r.notes}"</p>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-slate-500 text-sm">Belum ada RFQ yang dikirimkan ke Anda.</p>
        </div>
      )}

      {/* Response Modal */}
      {activeRFQ && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">{activeRFQ.order.title}</h2>
              <p className="text-xs text-slate-500 mt-0.5">Berikan respon Anda untuk RFQ ini</p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Can supply toggle */}
              <div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Apakah Anda bisa supply item ini?</p>
                <div className="flex gap-2">
                  {[true, false].map((val) => (
                    <button
                      key={String(val)}
                      onClick={() => setCanSupply(val)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${canSupply === val ? (val ? 'bg-green-100 text-green-700 border-2 border-green-400' : 'bg-red-100 text-red-600 border-2 border-red-400') : 'bg-slate-100 text-slate-500 border-2 border-transparent'}`}
                    >
                      {val ? '✅ Ya, Bisa' : '❌ Tidak Bisa'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items pricing */}
              {canSupply && items.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Rincian Harga Penawaran</p>
                  <div className="space-y-3">
                    {items.map((item, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{item.productName}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block">Qty</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                              className="w-full text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 text-slate-900 dark:text-white outline-none focus:border-indigo-400"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 mb-1 block">Harga/unit (Rp)</label>
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                              className="w-full text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 text-slate-900 dark:text-white outline-none focus:border-indigo-400"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          Subtotal: {fmt(item.totalPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="text-right mt-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      Total: {fmt(items.reduce((s, i) => s + i.totalPrice, 0))}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Catatan (opsional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Kondisi stok, waktu pengiriman, syarat pembayaran, dll."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white outline-none focus:border-indigo-400 resize-none"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <button
                onClick={() => setActiveRFQ(null)}
                className="flex-1 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                Batal
              </button>
              <button
                onClick={submitResponse}
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {isSubmitting ? 'Mengirim...' : 'Kirim Respon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
