'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { renderMarkdown } from '@/lib/markdown'

interface RFQItem { id: string; productName: string; quantity: number; unit: string; notes?: string | null }
interface Supplier { id: string; name: string; email: string; phone?: string | null; location: string; rating: number; categories: string[] }
interface RFQAssignment { id: string; supplierId: string; supplier: Supplier; status: string }
interface ResponseItem { productName: string; quantity: number; unitPrice: number; totalPrice: number }
interface RFQResponse { id: string; supplierId: string; supplier: Supplier; canSupply: boolean; notes?: string | null; totalPrice?: number | null; items?: ResponseItem[] | null; isSelected: boolean }

interface Order {
  id: string; title: string; description: string; status: string
  rfqItems: RFQItem[]; assignments: RFQAssignment[]; responses: RFQResponse[]
  aiSuggestion?: string | null; awardedTo?: string[] | null
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', SENT: 'Dikirim ke Supplier',
  REVIEWING: 'Meninjau Penawaran', AWARDED: 'Terpilih', CLOSED: 'Ditutup',
}
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600', SENT: 'bg-blue-100 text-blue-700',
  REVIEWING: 'bg-amber-100 text-amber-700', AWARDED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-red-100 text-red-700',
}

function fmt(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

export function RFQDetailClient({ order: initialOrder }: { order: Order }) {
  const router = useRouter()
  const [order, setOrder] = useState<Order>(initialOrder)
  const [isBlasting, setIsBlasting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(new Set(initialOrder.awardedTo ?? []))
  const [isAwarding, setIsAwarding] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'responses' | 'ai'>('overview')

  async function blast() {
    setIsBlasting(true)
    try {
      const res = await fetch(`/api/rfq/${order.id}/blast`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.refresh()
      setOrder((prev) => ({ ...prev, status: 'SENT', assignments: data.assignments }))
      setActiveTab('responses')
    } catch (err) {
      alert(`Gagal blast: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setIsBlasting(false)
    }
  }

  async function analyzeResponses() {
    setIsAnalyzing(true)
    try {
      const res = await fetch(`/api/rfq/${order.id}/responses`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder((prev) => ({ ...prev, aiSuggestion: data.suggestion, status: 'REVIEWING' }))
      setActiveTab('ai')
    } catch (err) {
      alert(`Gagal analisis: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  async function awardSelected() {
    if (selectedSuppliers.size === 0) return
    setIsAwarding(true)
    try {
      const res = await fetch(`/api/rfq/${order.id}/award`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierIds: Array.from(selectedSuppliers) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder((prev) => ({ ...prev, status: 'AWARDED', awardedTo: Array.from(selectedSuppliers) }))
    } catch (err) {
      alert(`Gagal award: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setIsAwarding(false)
    }
  }

  function toggleSupplier(id: string) {
    setSelectedSuppliers((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const canBlast = order.status === 'DRAFT'
  const canAnalyze = order.status === 'SENT' && order.responses.length > 0
  const canAward = (order.status === 'REVIEWING' || order.status === 'SENT') && order.responses.length > 0

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      {/* Status + Actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-slate-100 text-slate-600'}`}>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
        <div className="flex gap-2">
          {canBlast && (
            <button
              onClick={blast}
              disabled={isBlasting}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isBlasting ? 'Mengirim...' : '📡 Blast ke Supplier'}
            </button>
          )}
          {canAnalyze && (
            <button
              onClick={analyzeResponses}
              disabled={isAnalyzing}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isAnalyzing ? 'Menganalisis...' : '🤖 Analisis AI'}
            </button>
          )}
          {canAward && selectedSuppliers.size > 0 && (
            <button
              onClick={awardSelected}
              disabled={isAwarding}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isAwarding ? 'Memproses...' : `✅ Award (${selectedSuppliers.size})`}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: RFQ Info */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">Detail RFQ</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">{order.description}</p>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Item yang Dibutuhkan</h3>
            <div className="space-y-2">
              {order.rfqItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.productName}</span>
                  <span className="text-slate-500">{item.quantity} {item.unit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Assigned Suppliers */}
          {order.assignments.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h2 className="font-semibold text-slate-900 dark:text-white text-sm mb-3">
                Supplier Dinotifikasi ({order.assignments.length})
              </h2>
              <div className="space-y-2">
                {order.assignments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{a.supplier.name}</p>
                      <p className="text-slate-500">{a.supplier.location}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${a.status === 'RESPONDED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                      {a.status === 'RESPONDED' ? 'Sudah Respon' : 'Menunggu'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {([['overview', 'Overview'], ['responses', `Respon (${order.responses.length})`], ['ai', 'AI Rekomendasi']] as const).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 text-xs font-medium py-2 rounded-md transition-colors ${activeTab === tab ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              {order.status === 'DRAFT' ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📡</div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm mb-1 font-medium">RFQ siap dikirim</p>
                  <p className="text-xs text-slate-400 mb-4">Klik "Blast ke Supplier" untuk mengirimkan RFQ ini ke supplier yang relevan secara otomatis.</p>
                  <button onClick={blast} disabled={isBlasting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                    {isBlasting ? 'Mengirim...' : '📡 Blast ke Supplier'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[
                    { label: 'Supplier Dinotifikasi', value: order.assignments.length, color: 'text-blue-600' },
                    { label: 'Sudah Merespon', value: order.responses.length, color: 'text-green-600' },
                    { label: 'Bisa Supply', value: order.responses.filter(r => r.canSupply).length, color: 'text-indigo-600' },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Responses tab */}
          {activeTab === 'responses' && (
            <div className="space-y-3">
              {order.responses.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
                  <div className="text-3xl mb-2">⏳</div>
                  <p className="text-slate-500 text-sm">Menunggu respon dari supplier...</p>
                  <p className="text-xs text-slate-400 mt-1">Supplier dapat merespon melalui portal mereka.</p>
                </div>
              ) : (
                order.responses.map((r) => {
                  const isSelected = selectedSuppliers.has(r.supplierId)
                  const isAwarded = order.awardedTo?.includes(r.supplierId)
                  return (
                    <div
                      key={r.id}
                      className={`bg-white dark:bg-slate-900 rounded-xl border-2 transition-colors ${
                        isAwarded ? 'border-green-500' : isSelected ? 'border-indigo-400' : 'border-slate-200 dark:border-slate-800'
                      } p-5`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{r.supplier.name}</p>
                            {isAwarded && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✅ Terpilih</span>}
                          </div>
                          <p className="text-xs text-slate-500">📍 {r.supplier.location} · ⭐ {r.supplier.rating}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.canSupply ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {r.canSupply ? 'Bisa Supply' : 'Tidak Bisa'}
                          </span>
                          {r.canSupply && canAward && (
                            <button
                              onClick={() => toggleSupplier(r.supplierId)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                                isSelected
                                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? '✓ Dipilih' : 'Pilih'}
                            </button>
                          )}
                        </div>
                      </div>

                      {r.totalPrice && (
                        <div className="text-sm font-semibold text-slate-900 dark:text-white mb-2">
                          Total: {fmt(r.totalPrice)}
                        </div>
                      )}

                      {r.notes && <p className="text-xs text-slate-500 mb-2 italic">"{r.notes}"</p>}

                      {Array.isArray(r.items) && r.items.length > 0 && (
                        <div className="border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Rincian Penawaran</p>
                          <div className="space-y-1">
                            {(r.items as ResponseItem[]).map((item, j) => (
                              <div key={j} className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 dark:text-slate-400">{item.productName} × {item.quantity}</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">{fmt(item.totalPrice)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {canAnalyze && (
                <button
                  onClick={analyzeResponses}
                  disabled={isAnalyzing}
                  className="w-full bg-amber-50 hover:bg-amber-100 border-2 border-dashed border-amber-300 text-amber-700 text-sm font-medium py-3 rounded-xl transition-colors"
                >
                  {isAnalyzing ? '🤖 Menganalisis...' : '🤖 Minta Rekomendasi AI'}
                </button>
              )}
            </div>
          )}

          {/* AI tab */}
          {activeTab === 'ai' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              {order.aiSuggestion ? (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">AI</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">Rekomendasi AI</span>
                  </div>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert text-slate-700 dark:text-slate-300"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(order.aiSuggestion) }}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">🤖</div>
                  <p className="text-slate-500 text-sm mb-1 font-medium">Belum ada analisis AI</p>
                  <p className="text-xs text-slate-400 mb-4">AI akan menganalisis semua respon supplier dan merekomendasikan pilihan terbaik.</p>
                  {canAnalyze && (
                    <button onClick={analyzeResponses} disabled={isAnalyzing} className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
                      {isAnalyzing ? 'Menganalisis...' : '🤖 Mulai Analisis'}
                    </button>
                  )}
                  {!canAnalyze && order.status === 'SENT' && order.responses.length === 0 && (
                    <p className="text-xs text-slate-400">Tunggu supplier merespon terlebih dahulu.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
