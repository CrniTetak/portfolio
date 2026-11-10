import { useSyncExternalStore } from 'react'

/** Prati CSS media upit (širina, orijentacija…). Vraća true/false i osvežava se pri promeni. */
export function useMedia(upit: string): boolean {
  return useSyncExternalStore(
    (javi) => {
      const m = window.matchMedia(upit)
      m.addEventListener('change', javi)
      return () => m.removeEventListener('change', javi)
    },
    () => window.matchMedia(upit).matches,
    () => false,
  )
}
