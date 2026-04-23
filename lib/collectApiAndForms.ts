import { chromium, Page } from 'playwright'

export type NetworkCall = {
  url: string
  method: string
  status: number
  requestBody: string
  responseBody: string
  duration: number
  isError: boolean
}

export type FormResult = {
  formIndex: number
  action: string
  method: string
  fields: { name: string; type: string; value: string }[]
  submissionStatus: 'success' | 'error' | 'no_response' | 'validation_blocked'
  apiCallTriggered: NetworkCall | null
  responseBody: string
  errorMessages: string[]       // validation errors shown on screen after submit
  consoleErrorsAfter: string[]  // JS errors that fired after submit
}

export type CollectedData = {
  url: string
  networkCalls: NetworkCall[]
  formResults: FormResult[]
  consoleErrors: string[]
  consoleWarnings: string[]
  pageHtml: string
}

// Smart test values per input type
function testValueFor(type: string, name: string): string {
  const n = name.toLowerCase()
  if (type === 'email' || n.includes('email'))       return 'test@example.com'
  if (type === 'password' || n.includes('password')) return 'TestPassword123!'
  if (type === 'tel' || n.includes('phone'))         return '+1234567890'
  if (type === 'url' || n.includes('url'))           return 'https://example.com'
  if (type === 'number' || n.includes('age'))        return '25'
  if (type === 'date')                               return '2025-01-15'
  if (n.includes('name') || n.includes('first'))    return 'John'
  if (n.includes('last') || n.includes('surname'))  return 'Doe'
  if (n.includes('message') || n.includes('comment') || type === 'textarea') return 'This is a test message.'
  if (n.includes('address'))                         return '123 Test Street'
  if (n.includes('city'))                            return 'Sydney'
  if (n.includes('zip') || n.includes('postal'))    return '2000'
  if (n.includes('company') || n.includes('org'))   return 'Test Company'
  if (n.includes('subject'))                         return 'Test Subject'
  return 'test'
}

export async function collectApiAndForms(url: string): Promise<CollectedData> {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  const networkCalls: NetworkCall[] = []
  const consoleErrors: string[] = []
  const consoleWarnings: string[] = []

  // Intercept ALL network requests
  const pendingRequests = new Map<string, { startTime: number; body: string }>()

  await page.route('**/*', async (route) => {
    const req = route.request()
    const id = `${req.method()}-${req.url()}-${Date.now()}`
    try {
      const postData = req.postData() || ''
      pendingRequests.set(req.url(), { startTime: Date.now(), body: postData })
      await route.continue()
    } catch {
      await route.continue()
    }
  })

  page.on('response', async (response) => {
    const req = response.request()
    const reqUrl = req.url()
    const pending = pendingRequests.get(reqUrl)
    const duration = pending ? Date.now() - pending.startTime : 0

    // Only capture API/XHR calls — skip images, fonts, CSS
    const resourceType = req.resourceType()
    if (!['xhr', 'fetch', 'document'].includes(resourceType)) return

    let responseBody = ''
    try {
      responseBody = await response.text()
      if (responseBody.length > 2000) responseBody = responseBody.slice(0, 2000) + '...[truncated]'
    } catch {}

    networkCalls.push({
      url: reqUrl,
      method: req.method(),
      status: response.status(),
      requestBody: pending?.body?.slice(0, 500) || '',
      responseBody,
      duration,
      isError: response.status() >= 400,
    })

    pendingRequests.delete(reqUrl)
  })

  page.on('console', msg => {
    if (msg.type() === 'error')   consoleErrors.push(msg.text())
    if (msg.type() === 'warning') consoleWarnings.push(msg.text())
  })

  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  const pageHtml = await page.content()

  // Find and interact with every form
  const formResults = await interactWithForms(page, networkCalls)

  await browser.close()

  return { url, networkCalls, formResults, consoleErrors, consoleWarnings, pageHtml }
}

async function interactWithForms(
  page: Page,
  networkCalls: NetworkCall[]
): Promise<FormResult[]> {
  const results: FormResult[] = []

  const formCount = await page.locator('form').count()

  for (let i = 0; i < Math.min(formCount, 5); i++) {
    const form = page.locator('form').nth(i)
    const consoleErrorsAfter: string[] = []

    // Listen for new console errors after submit
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrorsAfter.push(msg.text())
    })

    // Collect all fields in this form
    const fields: { name: string; type: string; value: string }[] = []

    // Fill text inputs
    const inputs = form.locator('input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=checkbox]):not([type=radio])')
    const inputCount = await inputs.count()
    for (let j = 0; j < inputCount; j++) {
      const input = inputs.nth(j)
      const type  = (await input.getAttribute('type'))  || 'text'
      const name  = (await input.getAttribute('name'))  || (await input.getAttribute('id')) || `field_${j}`
      const value = testValueFor(type, name)
      try {
        await input.fill(value)
        fields.push({ name, type, value })
      } catch {}
    }

    // Fill textareas
    const textareas = form.locator('textarea')
    const textareaCount = await textareas.count()
    for (let j = 0; j < textareaCount; j++) {
      const ta   = textareas.nth(j)
      const name = (await ta.getAttribute('name')) || `textarea_${j}`
      const value = testValueFor('textarea', name)
      try {
        await ta.fill(value)
        fields.push({ name, type: 'textarea', value })
      } catch {}
    }

    // Select first option in dropdowns
    const selects = form.locator('select')
    const selectCount = await selects.count()
    for (let j = 0; j < selectCount; j++) {
      const sel  = selects.nth(j)
      const name = (await sel.getAttribute('name')) || `select_${j}`
      try {
        await sel.selectOption({ index: 1 })
        fields.push({ name, type: 'select', value: 'option[1]' })
      } catch {}
    }

    // Get form meta
    const action = (await form.getAttribute('action')) || page.url()
    const method = (await form.getAttribute('method')) || 'GET'

    // Snapshot network calls before submit
    const callsBefore = networkCalls.length

    // Try to find and click submit button
    let submissionStatus: FormResult['submissionStatus'] = 'no_response'
    let responseBody = ''

    try {
      const submitBtn = form.locator('[type=submit], button:not([type=button])').first()
      const hasSubmit = await submitBtn.count() > 0

      if (hasSubmit) {
        await Promise.race([
          Promise.all([
            submitBtn.click(),
            page.waitForResponse(() => true, { timeout: 5000 }).catch(() => null),
          ]),
          new Promise(r => setTimeout(r, 6000)),
        ])
      }

      // Check for validation error messages shown on screen
      const errorMessages = await page.evaluate(() => {
        const errorEls = document.querySelectorAll(
          '[class*=error], [class*=invalid], [aria-invalid=true], .form-error, .field-error, [role=alert]'
        )
        return [...errorEls].map(el => el.textContent?.trim()).filter(Boolean) as string[]
      })

      // Did new network calls fire after submit?
      const newCalls = networkCalls.slice(callsBefore)
      const apiCall = newCalls.find(c =>
        ['POST', 'PUT', 'PATCH'].includes(c.method) || c.isError
      ) || newCalls[0] || null

      if (apiCall) {
        responseBody = apiCall.responseBody
        submissionStatus = apiCall.isError ? 'error' : 'success'
      } else if (errorMessages.length > 0) {
        submissionStatus = 'validation_blocked'
      }

      results.push({
        formIndex: i,
        action,
        method,
        fields,
        submissionStatus,
        apiCallTriggered: apiCall,
        responseBody,
        errorMessages,
        consoleErrorsAfter,
      })

    } catch (err: any) {
      results.push({
        formIndex: i, action, method, fields,
        submissionStatus: 'error',
        apiCallTriggered: null,
        responseBody: '',
        errorMessages: [err.message],
        consoleErrorsAfter,
      })
    }
  }

  return results
}