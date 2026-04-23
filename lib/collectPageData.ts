import { chromium } from 'playwright'

export type PageData = {
  html: string
  url: string
  consoleErrors: string[]
  consoleWarnings: string[]
  failedRequests: { url: string; status: number }[]
  screenshot: string          // base64 PNG
  metrics: {
    domContentLoaded: number
    loadTime: number
    resourceCount: number
  }
  links: { href: string; text: string; broken?: boolean }[]
}

export async function collectPageData(url: string): Promise<PageData> {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  const consoleErrors: string[] = []
  const consoleWarnings: string[] = []
  const failedRequests: { url: string; status: number }[] = []

  // Capture console output
  page.on('console', msg => {
    if (msg.type() === 'error')   consoleErrors.push(msg.text())
    if (msg.type() === 'warning') consoleWarnings.push(msg.text())
  })

  // Capture failed network requests
  page.on('response', res => {
    if (res.status() >= 400) {
      failedRequests.push({ url: res.url(), status: res.status() })
    }
  })

  const startTime = Date.now()
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
  const loadTime = Date.now() - startTime

  // Grab DOM, screenshot, metrics, links all at once
  const [html, screenshotBuffer, resourceCount, links] = await Promise.all([
    page.content(),
    page.screenshot({ type: 'png', fullPage: false }),
    page.evaluate(() => performance.getEntriesByType('resource').length),
    page.evaluate(() =>
      [...document.querySelectorAll('a[href]')].slice(0, 60).map(a => ({
        href: (a as HTMLAnchorElement).href,
        text: a.textContent?.trim().slice(0, 60) || '',
      }))
    ),
  ])

  const domContentLoaded = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return Math.round(nav?.domContentLoadedEventEnd ?? 0)
  })

  await browser.close()

  return {
    html,
    url,
    consoleErrors,
    consoleWarnings,
    failedRequests,
    screenshot: screenshotBuffer.toString('base64'),
    metrics: { domContentLoaded, loadTime, resourceCount },
    links,
  }
}