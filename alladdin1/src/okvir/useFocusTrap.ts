// Fokus ostaje unutar panela dok je otvoren; Esc ga zatvara; pri otvaranju fokus ide na prvi element; pozadina je inertna;
// posle zatvaranja fokus se vraća na dugme koje je otvorilo panel (ili na dugme koje ga zamenjuje, ako je traka u međuvremenu ponovo iscrtana).
import { useEffect, useRef, type RefObject } from 'react'

export function useFocusTrap(ref: RefObject<HTMLElement | null>, aktivno: boolean, onZatvori: () => void) {
  // najnoviji onZatvori bez ponovnog pokretanja efekta (inače bi panel pri svakom renderu ponovo preuzimao fokus)
  const zatvoriRef = useRef(onZatvori)
  zatvoriRef.current = onZatvori
  useEffect(() => {
    if (!aktivno) return
    const el = ref.current
    const prethodni = document.activeElement as HTMLElement | null
    const koren = el?.closest('.pr-overlay, [data-dijalog]')
    const pozadina = koren?.parentElement ? [...koren.parentElement.children].filter((c) => c !== koren && !c.hasAttribute('data-toast-regija')) : []
    for (const c of pozadina) c.setAttribute('inert', '')
    ;(el?.querySelector<HTMLElement>('[data-prvi-fokus]') ?? el?.querySelector<HTMLElement>('button:not([disabled])'))?.focus()
    const tipka = (e: KeyboardEvent) => {
      if (e.key === 'Escape') zatvoriRef.current()
      if (e.key === 'Tab' && el) {
        const f = [...el.querySelectorAll<HTMLElement>('button:not([disabled]), [href]')]
        if (!f.length) return
        const prvi = f[0]
        const poslednji = f[f.length - 1]
        if (e.shiftKey && document.activeElement === prvi) (e.preventDefault(), poslednji.focus())
        else if (!e.shiftKey && document.activeElement === poslednji) (e.preventDefault(), prvi.focus())
      }
    }
    window.addEventListener('keydown', tipka)
    return () => {
      window.removeEventListener('keydown', tipka)
      for (const c of pozadina) c.removeAttribute('inert')
      // traka se posle zatvaranja ponovo iscrtava: fokus se vraća posle iscrtavanja
      setTimeout(() => {
        const cilj = prethodni && prethodni !== document.body && prethodni.isConnected ? prethodni : document.querySelector<HTMLElement>('[data-pilula-koraka], [data-traka-telefon] .mid')
        cilj?.focus()
      }, 0)
    }
  }, [ref, aktivno])
}
