// Prelaz sa ekrana na ekran za čitače ekrana i tastaturu: naslov dokumenta = naslov ekrana, fokus na h1 (osim kad prelaz izaziva traka priče),
// i scroll-padding-bottom po visini donje trake, da fokusiran element ne završi ispod trake.
import { useEffect } from 'react'
import { useDemo } from '../demo/DemoProvider'
import { RUTA_PO_ID } from '../pravila/rute'
import { useEkran } from './kontekst'
import { useMedia } from './useMedia'

const SUFIKS = ' — AllAddIn1 demo'
const TRAKA = '[data-traka-price], [data-traka-telefon], [data-panel-price]'
let prethodniEkran: string | null = null
let poslednjaIzTrake = -10000

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
  document.title = naslov.includes('AllAddIn1') ? naslov : naslov + SUFIKS
}

export function PrelazEkrana() {
  const { id } = useEkran()
  const demo = useDemo()
  const tablet = useMedia('(max-width: 1023px)')

  useEffect(() => {
    const h1 = document.querySelector<HTMLElement>('main h1')
    postaviNaslov(id)
    const promenjen = prethodniEkran !== null && prethodniEkran !== id
    prethodniEkran = id
    if (!promenjen || !h1) return
    if (performance.now() - poslednjaIzTrake < 1500) return
    h1.setAttribute('tabindex', '-1')
    h1.focus({ preventScroll: true })
  }, [id])

  // naslov se osvežava i kad se h1 promeni u istoj ruti (npr. ekran menja stanje: "Request received" → "Your quote")
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    const posmatrac = new MutationObserver(() => postaviNaslov(id))
    posmatrac.observe(main, { childList: true, subtree: true, characterData: true })
    return () => posmatrac.disconnect()
  }, [id])

  // visina donje trake (računar, tablet dvoredna, telefon) + malo vazduha
  useEffect(() => {
    const postavi = () => {
      const traka = document.querySelector<HTMLElement>('[data-donji]')
      const visina = traka ? traka.getBoundingClientRect().height : 0
      document.documentElement.style.scrollPaddingBottom = visina ? `${Math.ceil(visina) + 16}px` : ''
    }
    let r = requestAnimationFrame(postavi)
    // traka se pojavljuje i nestaje (telefon, dijalozi): prati se iscrtavanje, ali se računa najviše jednom po kadru
    const korenEl = document.getElementById('root')
    const posmatrac = new MutationObserver(() => {
      cancelAnimationFrame(r)
      r = requestAnimationFrame(postavi)
    })
    if (korenEl) posmatrac.observe(korenEl, { childList: true, subtree: true })
    window.addEventListener('resize', postavi)
    return () => {
      cancelAnimationFrame(r)
      posmatrac.disconnect()
      window.removeEventListener('resize', postavi)
    }
  }, [id, demo.rezim, demo.poz.korak, demo.poz.n, demo.poz.ishod, demo.panelOtvoren, tablet])
  return null
}
