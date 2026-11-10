import { useEffect, useState } from 'react'

/** Prati media query (npr. telefon). Pretvaranje rasporeda u dve različite trake (računar/telefon) ide kroz ovo. */
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
/** Telefon: uži od 720 px, ili niski položeni telefon (UI 4, kao u AllAddIn1). */
export const useTelefon = (): boolean => useMedia('(max-width: 719px), (max-height: 500px) and (max-width: 1023px)')
