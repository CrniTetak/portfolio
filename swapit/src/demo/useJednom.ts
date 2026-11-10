// Zaštita od dvostrukog klika (sitno 8): radnja koja pravi nešto novo (objava, kupovina, slanje) se izvrši najviše jednom u kratkom roku,
// čak i kad pregledač isporuči dva klika pre nego što React iscrta novi ekran.
import { useRef } from 'react'

const RAZMAK_MS = 800

export function useJednom(): (radnja: () => void) => void {
  const poslednji = useRef(Number.NEGATIVE_INFINITY)
  return (radnja) => {
    const sada = performance.now()
    if (sada - poslednji.current < RAZMAK_MS) return
    poslednji.current = sada
    radnja()
  }
}
