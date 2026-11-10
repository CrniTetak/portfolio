// Prozori i paneli: fokus ulazi u panel, Tab kruži unutar njega, Esc zatvara, fokus se vraća na dugme koje ga je otvorilo.
// Slušalac je na dokumentu dok je panel aktivan, pa Escape i Tab rade i kad je fokus slučajno pao na telo stranice.
import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOKUSABILNO = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, aktivno: boolean, naZatvori: () => void) {
  useEffect(() => {
    if (!aktivno || !ref.current) return
    const el = ref.current
    const prethodni = document.activeElement as HTMLElement | null
    const lista = () => [...el.querySelectorAll<HTMLElement>(FOKUSABILNO)].filter((x) => x.getClientRects().length > 0)
    const prvi = el.querySelector<HTMLElement>('[data-prvi-fokus]') ?? lista()[0] ?? el
    prvi.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        naZatvori()
        return
      }
      if (e.key !== 'Tab') return
      const l = lista()
      if (!l.length) { e.preventDefault(); el.focus(); return }
      const prvi2 = l[0]
      const poslednji = l[l.length - 1]
      const unutra = el.contains(document.activeElement)
      if (!unutra) { e.preventDefault(); (e.shiftKey ? poslednji : prvi2).focus() }
      else if (e.shiftKey && document.activeElement === prvi2) { e.preventDefault(); poslednji.focus() }
      else if (!e.shiftKey && document.activeElement === poslednji) { e.preventDefault(); prvi2.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (prethodni && document.contains(prethodni)) prethodni.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktivno])
}
