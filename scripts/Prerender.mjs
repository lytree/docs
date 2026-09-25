/**
 * SSG prerender — snapshot every route into static HTML after `vite build`.
 *
 * Usage: pnpm build && pnpm prerender
 *
 * Reads dist/routes.json (emitted by the fumadocsSource plugin), serves dist/
 * with vite preview, renders each route in headless Edge and writes
 * dist/<path>/index.html. The SPA still hydrates on load — crawlers and users
 * get full first-paint content without JavaScript.
 */
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import { chromium } from 'playwright-core'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const distDir = join(root, 'dist')
const port = 4173

async function main() {
  const routesFile = join(distDir, 'routes.json')
  if (!readFileSyncSafe(routesFile)) {
    console.error('dist/routes.json not found — run `pnpm build` first')
    process.exit(1)
  }
  const routes = JSON.parse(readFileSync(routesFile, 'utf8'))

  const server = await preview({
    root,
    preview: { port, strictPort: true },
  })
  const previewUrl = server.resolvedUrls.local[0].replace(/\/$/, '')
  console.log(`[prerender] preview server at ${previewUrl}`)

  const browser = await chromium.launch({ channel: 'msedge', headless: true })
  const page = await browser.newPage()

  let ok = 0
  const failed = []
  for (const route of routes) {
    try {
      await page.goto(`${previewUrl}${route}`, { waitUntil: 'networkidle', timeout: 30000 })
      // let async MDX chunks settle
      await page.waitForTimeout(250)
      const html = await page.content()
      const file =
        route === '/' ? join(distDir, 'index.html') : join(distDir, route, 'index.html')
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, html)
      ok++
      console.log(`[prerender] ${route} -> ${file.replace(root + '/', '')}`)
    } catch (e) {
      failed.push({ route, error: e.message })
      console.error(`[prerender] FAILED ${route}: ${e.message}`)
    }
  }

  await browser.close()
  await new Promise((resolve) => server.httpServer.close(resolve))

  console.log(`[prerender] done: ${ok}/${routes.length} pages`)
  if (failed.length) process.exit(2)
}

function readFileSyncSafe(p) {
  try {
    return readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

main()
