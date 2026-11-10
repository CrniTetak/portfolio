// Prelaz sa ekrana na ekran za čitače ekrana i tastaturu: naslov dokumenta = naslov ekrana, fokus na h1 (osim kad prelaz izaziva traka priče),
// i visina donje trake (računar, tablet, telefon) kao promenljiva --donji-visina, da sadržaj i fokusiran element ne završe ispod trake.
import { useEffect } from 'react'
import { useDemo } from '../demo/DemoProvider'
import { RUTA_PO_ID } from '../pravila/rute'
import { BROJ_KORAKA } from '../prica/koraci'
import { opisKartice } from '../tekstovi/kartice'
import { nazivKoraka } from './prica'
import { useEkran } from './kontekst'

const SUFIKS = ' — SWAPIT demo'
const TRAKA = '[data-traka-price], [data-traka-telefon], [data-panel-price]'
let prethodniEkran: string | null = null
let poslednjaIzTrake = -10000
/** Ekran se učitava lenjo: ako h1 još ne postoji pri prelazu, fokus se postavlja čim se pojavi (vidi posmatrača niže). */
let cekaFokus = false
const fokusirajNaslov = (h1: HTMLElement) => {
  h1.setAttribute('tabindex', '-1')
  h1.focus({ preventScroll: true })
}

if (typeof document !== 'undefined') {
  // pamti da li je poslednja interakcija bila u traci priče / panelu (tada prelaz ekrana ne krade fokus)
  const zabelezi = (e: Event) => {
    if ((e.target as Element | null)?.closest?.(TRAKA)) poslednjaIzTrake = performance.now()
  }
  document.addEventListener('pointerdown', zabelezi, true)
  document.addEventListener('keydown', (e) => (e.key === 'Enter' || e.key === ' ') && zabelezi(e), true)
}

/** Naslov dokumenta iz h1 ekrana (ili iz registra ruta). */
function postaviNaslov(id: string) {
  const naslov = document.querySelector('main h1')?.textContent?.trim() || RUTA_PO_ID[id]?.naslov || id
  document.title = naslov.includes('SWAPIT') ? naslov : naslov + SUFIKS
}

let prethodniKljuc: string | null = null

if (typeof document !== 'undefined') {
  // P-V4: neaktivna dugmad su aria-disabled (ostaju u fokusu, razlog se čita), pa klik na njih ne sme ništa da pokrene
  document.addEventListener(
    'click',
    (e) => {
      const dugme = (e.target as Element | null)?.closest?.('[aria-disabled="true"]')
      if (dugme && dugme.tagName !== 'A') {
        e.preventDefault()
        e.stopImmediatePropagation()
      }
    },
    true,
  )
}

/** P-V3: kad radnja ukloni dugme koje je imalo fokus (npr. „Pošalji“ → poruka o uspehu), fokus ide na poruku o uspehu ili na h1, a ne u prazno. */
let poslednjiFokusUMain: Element | null = null
if (typeof document !== 'undefined') {
  document.addEventListener('focusin', (e) => {
    const cilj = e.target as Element | null
    poslednjiFokusUMain = cilj?.closest?.('main') ? cilj : null
  })
}
function spasiFokus(main: Element) {
  const izgubljen = poslednjiFokusUMain
  if (!izgubljen || izgubljen.isConnected) return
  poslednjiFokusUMain = null
  const aktivan = document.activeElement
  if (aktivan && aktivan !== document.body) return
  const cilj = main.querySelector<HTMLElement>('[data-obavestenje="uspeh"], [data-odluka-poslata], [data-prijava-poslata], [data-problem-poslat], [data-obradjeno], [role="status"]:not(.sr-only)') ?? main.querySelector<HTMLElement>('h1')
  if (!cilj) return
  cilj.setAttribute('tabindex', '-1')
  cilj.focus({ preventScroll: true })
}

/** P-S8: tabele koje se na telefonu pretvaraju u kartice (display: block) zadržavaju ARIA uloge, pa ostaju tabele za čitač ekrana. */
function ariaTabele() {
  for (const t of document.querySelectorAll<HTMLTableElement>('main table.tabela-kartice:not([role])')) {
    t.setAttribute('role', 'table')
    t.querySelectorAll('thead, tbody, tfoot').forEach((e) => e.setAttribute('role', 'rowgroup'))
    t.querySelectorAll('tr').forEach((e) => e.setAttribute('role', 'row'))
    t.querySelectorAll('th').forEach((e) => e.setAttribute('role', e.getAttribute('scope') === 'row' ? 'rowheader' : 'columnheader'))
    t.querySelectorAll('td').forEach((e) => e.setAttribute('role', 'cell'))
  }
}

let razlogBrojac = 0
/** P-V4: razlog uz neaktivno dugme (susedni .razlog-neaktivno) se povezuje sa dugmetom preko aria-describedby. */
function poveziRazloge() {
  for (const dugme of document.querySelectorAll<HTMLElement>('main button[aria-disabled="true"]:not([aria-describedby])')) {
    const razlog = dugme.parentElement?.querySelector<HTMLElement>('.razlog-neaktivno')
    if (!razlog) continue
    if (!razlog.id) razlog.id = `razlog-${++razlogBrojac}`
    dugme.setAttribute('aria-describedby', razlog.id)
  }
}

/** P-V1: stalna nevidljiva regija (role=status) u Okviru; posle navigacije iz trake upisuje se kratka najava, a fokus se ne pomera. */
export const ID_NAJAVE_PRICE = 'najava-prica'
let najavaTimer: ReturnType<typeof setTimeout> | undefined
function najavi(tekst: string) {
  const regija = document.getElementById(ID_NAJAVE_PRICE)
  if (!regija) return
  regija.textContent = ''
  clearTimeout(najavaTimer)
  najavaTimer = setTimeout(() => (regija.textContent = tekst), 60)
}

export function PrelazEkrana() {
  const { id, ugao, parametri } = useEkran()
  const demo = useDemo()

  // novi ekran (ili isti ekran za drugu stvar: drugi oglas, druga razmena) se otvara od vrha strane
  const kljuc = id + JSON.stringify(parametri)
  useEffect(() => {
    if (prethodniKljuc !== null && prethodniKljuc !== kljuc) window.scrollTo(0, 0)
    prethodniKljuc = kljuc
  }, [kljuc])

  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>('main h1')
    postaviNaslov(id)
    const promenjen = prethodniEkran !== null && prethodniEkran !== id
    prethodniEkran = id
    cekaFokus = false
    if (!promenjen) return
    if (performance.now() - poslednjaIzTrake < 1500) return
    if (h1) fokusirajNaslov(h1)
    else cekaFokus = true
  }, [id])

  // P-V1: posle Dalje / Nazad / kruga koraka / „Pokaži mi“ / promene ugla čitač ekrana dobija: korak, ekran i opis (fokus ostaje u traci)
  useEffect(() => {
    if (performance.now() - poslednjaIzTrake > 2500) return
    const t = setTimeout(() => {
      const h1 = document.querySelector('main h1')?.textContent?.trim() ?? RUTA_PO_ID[id]?.naslov ?? id
      najavi(`Korak ${demo.poz.korak} od ${BROJ_KORAKA}: ${nazivKoraka(demo.poz.korak)}. Ekran: ${h1}. ${opisKartice(demo.poz, ugao)}`)
    }, 200)
    return () => clearTimeout(t)
  }, [id, ugao, kljuc, demo.poz.korak, demo.poz.n, demo.poz.grana]) // eslint-disable-line react-hooks/exhaustive-deps

  // naslov se osvežava i kad se h1 promeni u istoj ruti (npr. ekran menja stanje)
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const posmatrac = new MutationObserver(() => {
      postaviNaslov(id)
      poveziRazloge()
      ariaTabele()
      spasiFokus(main)
      const h1 = document.querySelector<HTMLElement>('main h1')
      if (cekaFokus && h1) {
        cekaFokus = false
        fokusirajNaslov(h1)
      }
    })
    posmatrac.observe(main, { childList: true, subtree: true, characterData: true })
    poveziRazloge()
    ariaTabele()
    return () => posmatrac.disconnect()
  }, [id])

  // visina donje trake + malo vazduha
  useEffect(() => {
    const postavi = () => {
      const traka = document.querySelector<HTMLElement>('[data-donji]')
      const visina = traka ? traka.getBoundingClientRect().height : 0
      document.documentElement.style.setProperty('--donji-visina', `${Math.ceil(visina)}px`)
      document.documentElement.style.scrollPaddingBottom = visina ? `${Math.ceil(visina) + 16}px` : ''
    }
    let r = requestAnimationFrame(postavi)
    // traka se pojavljuje i nestaje (telefon, dijalozi): prati se iscrtavanje, ali se računa najviše jednom po kadru
    const koren = document.getElementById('root')
    const posmatrac = new MutationObserver(() => {
      cancelAnimationFrame(r)
      r = requestAnimationFrame(postavi)
    })
    if (koren) posmatrac.observe(koren, { childList: true, subtree: true })
    window.addEventListener('resize', postavi)
    return () => {
      cancelAnimationFrame(r)
      posmatrac.disconnect()
      window.removeEventListener('resize', postavi)
    }
  }, [id, demo.rezim, demo.poz.korak, demo.poz.n, demo.poz.grana, demo.panelOtvoren])
  return null
}
