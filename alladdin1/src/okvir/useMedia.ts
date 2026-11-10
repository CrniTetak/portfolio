import { useEffect, useState } from 'react'

/** Prati media query (npr. telefon). Pretvaranje layouta u dve različite trake (računar/telefon) ide kroz ovo. */
export function useMedia(upit: string): boolean {
  const [da, setDa] = useState(() => (typeof window === 'undefined' ? false : window.matchMedia(upit).matches))
  useEffect(() => {
    const m = window.matchMedia(upit)
    const f = () => setDa(m.matches)
    f()
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [upit])
  return da
}
/** Telefon: manje od 720 px (UI 4). */
export const useTelefon = () => useMedia('(max-width: 719px), (max-height: 500px) and (max-width: 1023px)')
