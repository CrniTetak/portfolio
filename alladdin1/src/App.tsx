// Ruter (hash način: radi na svakom statičkom hostingu, osvežavanje nikad ne daje 404) + Čuvar 18+ (B5).
// Bez potvrde 18+ svaka ruta osim S1, S6 i S7 vodi na S1 (i posle potvrde vraća na traženi ekran). Uloga je u linku.
import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useDemo } from './demo/DemoProvider'
import { ekranZa } from './ekrani'
import { EkranCtx } from './okvir/kontekst'
import { Okvir } from './okvir/Okvir'
import { postaviZadnjuUlogu, zadnjaUloga } from './okvir/zadnjaUloga'
import { KUCA, RUTA_PO_ID, ULOGE, link, razresi } from './pravila/rute'
import type { Uloga } from './prica/tipovi'

export function App() {
  const lokacija = useLocation()
  const demo = useDemo()
  const r = razresi(lokacija.pathname)
  // uloga iz linka (i kad ruta ne postoji), inače poslednja viđena (S6/S7 nemaju ulogu u linku)
  const prvi = lokacija.pathname.split('/')[1] as Uloga
  const uloga = r?.uloga ?? (ULOGE.includes(prvi) ? prvi : zadnjaUloga())
  const ruta = r ? RUTA_PO_ID[r.id] : null
  useEffect(() => {
    if (r?.uloga) postaviZadnjuUlogu(r.uloga)
  }, [r?.uloga])

  // nepostojeća ruta vodi na kuću uloge (ili na ulaz ako 18+ nije potvrđeno)
  if (!r || !ruta) return <Navigate to={demo.potvrda18 ? link(KUCA[uloga], uloga) : '/'} replace />
  // Čuvar 18+: bez potvrde samo S1, S6 i S7
  const slobodno = r.id === 'S1' || r.id === 'S6' || r.id === 'S7'
  if (!demo.potvrda18 && !slobodno) return <Navigate to="/" replace state={{ povratak: lokacija.pathname }} />
  // nalog druge uloge vodi na kuću te uloge
  if (r.uloga && !ruta.uloge.includes(r.uloga)) return <Navigate to={link(KUCA[r.uloga], r.uloga)} replace />

  const Ekran = ekranZa(r.id)
  return (
    <EkranCtx.Provider value={{ id: r.id, uloga, sekcija: r.sekcija }}>
      <Okvir>
        <Ekran />
      </Okvir>
    </EkranCtx.Provider>
  )
}
