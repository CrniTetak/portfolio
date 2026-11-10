// O6 „Moji oglasi“ (UX 6.4): tabovi Aktivni · Istaknuti · Završeni; kartice sa „Istakni“, „Uredi“ i „Ukloni“ (potvrda).
// Za Anu i Marka to su njihovi oglasi, za prodavnicu oglasi firme. Oglasi „završeni“ u priči ili u slobodnoj razmeni (razmena obavljena, poklon, „za poene“)
// prelaze u tab „Završeni“. Oglas napravljen u jednom uglu vidi se ovde samo za taj ugao, a u brojačima i listama svima (PLAN B5.2).
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { Veza } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { broj } from '../../scenario/format'
import { NEUSPEH, PORUKE, PREDMET_PRICE } from '../../tekstovi/okvir'
import { ANA_ID, KATEGORIJA_PO_ID, MARKO_ID, jeRezervisan, type Oglas, oglasPoId } from '../../scenario/svet'
import { ponudeZaOglas, ukloniOglas } from '../../tokovi/operacije'

type Tab = 'aktivni' | 'istaknuti' | 'zavrseni'
const TABOVI: { id: Tab; naziv: string }[] = [
  { id: 'aktivni', naziv: 'Aktivni' },
  { id: 'istaknuti', naziv: 'Istaknuti' },
  { id: 'zavrseni', naziv: 'Završeni' },
]
/** Predmeti priče po vlasniku (da se vidi i kad nisu aktivni). */
const PREDMETI_PRICE: Record<string, string> = { [ANA_ID]: 'ana-ps2', [MARKO_ID]: 'markov-bicikl' }

export function O6() {
  const { ugao } = useEkran()
  const { s, uradjeno, tokovi, ja, promeni, slobodno } = useStanjePrice()
  const demo = useDemo()
  const [tab, setTab] = useState<Tab>('aktivni')
  const [ukloniId, setUkloniId] = useState<string | null>(null)
  const vlasnik = ja ?? ''
  const firma = ugao === 'prodavnica'
  const aktivni = s.oglasi.filter((o) => o.vlasnik === vlasnik)
  const istaknuti = aktivni.filter((o) => o.istaknuto)
  // predmet priče koji je u priči završen (razmena obavljena ili poklonjen) više nije aktivan
  const predmetId = PREDMETI_PRICE[vlasnik]
  const predmet = predmetId ? oglasPoId(predmetId) : undefined
  const objavljen = predmetId === 'ana-ps2' ? uradjeno('2.o3') : !!predmet
  const zavrseniPrice: Oglas[] = predmet && objavljen && !aktivni.some((o) => o.id === predmet.id) ? [predmet] : []
  const zavrseniSlobodno: Oglas[] = s.zavrseniSlobodno
    .map((id) => oglasPoId(id) ?? tokovi.noviOglasi.find((o) => o.id === id))
    .filter((o): o is Oglas => !!o && o.vlasnik === vlasnik && !zavrseniPrice.some((p) => p.id === o.id))
  const zavrseni = [...zavrseniPrice, ...zavrseniSlobodno]
  const liste: Record<Tab, Oglas[]> = { aktivni, istaknuti, zavrseni }
  const lista = liste[tab]
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="O6">
      <div className="naslov-reda">
        <h1>Moji oglasi</h1>
        <Veza ekran="O2" upit={{ novi: '1' }} className="dugme dugme-zeleno">
          <Plus size={18} strokeWidth={2} aria-hidden /> {firma ? 'Novi oglas firme' : 'Novi oglas'}
        </Veza>
      </div>
      <div className="tabovi" role="group" aria-label="Moji oglasi">
        {TABOVI.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} className="tab" onClick={() => setTab(t.id)}>
            {t.naziv} ({broj(liste[t.id].length)})
          </button>
        ))}
      </div>
      <div role="group" aria-label={`Prikaz: ${TABOVI.find((x) => x.id === tab)?.naziv}`} className="stog-sm" data-tab-panel={tab}>
        {lista.length === 0 && <p className="prazno-stanje">{tab === 'zavrseni' ? 'Nema završenih oglasa.' : tab === 'istaknuti' ? 'Nema istaknutih oglasa.' : 'Nema aktivnih oglasa.'}</p>}
        {lista.map((o) => {
          const brojPonuda = ponudeZaOglas(tokovi, o.id, slobodno).length
          return (
            <article key={o.id} className="stavka" data-moj-oglas={o.id} aria-label={o.naslov}>
              <div className="stavka-glavna stog-sm">
                <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id, ikonica: KATEGORIJA_PO_ID[o.kat]?.ikonica ?? 'image' }} />
                <div className="znacke">
                  <Znacka vrsta={o.firma ? 'firma' : 'gradjanin'} />
                  {o.istaknuto && <Znacka vrsta="istaknuto" />}
                  {o.aukcija && <Znacka vrsta="aukcija" />}
                  {o.nacin === 'poeni' && o.poeni && <Znacka vrsta="poeni" vrednost={o.poeni} />}
                  {o.nacin === 'poklon' && <Znacka vrsta="poklon" />}
                </div>
                {tab !== 'zavrseni' && brojPonuda > 0 && (
                  <p className="pomocni-tekst">
                    Ponude: <b className="num">{broj(brojPonuda)}</b>{' '}
                    <Veza ekran="X4" parametri={{ oglas: o.id }}>
                      Pogledaj
                    </Veza>
                  </p>
                )}
                {ukloniId === o.id && (
                  <Obavestenje stanje="upozorenje">
                    Ukloniti oglas? Oglas više neće biti aktivan.{' '}
                    <button
                      type="button"
                      className="dugme dugme-tekst"
                      onClick={() => {
                        const novo = promeni((t) => ukloniOglas(t, o.id))
                        setUkloniId(null)
                        demo.obavesti(novo.uklonjeni.includes(o.id) ? PORUKE.simulacija : NEUSPEH.uklanjanje) // D6: poruka po stvarnom ishodu
                      }}
                    >
                      Da
                    </button>{' '}
                    <button type="button" className="dugme dugme-tekst" autoFocus onClick={() => setUkloniId(null)}>
                      Odustani
                    </button>
                  </Obavestenje>
                )}
              </div>
              {tab !== 'zavrseni' ? (
                <div className="stavka-akcije">
                  {jeRezervisan(o) ? (
                    <button type="button" className="dugme dugme-linija" aria-label={`Istakni: ${o.naslov}`} aria-disabled="true" aria-describedby={`o6-r-${o.id}`}>
                      Istakni
                    </button>
                  ) : (
                    <Veza ekran="Z1" parametri={{ oglas: o.id }} className="dugme dugme-linija" ariaLabel={`Istakni: ${o.naslov}`}>
                      Istakni
                    </Veza>
                  )}
                  <Veza ekran="O2" upit={{ uredi: o.id }} className="dugme dugme-plavo" ariaLabel={`Uredi: ${o.naslov}`}>
                    Uredi
                  </Veza>
                  {!firma && !jeRezervisan(o) && o.vrsta === 'roba' && (
                    <Veza ekran="J3" parametri={{ oglas: o.id }} className="dugme dugme-linija" ariaLabel={`Aukcija: ${o.naslov}`}>
                      Aukcija
                    </Veza>
                  )}
                  <button type="button" className="dugme dugme-tekst" aria-label={`Ukloni: ${o.naslov}`} aria-disabled={jeRezervisan(o) || undefined} aria-describedby={jeRezervisan(o) ? `o6-r-${o.id}` : undefined} onClick={() => !jeRezervisan(o) && setUkloniId(o.id)}>
                    Ukloni
                  </button>
                  {jeRezervisan(o) && (
                    <span id={`o6-r-${o.id}`} className="razlog-neaktivno">
                      {PREDMET_PRICE}
                    </span>
                  )}
                </div>
              ) : (
                <div className="stavka-akcije">
                  <Veza ekran="O1" parametri={{ oglas: o.id }} className="dugme dugme-linija">
                    Pogledaj
                  </Veza>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
