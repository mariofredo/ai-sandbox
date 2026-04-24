import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent'

async function buildSupplierContext() {
  const suppliers = await db.supplier.findMany({ include: { products: true } })
  return suppliers
    .map((s) => {
      const productList = s.products
        .map(
          (p) =>
            `    - ${p.name} (SKU: ${p.sku}) | Harga: Rp ${p.price.toLocaleString('id-ID')}/${p.unit} | Stok: ${p.stock}`
        )
        .join('\n')
      return `Supplier: ${s.name} (ID: ${s.id})
Lokasi: ${s.location} | Rating: ${s.rating}/5.0 | Email: ${s.email} | Kontak: ${s.phone ?? '-'}
Kategori: ${s.categories.join(', ')}
Produk tersedia:\n${productList}`
    })
    .join('\n\n---\n')
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in environment variables' },
        { status: 500 }
      )
    }

    const supplierContext = await buildSupplierContext()

    const systemPrompt = `Kamu adalah AI Procurement Assistant untuk dashboard pengadaan barang perusahaan.

Tugasmu adalah membantu admin membuat RFQ (Request for Quotation) dan merekomendasikan supplier dari database.

PENTING - Database Supplier yang tersedia:
${supplierContext}

---

Panduan cara menjawab:
1. Pahami kebutuhan barang yang diminta (jenis, jumlah, spesifikasi, anggaran)
2. Bantu admin merumuskan RFQ yang terstruktur dengan daftar item
3. Cocokkan dengan supplier yang memiliki produk relevan
4. Rekomendasikan 1-3 supplier terbaik yang paling sesuai
5. Untuk setiap supplier, tampilkan produk relevan, harga, dan stok
6. Jika admin minta "buat RFQ", format outputmu sebagai JSON dalam code block:
\`\`\`json
{
  "rfq": {
    "title": "Judul RFQ singkat",
    "description": "Deskripsi kebutuhan lengkap",
    "items": [
      { "productName": "nama produk", "quantity": 10, "unit": "unit" }
    ]
  }
}
\`\`\`
7. Gunakan Bahasa Indonesia yang profesional namun ramah

Format rekomendasi supplier:
✅ **[Nama Supplier]** (ID: SUPXXX)
📍 Lokasi: [kota] | ⭐ Rating: [rating]/5.0
📦 Produk yang cocok:
  • [Nama Produk] - Rp [harga]/[unit] (Stok: [jumlah])
💡 Mengapa direkomendasikan: [alasan singkat]`

    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + '\n\nBaik, saya siap membantu pengadaan barang.' }],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'Halo! Saya adalah AI Procurement Assistant. Saya siap membantu Anda membuat RFQ dan menemukan supplier terbaik. Ceritakan kebutuhan barang Anda! 🛒',
          },
        ],
      },
      ...geminiMessages,
    ]

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 2048 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json(
        { error: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiMessage) return NextResponse.json({ error: 'No response from AI' }, { status: 500 })

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
