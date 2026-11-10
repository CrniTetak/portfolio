// Mali pomoćnik za prozore/panele: fokus ulazi u panel, Tab kruži unutar njega, Esc zatvara, fokus se vraća na dugme koje ga je otvorilo.
import { useEffect } from 'react'
import type { RefObject } from 'react'

const FOKUSABILNO = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, aktivno: boolean, naZatvori: () => void) {
  useEffect(() => {
    if (!aktivno || !ref.current) return
    const el = ref.current
    const prethodni = document.activeElement as HTMLElement | null
    const prvi = el.querySelector<HTMLElement>('[data-prvi-fokus]') ?? el.querySelector<HTMLElement>(FOKUSABILNO)
    prvi?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        naZatvori()
        return
      }
      if (e.key !== 'Tab') return
      const lista = [...el.querySelectorAll<HTMLElement>(FOKUSABILNO)].filter((x) => x.getClientRects().length > 0)
      if (!lista.length) return
      const prvi2 = lista[0]
      const poslednji = lista[lista.length - 1]
      if (e.shiftKey && document.activeElement === prvi2) {
        e.preventDefault()
        poslednji.focus()
      } else if (!e.shiftKey && document.activeElement === poslednji) {
        e.preventDefault()
        prvi2.focus()
      }
    }
    el.addEventListener('keydown', onKey)
    return () => {
      el.removeEventListener('keydown', onKey)
      prethodni?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktivno])
}
