// src/lib/markdown.ts
/**
 * Simple markdown-to-HTML converter for AI responses.
 * Handles bold, italic, bullet lists, and line breaks
 * without needing an external library.
 */
export function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Bold **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>')

  // Italic *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.*?)_/g, '<em>$1</em>')

  // Headers ## and ###
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-lg font-semibold mt-4 mb-2">$1</h2>')

  // Bullet points - handle  • and - prefixes
  html = html.replace(/^[•\-] (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
  html = html.replace(/^  [•\-] (.*$)/gim, '<li class="ml-8 list-disc text-sm">$1</li>')

  // Numbered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')

  // Line breaks - double newline = paragraph break
  html = html.replace(/\n\n/g, '</p><p class="mb-2">')

  // Single newlines → <br>
  html = html.replace(/\n/g, '<br/>')

  // Wrap in paragraph
  html = `<p class="mb-2">${html}</p>`

  return html
}
