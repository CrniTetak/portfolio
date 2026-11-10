// Kontekst ekrana: koji je ekran i u kojoj ulozi se gleda (uloga je u linku). Kuke za prelazak na drugi ekran i za promenu uloge.
import { createContext, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../demo/DemoProvider'
import { KUCA, NAZIV_ULOGE, RUTA_PO_ID, link } from '../pravila/rute'
import type { EkranId, Uloga } from '../prica/tipovi'

export type EkranKontekst = { id: EkranId; uloga: Uloga; sekcija?: string }
export const EkranCtx = createContext<EkranKontekst>({ id: 'S1', uloga: 'guest' })
export const useEkran = () => useContext(EkranCtx)

/** Prelazak na ekran (u trenutnoj ili datoj ulozi). Vraća funkciju (id, uloga?, sekcija?). */
export function useIdi() {
  const navigate = useNavigate()
  const { uloga } = useEkran()
  const demo = useDemo()
  return useCallback(
    (id: EkranId, u: Uloga = uloga, sekcija?: string) => {
      navigate(link(id, u, sekcija))
      window.scrollTo(0, 0)
      // promena uloge nikad nije tiha
      if (u !== uloga) demo.obavesti(`Switched to the ${NAZIV_ULOGE[u]} view`)
    },
    [navigate, uloga, demo],
  )
}

/** Promena uloge: na istom ekranu ako ga nova uloga sme da vidi (javne strane), inače na ekran stanja priče za tu ulogu. */
export function usePromenaUloge() {
  const { id, uloga } = useEkran()
  const demo = useDemo()
  const navigate = useNavigate()
  return useCallback(
    (nova: Uloga) => {
      if (nova === uloga) return
      const ruta = RUTA_PO_ID[id]
      const cilj = ruta && ruta.uloge.includes(nova) && id !== 'S1' ? id : nova === 'guest' ? KUCA.guest : demo.ekranZa(nova)
      navigate(link(cilj, nova))
      window.scrollTo(0, 0)
      // promena uloge nikad nije tiha
      demo.obavesti(`Switched to the ${NAZIV_ULOGE[nova]} view`)
    },
    [id, uloga, demo, navigate],
  )
}
