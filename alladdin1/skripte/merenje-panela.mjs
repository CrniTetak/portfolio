// Merenje panela priče (traka na računaru, spojena traka i panel odozdo na telefonu) u GoalToCart-u, Nasetu i AllAddIn1,
// getBoundingClientRect + getComputedStyle, pa tabela poređenja (razlika 0 za sve mere; boje i familija fonta se NE porede).
// Skripta je u skripte/ (ne ulazi u build) i samo ČITA tuđe projekte (build GoalToCart-a ide u _snimci/_gtc-dist).
// Pokretanje:  node skripte/merenje-panela.mjs [--json] [--ourOnly]
//   GTC  = http://localhost:4194/ (vite preview --outDir _snimci/_gtc-dist, iz alladdin1/demo)
//   NAS  = http://localhost:4193/ (vite preview iz nasetu/)      OUR = http://localhost:4195/ (npm run preview -- --port 4195)
import { sleep, otvori } from './_zajednicko.mjs'

const SAJTOVI = {
  GTC: { url: process.env.GTC ?? 'http://localhost:4194/', ulaz: 'Enter demo', pr: false },
  NAS: { url: process.env.NAS ?? 'http://localhost:4193/', ulaz: 'Uđi u demo', pr: true },
  OUR: { url: process.env.OUR ?? 'http://localhost:4195/', ulaz: 'Enter demo', pr: true },
}
const P = (n, g) => ({ n, g })
const RACUNAR = {
  bar: P('.pr-bar', '.demobar'),
  story: P('.pr-story', '.demobar .story'),
  barH: P('.pr-story .pr-bar-h', '.demobar .story .bar-h'),
  storyP: P('.pr-story p', '.demobar .story p'),
  showMe: P('.pr-story .pr-btn-light', '.demobar .story .btn-light'),
  ctl: P('.pr-ctl', '.demobar .ctl'),
  navBack: P('.pr-nav', '.dots .nav'),
  dot: P('.pr-d', '.dots .d'),
  dotNow: P('.pr-d.now', '.dots .d.now'),
  seg: P('.pr-ctl .pr-seg', '.demobar .seg'),
  segBtn: P('.pr-ctl .pr-seg button', '.demobar .seg button'),
  segBtnOn: P('.pr-ctl .pr-seg button[aria-pressed=true]', '.demobar .seg button[aria-pressed=true]'),
  grpLabel: P('.pr-grp > span', '.demobar .grp > span'),
  restart: P('.pr-push .pr-btn-line', '.demobar .push .btn-line'),
}
const TELEFON = {
  dock: P('.pr-dock', '.dock'),
  pill: P('.pr-pill', '.dock .pill'),
  pillPrev: P('.pr-pill button:first-child', '.dock .pill button:first-child'),
  pillMid: P('.pr-pill button.mid', '.dock .pill button.mid'),
  slot: P('.pr-slot', '.dock .slot'),
  slotBtn: P('.pr-slot .pr-btn, .pr-slot .pr-dockbtn', '.dock .slot .btn'),
}
const SHEET = {
  overlay: P('.pr-overlay', '.overlay'),
  scrim: P('.pr-scrim', '.scrim'),
  sheet: P('.pr-sheet', '.sheet'),
  grab: P('.pr-sheet .pr-grab', '.sheet .grab'),
  closeb: P('.pr-sheet .pr-closeb', '.sheet .closeb'),
  tag: P('.pr-sheet .pr-tag', '.sheet .tag'),
  barH: P('.pr-sheet .pr-bar-h', '.sheet .bar-h'),
  p: P('.pr-sheet > p', '.sheet > p'),
  lightBtn: P('.pr-sheet .pr-btn-light', '.sheet .btn-light'),
  lbl: P('.pr-sheet .pr-lbl', '.sheet .lbl'),
  seg: P('.pr-sheet .pr-seg', '.sheet .seg'),
  segBtn: P('.pr-sheet .pr-seg button', '.sheet .seg button'),
  ol: P('.pr-sheet ol', '.sheet ol'),
  olBtn: P('.pr-sheet ol button', '.sheet ol button'),
  olN: P('.pr-sheet ol button .n', '.sheet ol button .n'),
  row: P('.pr-sheet .pr-row', '.sheet .row'),
  restart: P('.pr-sheet .pr-row .pr-btn-line', '.sheet .row .btn-line'),
}
const MERE = ['w', 'h', 'pad', 'mar', 'bord', 'rad', 'fs', 'lh', 'fw', 'gap', 'sen', 'poz', 'z', 'ikona']

async function izmeri(page, mapa, pr) {
  return page.evaluate((mapa, pr) => {
    const rez = {}
    for (const [k, par] of Object.entries(mapa)) {
      const sel = pr ? par.n : par.g
      const el = [...document.querySelectorAll(sel)].find((e) => e.getClientRects().length > 0)
      if (!el) { rez[k] = null; continue }
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      const px = (v) => String(Math.round(parseFloat(v) * 100) / 100)
      const svg = el.querySelector('svg')
      const sr = svg?.getBoundingClientRect()
      rez[k] = {
        w: px(r.width), h: px(r.height),
        pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map(px).join(' '),
        mar: [cs.marginTop, cs.marginRight, cs.marginBottom, cs.marginLeft].map(px).join(' '),
        bord: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth].map(px).join(' '),
        rad: [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(px).join(' '),
        fs: px(cs.fontSize),
        lh: cs.lineHeight === 'normal' ? 'normal' : px(cs.lineHeight),
        fw: cs.fontWeight,
        gap: cs.display.includes('flex') || cs.display.includes('grid') ? `${px(cs.rowGap)}/${px(cs.columnGap)}` : '-',
        sen: cs.boxShadow === 'none' ? 'none' : cs.boxShadow.replace(/rgba?\([^)]*\)/g, 'C'),
        poz: `${cs.position} L${px(r.left)} R${px(innerWidth - r.right)} B${px(innerHeight - r.bottom)}`,
        z: cs.zIndex,
        ikona: sr ? `${px(sr.width)}x${px(sr.height)}` : '-',
      }
    }
    return rez
  }, mapa, pr)
}

async function uzmi(sajt, w, h) {
  const cfg = SAJTOVI[sajt]
  const { browser, page } = await otvori({ sirina: w, visina: h, telefon: w < 720 })
  await page.goto(cfg.url, { waitUntil: 'load' })
  await page.waitForSelector('button', { timeout: 8000 }).catch(() => {})
  await sleep(600)
  // naš demo: kvačica 18+ nije unapred štiklirana
  await page.evaluate(() => document.querySelector('input[type=checkbox]:not(:checked)')?.closest('label')?.click())
  await page.evaluate((t) => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === t)?.click(), cfg.ulaz)
  await sleep(900)
  const rez = {}
  if (w >= 720) {
    rez.racunar = await izmeri(page, RACUNAR, cfg.pr)
  } else {
    rez.telefon = await izmeri(page, TELEFON, cfg.pr)
    await page.evaluate((pr) => document.querySelector(pr ? '.pr-pill button.mid' : '.dock .pill button.mid')?.click(), cfg.pr)
    await sleep(500)
    rez.sheet = await izmeri(page, SHEET, cfg.pr)
  }
  await browser.close()
  return rez
}

const VELICINE = [[1280, 800], [390, 844], [360, 640]]
const sve = {}
for (const sajt of process.env.SAJTOVI ? process.env.SAJTOVI.split(',') : ['GTC', 'NAS', 'OUR']) {
  sve[sajt] = {}
  for (const [w, h] of VELICINE) sve[sajt][`${w}x${h}`] = await uzmi(sajt, w, h)
}
if (process.argv.includes('--json')) console.log(JSON.stringify(sve, null, 1))

// poređenje: svaka mera u svakoj tački, GTC | NAS | OUR
const nazivi = Object.keys(sve)
let razlike = 0
let ukupno = 0
const redovi = []
for (const vel of Object.keys(sve[nazivi[0]])) {
  for (const grupa of Object.keys(sve[nazivi[0]][vel])) {
    for (const el of Object.keys(sve[nazivi[0]][vel][grupa])) {
      for (const m of MERE) {
        const v = nazivi.map((s) => sve[s][vel][grupa]?.[el]?.[m] ?? '∅')
        // z-index overlay: GoalToCart 50, Nasetu 70 (preuzeto iz Nasetua); ne meri se kao razlika oblika
        ukupno++
        const iste = v.every((x) => x === v[0])
        if (!iste) { razlike++; redovi.push(`${vel} ${grupa}.${el} ${m}: ${nazivi.map((s, i) => `${s}=${v[i]}`).join(' | ')}`) }
      }
    }
  }
}
console.log(redovi.join('\n'))
console.log(`Poređeno mera: ${ukupno}, razlika: ${razlike} (${nazivi.join(' / ')})`)

// --md: kompaktna tabela strukturnih mera (bez mera koje zavise od teksta: širine, pozicije, visina teksta u više redova)
if (process.argv.includes('--md')) {
  const RED = [
    ['racunar', 'bar', ['bord', 'fs', 'lh', 'sen']], ['racunar', 'story', ['pad', 'bord', 'gap']], ['racunar', 'showMe', ['h', 'pad', 'rad', 'fs', 'fw', 'gap', 'ikona']],
    ['racunar', 'ctl', ['pad', 'gap']], ['racunar', 'navBack', ['h', 'pad', 'bord', 'rad', 'fs', 'fw', 'gap', 'ikona']], ['racunar', 'dot', ['w', 'h', 'bord', 'fs', 'fw']],
    ['racunar', 'seg', ['h', 'bord', 'rad']], ['racunar', 'segBtn', ['h', 'pad', 'fs', 'fw']], ['racunar', 'segBtnOn', ['fw']], ['racunar', 'grpLabel', ['fs']],
    ['racunar', 'restart', ['h', 'pad', 'rad', 'fs', 'fw', 'gap', 'ikona']],
    ['telefon', 'dock', ['h', 'pad', 'bord', 'gap', 'fs', 'lh', 'sen']], ['telefon', 'pill', ['h', 'bord', 'rad']], ['telefon', 'pillPrev', ['w', 'h', 'pad', 'ikona']],
    ['telefon', 'pillMid', ['w', 'h', 'pad', 'fs', 'fw']], ['telefon', 'slotBtn', ['h', 'pad', 'rad', 'fs', 'fw', 'lh', 'ikona']],
    ['sheet', 'sheet', ['pad', 'bord', 'rad', 'fs', 'lh', 'sen']], ['sheet', 'grab', ['w', 'h', 'rad', 'mar']], ['sheet', 'closeb', ['w', 'h', 'bord', 'rad', 'ikona']],
    ['sheet', 'tag', ['fs', 'lh']], ['sheet', 'barH', ['fs', 'fw', 'pad']], ['sheet', 'lightBtn', ['h', 'pad', 'rad', 'fs', 'fw', 'ikona']], ['sheet', 'lbl', ['fs', 'mar']],
    ['sheet', 'seg', ['bord', 'rad']], ['sheet', 'segBtn', ['h', 'pad', 'fs', 'fw']], ['sheet', 'ol', ['gap', 'mar']], ['sheet', 'olBtn', ['h', 'pad', 'rad', 'fs', 'fw', 'gap']],
    ['sheet', 'olN', ['w', 'h', 'bord', 'fs']], ['sheet', 'row', ['gap', 'mar']], ['sheet', 'restart', ['h', 'pad', 'rad', 'fs', 'fw', 'ikona']],
  ]
  console.log('\n| tačka | element | mera | ' + nazivi.join(' | ') + ' | razlika AllAddIn1 vs GoalToCart |\n|---|---|---|' + nazivi.map(() => '---').join('|') + '|---|')
  for (const vel of ['1280x800', '390x844']) {
    for (const [g, el, mere] of RED) {
      if ((g === 'racunar') !== (vel === '1280x800')) continue
      for (const m of mere) {
        const v = nazivi.map((s) => sve[s][vel][g]?.[el]?.[m] ?? '∅')
        const our = v[nazivi.indexOf('OUR')], gtc = v[nazivi.indexOf('GTC')]
        console.log(`| ${vel} | ${g}.${el} | ${m} | ${v.join(' | ')} | ${our === gtc ? '0' : 'RAZLIKA'} |`)
      }
    }
  }
}
