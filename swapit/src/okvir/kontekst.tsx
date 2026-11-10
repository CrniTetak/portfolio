// Kontekst ekrana: koji je ekran, u kom uglu se gleda i koji su parametri linka (id oglasa, razmene, svrhe plaćanja…).
// Ugao je u linku. Kuke za prelazak na drugi ekran i za promenu ugla („Gledaj kao“).
import { createContext, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../demo/DemoProvider'
import { RUTA_PO_ID, link } from '../pravila/rute'
import { NAZIV_UGLA, UGLOVI, type EkranId, type Ugao } from '../prica/tipovi'

export type EkranKontekst = { id: EkranId; ugao: Ugao; parametri: Record<string, string> }
export const EkranCtx = createContext<EkranKontekst>({ id: 'U1', ugao: 'ana', parametri: {} })
export const useEkran = (): EkranKontekst => useContext(EkranCtx)

/** Prelazak na ekran (u trenutnom ili datom uglu). Promena ugla nikad nije tiha. */
export function useIdi() {
  const navigate = useNavigate()
  const { ugao } = useEkran()
  const demo = useDemo()
  return useCallback(
    (id: EkranId, u: Ugao = ugao, parametri: Record<string, string> = {}, upit?: Record<string, string>) => {
      navigate(link(id, u, parametri, upit))
      window.scrollTo(0, 0)
      if (u !== ugao) demo.obavesti(`Gledaš kao: ${NAZIV_UGLA[u]}`)
    },
    [navigate, ugao, demo],
  )
}

/**
 * Promena ugla („Gledaj kao“): na istom ekranu ako ga novi ugao sme da vidi (zajedničke strane), inače na ekran trenutnog
 * stanja priče za taj ugao (ne skače na početak koraka). PLAN B2.
 */
export function usePromenaUgla() {
  const { id, ugao, parametri } = useEkran()
  const demo = useDemo()
  const navigate = useNavigate()
  return useCallback(
    (novi: Ugao, ostani = false) => {
      if (novi === ugao) return
      const ruta = RUTA_PO_ID[id]
      // ostaje samo ZAJEDNIČKA strana (vidljiva svim uglovima: P1, O1, S…); ekran jednog ugla ustupa mesto ekranu stanja priče za novi ugao.
      // Izuzetak: „Ovo radi Ana — Gledaj kao Ana“ (S8) ostaje na istom ekranu kad ga novi ugao sme da vidi.
      const ostaje = ruta && (ostani ? ruta.uglovi.includes(novi) : ruta.uglovi.length === UGLOVI.length)
      const cilj = ostaje ? link(id, novi, parametri) : link(demo.ekranZa(novi), novi)
      navigate(cilj)
      window.scrollTo(0, 0)
      demo.obavesti(`Gledaš kao: ${NAZIV_UGLA[novi]}`)
    },
    [id, ugao, parametri, demo, navigate],
  )
}
