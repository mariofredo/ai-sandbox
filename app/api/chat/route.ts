// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildSupplierContext } from '@/lib/suppliers'

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-27b-it:generateContent'

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

    // Build supplier context to inject into system prompt
    const supplierContext = buildSupplierContext()

    const systemPrompt = `Kamu adalah AI Procurement Assistant untuk dashboard pengadaan barang perusahaan.

Tugasmu adalah membantu pengguna menemukan dan merekomendasikan supplier beserta produk-produk yang sesuai dengan kebutuhan pengadaan mereka.

PENTING - Database Supplier yang tersedia:
${supplierContext}

---

Panduan cara menjawab:
1. Pahami kebutuhan barang yang diminta pengguna (jenis, jumlah, anggaran jika disebutkan)
2. Cocokkan dengan supplier yang memiliki produk relevan dari database di atas
3. Rekomendasikan 1-3 supplier terbaik yang paling sesuai
4. Untuk setiap supplier yang direkomendasikan, tampilkan:
   - Nama supplier dan ID-nya
   - Produk spesifik yang relevan beserta harga dan stok
   - Alasan mengapa supplier ini direkomendasikan
5. Jika ada beberapa pilihan produk serupa dari supplier berbeda, bandingkan harga dan rekomendasikan yang terbaik
6. Selalu gunakan format yang rapi dan mudah dibaca
7. Jika kebutuhan tidak tersedia di database, sampaikan dengan jujur dan minta clarifikasi
8. Gunakan Bahasa Indonesia yang profesional namun tetap ramah

Format output rekomendasi:
✅ **[Nama Supplier]** (ID: SUPXXX)
📍 Lokasi: [kota] | ⭐ Rating: [rating]/5.0
📦 Produk yang cocok:
  • [Nama Produk] - Rp [harga]/[unit] (Stok: [jumlah])
💡 Mengapa direkomendasikan: [alasan singkat]`

    // Convert our message format to Gemini's format
    // Gemini uses 'user' and 'model' roles (not 'assistant')
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    // Gemini API doesn't have a system role in the same way as OpenAI
    // We prepend the system prompt as a user+model exchange
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt + '\n\nBaik, saya siap membantu pengadaan barang.' }],
      },
      {
        role: 'model',
        parts: [
          {
            text: 'Halo! Saya adalah AI Procurement Assistant. Saya siap membantu Anda menemukan supplier dan produk terbaik sesuai kebutuhan pengadaan. Silakan ceritakan barang apa yang Anda butuhkan! 🛒',
          },
        ],
      },
      ...geminiMessages,
    ]

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
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
      console.error('Gemini API error:', errorData)
      return NextResponse.json(
        { error: `Gemini API error: ${errorData.error?.message || 'Unknown error'}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract the text response from Gemini's response format
    const aiMessage = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!aiMessage) {
      return NextResponse.json({ error: 'No response generated from AI' }, { status: 500 })
    }

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
