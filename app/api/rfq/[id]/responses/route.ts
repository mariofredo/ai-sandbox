import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const responses = await db.rFQResponse.findMany({
    where: { orderId: id },
    include: { supplier: true },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(responses)
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await db.order.findUnique({
    where: { id },
    include: { rfqItems: true, responses: { include: { supplier: true } } },
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.responses.length === 0) {
    return NextResponse.json({ error: 'No supplier responses yet' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })

  const itemsContext = order.rfqItems
    .map((i) => `- ${i.productName} (${i.quantity} ${i.unit})`)
    .join('\n')

  const responsesContext = order.responses
    .map((r) => {
      const items = Array.isArray(r.items) ? r.items : []
      const itemsStr = (items as Array<{ productName: string; quantity: number; unitPrice: number; totalPrice: number }>)
        .map((i) => `  • ${i.productName}: Rp ${i.unitPrice?.toLocaleString('id-ID')} × ${i.quantity} = Rp ${i.totalPrice?.toLocaleString('id-ID')}`)
        .join('\n')

      return `Supplier: ${r.supplier.name} (Rating: ${r.supplier.rating}/5.0, Lokasi: ${r.supplier.location})
Bisa supply: ${r.canSupply ? 'Ya' : 'Tidak'}
Total harga: ${r.totalPrice ? 'Rp ' + r.totalPrice.toLocaleString('id-ID') : 'N/A'}
Catatan: ${r.notes ?? '-'}
Item:\n${itemsStr || '  (tidak ada detail item)'}`
    })
    .join('\n\n---\n\n')

  const prompt = `Kamu adalah AI Procurement Advisor. Analisis respon supplier untuk RFQ berikut.

RFQ: ${order.title}
Deskripsi: ${order.description}
Item yang dibutuhkan:
${itemsContext}

RESPON SUPPLIER:
${responsesContext}

Rekomendasikan supplier terbaik berdasarkan kemampuan supply, harga, rating, dan lokasi.

Format output:
**Rekomendasi Utama:** [nama supplier]
**Alasan:** [2-3 kalimat]
**Perbandingan Singkat:**
[poin per supplier]
**Kesimpulan:** [saran final]`

  let suggestion = 'Analisis AI tidak tersedia.'
  const geminiRes = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    }),
  })

  if (geminiRes.ok) {
    const data = await geminiRes.json()
    suggestion = data.candidates?.[0]?.content?.parts?.[0]?.text ?? suggestion
  }

  await db.order.update({
    where: { id },
    data: { aiSuggestion: suggestion, status: 'REVIEWING' },
  })

  return NextResponse.json({ suggestion })
}
