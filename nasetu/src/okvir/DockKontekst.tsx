// Na telefonu u vođenom režimu postoji JEDAN fiksni sloj pri dnu: traka koraka spojena sa glavnom akcijom ekrana.
// Ekran ne zna za traku: glavno dugme akcije se samo "prebaci" (portal) u slot trake, ako je slot tu.
import { createContext, useCallback, useContext, useState } from 'react'
import type { ReactNode } from 'react'

interface DockApi {
  slot: HTMLElement | null
  postaviSlot: (el: HTMLElement | null) => void
  /** Broj dugmadi koja su trenutno "prebačena" u slot. */
  brojDugmadi: number
  registruj: (delta: number) => void
}

const Ctx = createContext<DockApi>({ slot: null, postaviSlot: () => {}, brojDugmadi: 0, registruj: () => {} })

export function DockProvider({ children }: { children: ReactNode }) {
  const [slot, setSlot] = useState<HTMLElement | null>(null)
  const [broj, setBroj] = useState(0)
  const registruj = useCallback((d: number) => setBroj((b) => Math.max(0, b + d)), [])
  return <Ctx.Provider value={{ slot, postaviSlot: setSlot, brojDugmadi: broj, registruj }}>{children}</Ctx.Provider>
}

export const useDock = () => useContext(Ctx)
