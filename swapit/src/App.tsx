// Ruter (hash način: radi na svakom statičkom hostingu, osvežavanje nikad ne daje 404).
// Ugao i kontekst su u linku. Ekran koji ugao ne sme da vidi i nepostojeća ruta vode na kuću ugla, uz kratku poruku (PLAN B2).
import { Suspense, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useDemo } from './demo/DemoProvider'
import { ekranZa } from './ekrani'
import { NemaStranice } from './ekrani/NemaStranice'
import { EkranCtx } from './okvir/kontekst'
import { ID_NEMA_STRANICE, Okvir } from './okvir/Okvir'
import { PODRAZUMEVANI_UGAO, KUCA, RUTA_PO_ID, jeUgao, link, razresi } from './pravila/rute'
import type { Ugao } from './prica/tipovi'

/** Poslednji viđeni ugao (za ekrane bez ugla u linku: uvod, o demou, pravni tekstovi). Samo u memoriji. */
let zadnjiUgao: Ugao = PODRAZUMEVANI_UGAO

function Preusmeri({ na, poruka }: { na: string; poruka: string }) {
  const demo = useDemo()
  useEffect(() => demo.obavesti(poruka), [demo.obavesti, poruka])
  return <Navigate to={na} replace />
}

export function App() {
  const lokacija = useLocation()
  const r = razresi(lokacija.pathname)
  const prvi = lokacija.pathname.split('/')[1] ?? ''
  const ugao: Ugao = r?.ugao ?? (jeUgao(prvi) ? prvi : zadnjiUgao)
  if (r?.ugao) zadnjiUgao = r.ugao
  const ruta = r ? RUTA_PO_ID[r.id] : null

  // nepostojeća ruta: ekran „Nema te stranice“ sa dugmetom „Nazad na početnu“ (nikad prazno, bez tihog preusmeravanja)
  if (!r || !ruta)
    return (
      <EkranCtx.Provider value={{ id: ID_NEMA_STRANICE, ugao, parametri: {} }}>
        <Okvir>
          <NemaStranice />
        </Okvir>
      </EkranCtx.Provider>
    )
  // ekran koji ugao ne sme da vidi vodi na kuću ugla
  if (r.ugao && !ruta.uglovi.includes(r.ugao)) return <Preusmeri na={link(KUCA[r.ugao], r.ugao)} poruka="Taj ekran ovaj ugao ne vidi. Vraćamo te na početnu ugla." />

  const Ekran = ekranZa(r.id)
  return (
    <EkranCtx.Provider value={{ id: r.id, ugao, parametri: r.parametri }}>
      <Okvir>
        {/* ekrani se učitavaju lenjo (talas 4); dok modul stiže, vidi se kostur sa „Učitavanje…“ (nikad prazno mesto) */}
        <Suspense
          fallback={
            // T4-4: dok stiže modul ekrana vidi se kostur i „Učitavanje…“, nikad prazno mesto
            <div className="ucitavanje" role="status" data-ucitava>
              <p>Učitavanje…</p>
              <div className="kostur" aria-hidden="true" />
              <div className="kostur kostur-kratak" aria-hidden="true" />
              <div className="kostur" aria-hidden="true" />
            </div>
          }
        >
          {/* V9: key = ugao + ekran + parametri + upit (?q=, ?uredi=, ?novi= …), pa se lokalno stanje ekrana (izbori, kvačice u ekranu) resetuje pri promeni ugla ili stvari */}
          <Ekran key={`${ugao}|${r.id}|${JSON.stringify(r.parametri)}|${lokacija.search}`} />
        </Suspense>
      </Okvir>
    </EkranCtx.Provider>
  )
}
