// one-shot interactive verification of all new fumadocs-parity features
import { chromium } from 'playwright-core'

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const results = []
const ok = (name, pass, detail = '') =>
  results.push(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ' | ' + detail : ''}`)

await page.goto('http://localhost:5173/docs/other/mdx-components', {
  waitUntil: 'networkidle',
  timeout: 60000,
})
await page.waitForTimeout(1500)

// 1. Tabs — click tab, expect ?tab= in URL and panel switch
const tabs = page.locator('div[class*="tabsBar"] button[role="tab"]')
ok('Tabs 渲染 3 个选项卡', (await tabs.count()) === 3, `count=${await tabs.count()}`)
await tabs.nth(2).click()
await page.waitForTimeout(300)
const url = page.url()
ok('Tabs 切换持久化 ?tab=', url.includes('tab='), url.slice(url.indexOf('?')))
ok('Tabs 面板内容切换', (await page.locator('div[class*="tabsPanel"]').innerText()).includes('demo.mdx'))

// 2. Accordion — single + multiple ($= excludes accordionItem/accordionBody/…)
const accordions = page.locator('div[class$="_accordion"]')
ok('Accordion 两组渲染', (await accordions.count()) === 2)
const firstAcc = accordions.nth(0).locator('button[class*="accordionHead"]')
await firstAcc.nth(0).click()
await page.waitForTimeout(200)
const expanded0 = await accordions.nth(0).locator('div[class*="accordionItemOpen"]').count()
const expanded1 = await accordions.nth(1).locator('div[class*="accordionItemOpen"]').count()
await firstAcc.nth(1).click()
await page.waitForTimeout(200)
const expanded0b = await accordions.nth(0).locator('div[class*="accordionItemOpen"]').count()
ok('Accordion single 单开', expanded0 === 1 && expanded0b === 1, `first=${expanded0}->${expanded0b}`)
const multiAcc = accordions.nth(1).locator('button[class*="accordionHead"]')
const preOpen = await accordions.nth(1).locator('div[class*="accordionItemOpen"]').count()
await multiAcc.nth(1).click()
await page.waitForTimeout(200)
const nowOpen = await accordions.nth(1).locator('div[class*="accordionItemOpen"]').count()
ok('Accordion multiple 可多开 + defaultOpen', preOpen === 1 && nowOpen === 2, `${preOpen}->${nowOpen}`)
ok('Accordion id 锚点存在', (await page.locator('#what-is-fumadocs').count()) === 1)

// 3. Files tree — toggle folder
const folderRow = page.locator('button[class*="treeFolder"]').first()
await folderRow.click()
await page.waitForTimeout(200)
const treeText = await page.locator('div[class*="tree"]').first().innerText()
ok('Files 目录树渲染与折叠', treeText.includes('src') && treeText.includes('vite.config.ts'))

// 4. TypeTable
const typeRows = await page.locator('div[class*="typeTableWrap"] table tr').count()
ok('TypeTable 渲染', typeRows >= 3, `rows=${typeRows}`)

// 5. InlineToc
const inlineLinks = await page.locator('div[class*="inlineToc"] a').count()
ok('InlineToc 章节链接', inlineLinks >= 10, `links=${inlineLinks}`)

// 6. Codeblock — header + copy button
const cbHeader = await page.locator('span[class*="codeblockTitle"]').allInnerTexts()
ok('代码块标题栏', cbHeader.some((t) => t.includes('example.ts')) && cbHeader.some((t) => t.includes('changelog.diff')), cbHeader.join(','))
ok('代码块复制按钮', (await page.locator('button[class*="codeblockCopy"]').count()) >= 2)
const hl = await page.locator('div[class*="codeblock"]').first().locator('span[class*="highlighted"]').count()
ok('行高亮标记生效', hl > 0, `highlighted-spans=${hl}`)

// 7. Image zoom
await page.locator('img[class*="zoomImg"]').click()
await page.waitForTimeout(400)
ok('图片点击放大 overlay', (await page.locator('div[class*="zoomOverlay"]:not([class*="zoomOverlayImg"])').count()) === 1)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
ok('Esc 关闭放大', (await page.locator('div[class*="zoomOverlay"]:not([class*="zoomOverlayImg"])').count()) === 0)

// 8. Dark mode — code token colors change
const lightColor = await page.evaluate(() => {
  const el = document.querySelector('div[class*="codeblock"] .shiki span')
  return el ? getComputedStyle(el).color : 'none'
})
await page.evaluate(() => document.documentElement.classList.add('dark'))
await page.waitForTimeout(300)
const darkColor = await page.evaluate(() => {
  const el = document.querySelector('div[class*="codeblock"] .shiki span')
  return el ? getComputedStyle(el).color : 'none'
})
ok('Shiki 双主题切换', lightColor !== 'none' && darkColor !== 'none' && lightColor !== darkColor, `light=${lightColor} dark=${darkColor}`)
await page.evaluate(() => document.documentElement.classList.remove('dark'))

// 9. Search — tag chip filter
await page.keyboard.press('Control+k')
await page.waitForTimeout(400)
const input = page.locator('input[class*="input"]')
await input.fill('其他: 组件')
await page.waitForTimeout(400)
const chip = await page.locator('button[class*="tagChip"]').count()
const hits = await page.locator('button[class*="hit"]').count()
ok('搜索 tag 过滤 chip + 结果', chip === 1 && hits >= 1, `chip=${chip} hits=${hits}`)
await page.keyboard.press('Escape')

// 10. TOC back-to-top (desktop column is the last instance — popover's is hidden)
const b2t = await page.locator('a[class*="backToTop"]').count()
ok('TOC 回到顶部链接', b2t >= 1, `count=${b2t}`)
await page.evaluate(() => window.scrollTo(0, 3000))
await page.locator('a[class*="backToTop"]').last().click()
await page.waitForTimeout(800)
const scrollY = await page.evaluate(() => window.scrollY)
ok('回到顶部平滑滚动', scrollY < 50, `scrollY=${scrollY}`)

// 11. Banner on home
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
ok('首页 Banner', (await page.locator('div[class*="banner"]').count()) === 1)

ok('无运行时错误', errors.length === 0, errors.slice(0, 3).join(' || '))

console.log(results.join('\n'))
await browser.close()
