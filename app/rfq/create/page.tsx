'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { renderMarkdown } from '@/lib/markdown'

interface ParsedRFQ {
  title: string
  description: string
  items: { productName: string; quantity: number; unit: string }[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  parsedRFQ?: ParsedRFQ
}

function extractRFQ(text: string): ParsedRFQ | null {
  const match = text.match(/```json\s*([\s\S]*?)```/)
  if (!match) return null
  try {
    const parsed = JSON.parse(match[1])
    return parsed.rfq ?? null
  } catch {
    return null
  }
}

export default function CreateRFQPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Halo! Saya akan membantu Anda membuat **RFQ (Request for Quotation)**.\n\nCeritakan kebutuhan pengadaan barang Anda — jenis barang, jumlah, spesifikasi, dan anggaran jika ada. Saya akan membantu merumuskan RFQ yang terstruktur dan menemukan supplier yang tepat.\n\nContoh: *"Butuh 10 laptop untuk tim developer dan 5 printer laser untuk kantor baru"*',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [pendingRFQ, setPendingRFQ] = useState<ParsedRFQ | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return

    const userMsg: ChatMessage = { role: 'user', content: content.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const aiContent: string = data.message
      const parsed = extractRFQ(aiContent)

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: aiContent,
        parsedRFQ: parsed ?? undefined,
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (parsed) setPendingRFQ(parsed)
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}` },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  async function createRFQ(rfq: ParsedRFQ) {
    setIsCreating(true)
    try {
      const res = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: rfq.title,
          description: rfq.description,
          items: rfq.items,
          adminId: 'admin_1',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      router.push(`/rfq/${data.id}`)
    } catch (err) {
      alert(`Gagal membuat RFQ: ${err instanceof Error ? err.message : 'Error'}`)
    } finally {
      setIsCreating(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <a href="/" className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div>
            <h1 className="font-semibold text-slate-900 dark:text-white text-sm">Buat RFQ Baru</h1>
            <p className="text-xs text-slate-500">Ceritakan kebutuhan Anda ke AI</p>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-6 flex flex-col gap-4 overflow-y-auto">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <span className="text-white text-[10px] font-bold">AI</span>
              </div>
            )}
            <div className={`max-w-[75%] ${msg.role === 'user' ? 'max-w-[65%]' : ''}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content.replace(/```json[\s\S]*?```/g, '')) }}
                  />
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>

              {/* RFQ Preview Card */}
              {msg.parsedRFQ && (
                <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">📋 RFQ Terdeteksi</span>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white text-sm mb-1">{msg.parsedRFQ.title}</p>
                  <p className="text-xs text-slate-500 mb-3">{msg.parsedRFQ.description}</p>
                  <div className="space-y-1 mb-4">
                    {msg.parsedRFQ.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 text-xs">
                        <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center font-medium">{j + 1}</span>
                        <span className="text-slate-700 dark:text-slate-300">{item.productName}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{item.quantity} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => createRFQ(msg.parsedRFQ!)}
                    disabled={isCreating}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    {isCreating ? 'Membuat RFQ...' : 'Konfirmasi & Buat RFQ'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-[10px] font-bold">AI</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending RFQ banner if no message card shown yet */}
        {pendingRFQ && !messages.some((m) => m.parsedRFQ) && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">RFQ siap dibuat: {pendingRFQ.title}</p>
            <button
              onClick={() => createRFQ(pendingRFQ)}
              disabled={isCreating}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {isCreating ? 'Membuat...' : 'Buat RFQ Ini'}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800 rounded-2xl px-4 py-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ceritakan kebutuhan barang Anda... (Enter untuk kirim)"
              rows={1}
              disabled={isLoading}
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 resize-none outline-none leading-relaxed py-1 disabled:opacity-50 max-h-[120px]"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed mb-0.5"
            >
              <svg className="w-4 h-4 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-2">
            Shift+Enter untuk baris baru · AI akan otomatis mendeteksi dan membuat struktur RFQ
          </p>
        </div>
      </div>
    </div>
  )
}
