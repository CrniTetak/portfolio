// P6 „Mapa“ (UX 6.3, PLAN B6.5): ilustrativna mapa Beograda. Oglasi su krugovi približne lokacije (nikad tačka). Predmeti priče imaju svoje krugove,
// a svi ostali oglasi su grupisani po opštini („N oglasa u ovom području“); klik na grupu otvara listu SVIH oglasa iz tog područja.
// Pretraga i filteri iz P5 prenose se kroz link (?q=…), pa mapa pokazuje isto što i rezultati. Oglasi van Beograda nemaju mesto na ovoj mapi.
import { useLocation } from 'react-router'
import { BICIKL_ID, PS2_ID, UDZBENICI_ID } from '../scenario/svet'
import { useState } from 'react'
import { useStanjePrice } from '../demo/useStanje'
import { KarticaOglasa } from '../komponente/KarticaOglasa'
import { Mapa, type KrugNaMapi } from '../komponente/Mapa'
import { Obavestenje } from '../komponente/Obavestenje'
import { PoljeNaTelefonu } from '../komponente/PoljeNaTelefonu'
import { Veza } from '../komponente/Veza'
import { brojAktivnih, izLinka, primeni, uLink } from '../pretraga/filteri'
import { odgovara } from '../pretraga/pretrazi'
import { broj, km } from '../scenario/format'
import { RADIJUS_KM } from '../scenario/prica'
import { OPSTINE, nazivOpstine, polozajOglasa } from '../scenario/svet'

const PRICA_NA_MAPI = [BICIKL_ID, UDZBENICI_ID, PS2_ID]
const PO_STRANI = 8

export function P6() {
  const { s } = useStanjePrice()
  const { search } = useLocation()
  const { upit, filteri } = izLinka(new URLSearchParams(search))
  const [izbor, setIzbor] = useState<string>('oglas:markov-bicikl')
  const [prikazano, setPrikazano] = useState(PO_STRANI)
  // P-V5: ista sadržina kao mapa, ali kao lista dugmadi (tastatura, čitač ekrana, telefon)
  const [prikaz, setPrikaz] = useState<'mapa' | 'lista'>('mapa')

  const imaFiltera = !!upit.trim() || brojAktivnih(filteri) > 0
  // bez pretrage mapa pokazuje sve oglase u Beogradu; sa pretragom samo one koji odgovaraju
  const osnova = imaFiltera ? primeni(s.oglasi.filter((o) => !upit.trim() || odgovara(o, upit)), { ...filteri, grad: 'Beograd', zemlja: 'Srbija' }) : s.oglasi
  const vanBeograda = imaFiltera && (filteri.grad !== 'Beograd' || filteri.zemlja !== 'Srbija') ? primeni([...s.region].filter((o) => !upit.trim() || odgovara(o, upit)), filteri).length : 0
  const prica = osnova.filter((o) => PRICA_NA_MAPI.includes(o.id) && o.opstina)
  const grupe = OPSTINE.map((op) => ({ op, oglasi: osnova.filter((o) => o.opstina === op.id && !PRICA_NA_MAPI.includes(o.id)) })).filter((g) => g.oglasi.length > 0)

  const izaberi = (id: string) => {
    setIzbor(id)
    setPrikazano(PO_STRANI)
  }
  const krugovi: KrugNaMapi[] = [
    ...grupe.map((g) => ({ id: `opstina:${g.op.id}`, x: g.op.x, y: g.op.y + 4.5, grupa: g.oglasi.length, izabran: izbor === `opstina:${g.op.id}`, oznaka: `${broj(g.oglasi.length)} oglasa u području ${g.op.naziv}, približna lokacija` })),
    ...prica.map((o) => {
      const p = polozajOglasa(o.opstina!, o.id)
      return { id: `oglas:${o.id}`, x: p.x, y: p.y, izabran: izbor === `oglas:${o.id}`, oznaka: `${o.naslov}, ${nazivOpstine(o.opstina!)}, približna lokacija` }
    }),
  ]

  const izabranOglas = izbor.startsWith('oglas:') ? prica.find((o) => `oglas:${o.id}` === izbor) : undefined
  const izabranaGrupa = izbor.startsWith('opstina:') ? grupe.find((g) => `opstina:${g.op.id}` === izbor) : undefined
  const ukupnoNaMapi = prica.length + grupe.reduce((z, g) => z + g.oglasi.length, 0)

  return (
    <div className="stog" data-ekran-sadrzaj="P6" data-oglasa-na-mapi={ukupnoNaMapi}>
      <h1>Mapa</h1>
      <PoljeNaTelefonu />
      <p className="pomocni-tekst">
        Grad: {filteri.grad} · Zemlja: {filteri.zemlja} · Radijus: {km(RADIJUS_KM)} (samo prikaz) · <Veza ekran="P4" upit={uLink(upit, filteri)} className="veza-tekst">Filteri</Veza> · <Veza ekran="P10" className="veza-tekst">Kako ređamo oglase</Veza>
      </p>
      {imaFiltera && (
        <p data-mapa-pretraga>
          Na mapi: <b className="num">{broj(ukupnoNaMapi)}</b> oglasa{upit.trim() ? ` za „${upit.trim()}“` : ''}.
        </p>
      )}
      {vanBeograda > 0 && <Obavestenje>Još {broj(vanBeograda)} oglasa je van Beograda i nema mesta na ovoj mapi. Pogledaj ih u rezultatima pretrage.</Obavestenje>}
      <div className="tabovi-prikaza" role="group" aria-label="Način prikaza" data-prikaz-mape>
        <button type="button" className="pilula" aria-pressed={prikaz === 'mapa'} onClick={() => setPrikaz('mapa')}>
          Mapa
        </button>
        <button type="button" className="pilula" aria-pressed={prikaz === 'lista'} onClick={() => setPrikaz('lista')}>
          Lista
        </button>
      </div>
      <p className="sr-only" role="status" data-izabrano-status>
        {izabranOglas ? `Izabrano: ${izabranOglas.naslov}, ${nazivOpstine(izabranOglas.opstina!)}` : izabranaGrupa ? `Izabrano: ${izabranaGrupa.op.naziv}, ${broj(izabranaGrupa.oglasi.length)} oglasa` : ''}
      </p>
      <div className="mapa-okvir">
        {prikaz === 'mapa' ? (
          <div className="kartica">
            <Mapa krugovi={krugovi} onIzbor={izaberi} naslov="Ilustrativna mapa Beograda sa krugovima približne lokacije oglasa" />
            <p className="pomocni-tekst mt-2">Krug nije tačna adresa. Klikni na krug da vidiš oglas ili oglase u tom području.</p>
          </div>
        ) : (
          <div className="kartica stog-sm" data-lista-vidljiva>
            <h2>Oglasi po području</h2>
            <ul className="stog-sm">
              {prica.map((o) => (
                <li key={o.id}>
                  <button type="button" className="dugme dugme-linija" aria-pressed={izbor === `oglas:${o.id}`} onClick={() => izaberi(`oglas:${o.id}`)}>
                    {o.naslov}, {nazivOpstine(o.opstina!)} (iz priče)
                  </button>
                </li>
              ))}
              {grupe.map((g) => (
                <li key={g.op.id}>
                  <button type="button" className="dugme dugme-linija" aria-pressed={izbor === `opstina:${g.op.id}`} onClick={() => izaberi(`opstina:${g.op.id}`)}>
                    {g.op.naziv}: {broj(g.oglasi.length)} oglasa
                  </button>
                </li>
              ))}
            </ul>
            <p className="pomocni-tekst">Krug nije tačna adresa; prikazujemo samo približno područje.</p>
          </div>
        )}
        <section className="stog" aria-live="polite" aria-label="Izabrano na mapi" data-izbor>
          {izabranOglas && (
            <>
              <h2>Oglas na mapi</h2>
              <div>
                <KarticaOglasa oglas={izabranOglas} />
              </div>
              <Obavestenje>Prikazujemo samo približnu lokaciju.</Obavestenje>
            </>
          )}
          {izabranaGrupa && (
            <>
              <h2>{broj(izabranaGrupa.oglasi.length)} oglasa u ovom području</h2>
              <p className="pomocni-tekst">{izabranaGrupa.op.naziv}</p>
              <div className="flex flex-wrap gap-4" data-lista-grupe>
                {izabranaGrupa.oglasi.slice(0, prikazano).map((o) => (
                  <KarticaOglasa key={o.id} oglas={o} />
                ))}
              </div>
              {prikazano < izabranaGrupa.oglasi.length && (
                <button type="button" className="dugme dugme-linija self-start" onClick={() => setPrikazano((p) => p + PO_STRANI)}>
                  Prikaži još ({broj(izabranaGrupa.oglasi.length - prikazano)})
                </button>
              )}
              <Obavestenje>Prikazujemo samo približnu lokaciju.</Obavestenje>
            </>
          )}
          {!izabranOglas && !izabranaGrupa && <p className="prazno-stanje">{ukupnoNaMapi === 0 ? 'Nema oglasa za izabranu pretragu.' : 'Izaberi krug na mapi.'}</p>}
        </section>
      </div>
      <h2 className="sr-only">Oglasi na mapi kao lista</h2>
      <ul className="sr-only" data-lista-mape hidden={prikaz === 'lista'}>
        {prica.map((o) => (
          <li key={o.id}>
            {o.naslov}, {nazivOpstine(o.opstina!)}
          </li>
        ))}
        {grupe.map((g) => (
          <li key={g.op.id}>
            {g.op.naziv}: {broj(g.oglasi.length)} oglasa
          </li>
        ))}
      </ul>
    </div>
  )
}
