'use client'

// src/components/ChatInterface.tsx
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Message } from '@/lib/types'
import { ChatMessage, TypingIndicator } from './ChatMessage'

// Suggested quick prompts to help users get started
const QUICK_PROMPTS = [
  'Saya butuh 10 laptop untuk tim developer',
  'Rekomendasikan supplier alat tulis kantor',
  'Butuh peralatan jaringan untuk kantor baru',
  'Cari supplier furnitur untuk ruang meeting',
]

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: 'assistant',
      content:
        'Halo! Saya adalah **AI Procurement Assistant** 👋\n\nSaya siap membantu Anda menemukan supplier dan produk terbaik sesuai kebutuhan pengadaan. Ceritakan barang apa yang Anda butuhkan — jumlah, spesifikasi, atau anggaran jika ada — dan saya akan merekomendasikan supplier terbaik dari database kami!\n\nAtau pilih salah satu pertanyaan cepat di bawah untuk mulai.',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    }

    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setError(null)

    try {
      // Only send role + content to the API (not id/timestamp)
      const apiMessages = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendapatkan respons dari AI')
      }

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      {/* Chat header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h1 className="font-semibold text-slate-900 dark:text-white text-sm">
              Procurement AI Assistant
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-xs text-slate-500">Powered by Gemma · Gemini API</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}

        {/* Loading indicator */}
        {isLoading && <TypingIndicator />}

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-400">⚠️ {error}</p>
            <p className="text-xs text-red-500 dark:text-red-500 mt-1">
              Pastikan GEMINI_API_KEY sudah diset di file .env.local
            </p>
          </div>
        )}

        {/* Quick prompts — shown only at the beginning */}
        {messages.length === 1 && !isLoading && (
          <div className="mb-4">
            <p className="text-xs text-slate-400 mb-2 text-center">Coba tanyakan:</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-600 dark:text-slate-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
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
            className="flex-shrink-0 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 rounded-full flex items-center justify-center transition-colors disabled:cursor-not-allowed mb-0.5"
          >
            <svg
              className="w-4 h-4 text-white rotate-90"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          Shift+Enter untuk baris baru · AI menggunakan data supplier lokal
        </p>
      </div>
    </div>
  )
}
