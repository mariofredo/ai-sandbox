import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { collectApiAndForms } from '@/lib/collectApiAndForms'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url?.startsWith('http')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const data = await collectApiAndForms(url)
    const report = await analyzeWithGemma(data)

    return NextResponse.json(report)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function analyzeWithGemma(data: any) {
  const prompt = `You are a senior QA engineer doing a full API and form audit.

URL: ${data.url}

=== API CALLS INTERCEPTED ===
${JSON.stringify(data.networkCalls.map((c: any) => ({
  method: c.method,
  url: c.url,
  status: c.status,
  isError: c.isError,
  duration: c.duration + 'ms',
  requestBody: c.requestBody,
  responseBody: c.responseBody.slice(0, 500),
})), null, 2)}

=== FORM INTERACTION RESULTS ===
${JSON.stringify(data.formResults.map((f: any) => ({
  formIndex: f.formIndex,
  action: f.action,
  method: f.method,
  fieldsFilledCount: f.fields.length,
  fields: f.fields,
  submissionStatus: f.submissionStatus,
  apiCallTriggered: f.apiCallTriggered ? {
    url: f.apiCallTriggered.url,
    status: f.apiCallTriggered.status,
    isError: f.apiCallTriggered.isError,
    responseBody: f.apiCallTriggered.responseBody.slice(0, 400),
  } : null,
  errorMessagesOnScreen: f.errorMessages,
  consoleErrorsAfterSubmit: f.consoleErrorsAfter,
})), null, 2)}

=== CONSOLE ERRORS (page load) ===
${data.consoleErrors.join('\n') || 'None'}

Analyze all of the above and return ONLY valid JSON:
{
  "score": <0-100>,
  "summary": "<2-3 sentence summary of overall health>",
  "apiIssues": [
    {
      "severity": "critical|warning|info",
      "endpoint": "<url>",
      "method": "<GET|POST|...>",
      "status": <http status code>,
      "title": "<short issue title>",
      "detail": "<what went wrong and how to fix it>",
      "responseSnippet": "<relevant part of response body>"
    }
  ],
  "formIssues": [
    {
      "severity": "critical|warning|info",
      "formIndex": <number>,
      "title": "<short issue title>",
      "detail": "<what went wrong and how to fix it>",
      "submissionStatus": "<status>",
      "errorMessages": ["<messages shown on screen>"],
      "suggestedFix": "<specific code or config fix>"
    }
  ],
  "generalIssues": [
    {
      "severity": "critical|warning|info",
      "title": "<title>",
      "detail": "<detail>"
    }
  ]
}`

  const model = genAI.getGenerativeModel({ model: 'gemma-3-27b-it' })
  const result = await model.generateContent(prompt)
  const raw = result.response.text().replace(/```json|```/g, '').trim()
  return JSON.parse(raw)
}