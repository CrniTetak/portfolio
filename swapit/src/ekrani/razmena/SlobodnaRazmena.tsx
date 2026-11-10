// X8–X11 u SLOBODNOM toku: razmena koja nije lanac iz priče (prihvaćena ponuda, „uzmi za poene“, poklon). Stanje živi u tokovi.razmene.
// Faze: 1 dogovor → 2 primopredaja → 3 obavljena. Pomoćni korisnici (Irena, Stefan, primalac poklona…) potvrđuju sami; ako su obe strane Ana i Marko,
// svaka potvrđuje u svom uglu (Gledaj kao). N-1: poene dodeljuje i oduzima SWAPIT, nikad korisnik korisniku, i to tek posle potvrđenog prijema.
import { ArrowRight, Check, Truck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Padajuce, Pilule, Prekidac } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { TrakaFaza } from '../../komponente/TrakaFaza'
import { Veza, useLink } from '../../komponente/Veza'
import { Zvezdice } from '../../komponente/Zvezdice'
import { Znacka } from '../../komponente/Znacka'
import { useEkran, usePromenaUgla } from '../../okvir/kontekst'
import { NAZIV_UGLA, type Ugao } from '../../prica/tipovi'
import { demoDatum, danUNedelji } from '../../scenario/datumi'
import { datum, poeni } from '../../scenario/format'
import { KOMENTAR_PO_OCENI } from '../../scenario/prica'
import { poklonPotvrdjenTekst, potrosnjaOpis, predataStvarDodelaOpis } from '../../scenario/poslovno'
import { JAVNA_MESTA, KURIR, TELEFON_DEMO } from '../../scenario/strane'
import { ANA_ID, FIRMA_PO_ID, KORISNIK_PO_ID, MARKO_ID } from '../../scenario/svet'
import { dogovorZavrsen, drugaStrana, izaberiPredaju, nadjiRazmenu, oceniRazmenu, potvrdiPrijem, ucesnici } from '../../tokovi/operacije'
import type { RazmenaTok } from '../../tokovi/tokovi'
import { PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const FAZE = ['Ponuda prihvaćena', 'Dogovor', 'Primopredaja', 'Potvrda', 'Ocene']
const imeStrane = (id: string): string => FIRMA_PO_ID[id]?.naziv ?? KORISNIK_PO_ID[id]?.ime ?? id
const uglaIz = (id: string): Ugao | null => (id === ANA_ID ? 'ana' : id === MARKO_ID ? 'marko' : null)

/** Šta tekuća faza traka prikazuje (priča koristi iste nazive faza). */
function fazaTrake(r: RazmenaTok, ocenio: boolean): number {
  if (r.faza === 1) return 1
  if (r.faza === 2) return r.potvrdili.length > 0 ? 3 : 2
  return ocenio ? 5 : 4
}

function Veze({ r }: { r: RazmenaTok }) {
  return (
    <ul className="stog-sm" data-veze>
      <li className="stavka" data-veza={r.cilj}>
        <div className="stavka-glavna stog-sm">
          <p className="flex flex-wrap items-center gap-2">
            <b>{imeStrane(r.vlasnik)}</b> <ArrowRight size={16} strokeWidth={1.75} aria-hidden /> <b>{imeStrane(r.od)}</b>
          </p>
          <MalaStvar stvar={{ naslov: r.naslov, vrsta: 'roba', oglas: r.cilj }} />
        </div>
      </li>
      {r.stvari.length > 0 && (
        <li className="stavka" data-veza="nazad">
          <div className="stavka-glavna stog-sm">
            <p className="flex flex-wrap items-center gap-2">
              <b>{imeStrane(r.od)}</b> <ArrowRight size={16} strokeWidth={1.75} aria-hidden /> <b>{imeStrane(r.vlasnik)}</b>
            </p>
            {r.stvari.map((st) => (
              <MalaStvar key={st.naslov} stvar={st} />
            ))}
          </div>
        </li>
      )}
    </ul>
  )
}

/** Gledalac mora da bude jedna od strana razmene; inače je ovo tuđa razmena. */
function useRazmena() {
  const { parametri } = useEkran()
  const st = useStanjePrice()
  const r = nadjiRazmenu(st.tokovi, parametri.razmena)
  return { ...st, r }
}

function TudjaRazmena({ r, naslov }: { r: RazmenaTok; naslov: string }) {
  const promeniUgao = usePromenaUgla()
  const strane = [r.vlasnik, r.od].map(uglaIz).filter((u): u is Ugao => !!u)
  return (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X-tudja">
      <h1>{naslov}</h1>
      <Obavestenje>Ovo je razmena između drugih korisnika.{strane.length > 0 ? ' Možeš da je gledaš iz ugla jedne od strana.' : ''}</Obavestenje>
      <div className="red-dugmad">
        {strane.map((u) => (
          <button key={u} type="button" className="dugme dugme-plavo" onClick={() => promeniUgao(u, true)}>
            Gledaj kao {NAZIV_UGLA[u]}
          </button>
        ))}
        <Veza ekran="X12" className="dugme dugme-linija">
          Moje razmene i ponude
        </Veza>
      </div>
    </section>
  )
}

export function X8Slobodno() {
  const l = useLink()
  const navigate = useNavigate()
  const demo = useDemo()
  const { r, ja, promeni } = useRazmena()
  // V3: „Otkrij broj telefona“ važi za JEDNU razmenu (ključ sa id-om razmene)
  const [telefon, setTelefon] = useSaglasnost(`x8_telefon_${r?.id ?? 'x'}`)
  const [mesto, setMesto] = useState<string>(JAVNA_MESTA[0])
  if (!r) return <NemaStranice />
  if (!ja || ![r.vlasnik, r.od].includes(ja)) return <TudjaRazmena r={r} naslov="Dogovor i primopredaja" />
  const dan = demoDatum(7, true)
  const druga = drugaStrana(r, ja)
  const kurir = r.predaja === 'kurir'
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X8" data-slobodna-razmena={r.id}>
      <h1>Dogovor i primopredaja</h1>
      <TrakaFaza faze={FAZE} tekuca={fazaTrake(r, r.ocene.some((o) => o.autor === ja))} />
      <Veze r={r} />
      <div className="grupa-polja">
        <span className="polje-oznaka">Način predaje</span>
        <Pilule
          oznaka="Način predaje"
          vrednost={r.predaja}
          onChange={(v) => promeni((t) => izaberiPredaju(t, r.id, v))}
          onemoguceno={r.faza > 1 ? ['licno', 'kurir'] : []}
          opcije={[
            { v: 'licno', naziv: 'Lično na javnom mestu' },
            { v: 'kurir', naziv: 'Kurirom' },
          ]}
        />
      </div>
      {kurir ? (
        <p data-predaja="kurir">
          <Truck size={16} strokeWidth={1.75} aria-hidden className="mr-1 inline" />
          Kurirom: {KURIR} (izmišljeno). Dostavu poručuješ iz <Veza ekran="D1" upit={{ razmena: r.id }}>poručivanja dostave</Veza>.
        </p>
      ) : (
        <div data-predaja="licno" className="stog-sm">
          <Padajuce oznaka="Lično, na preporučenom javnom mestu" vrednost={mesto} onChange={setMesto} opcije={[...JAVNA_MESTA]} />
          <p className="pomocni-tekst">
            Termin: {danUNedelji(dan)}, {datum(dan)}
          </p>
        </div>
      )}
      <div className="stog-sm">
        <Prekidac oznaka="Otkrij broj telefona" ukljucen={telefon} onChange={setTelefon} />
        {telefon ? (
          <div className="stog-sm" data-telefoni>
            <PrikaznoPolje oznaka={`Telefon: ${imeStrane(druga)}`} vrednost={TELEFON_DEMO} />
          </div>
        ) : (
          <p className="pomocni-tekst">Telefon se otkriva tek posle prihvaćene ponude, i samo ako oboje želite.</p>
        )}
      </div>
      <div className="red-dugmad">
        <Veza ekran="C2" parametri={{ razgovor: druga }} className="dugme dugme-plavo">
          Poruke
        </Veza>
        {!kurir && (
          <Veza ekran="D1" upit={{ razmena: r.id }} className="dugme dugme-linija">
            <Truck size={18} strokeWidth={1.75} aria-hidden /> Pošalji kurirom
          </Veza>
        )}
        {r.faza === 1 ? (
          <button
            type="button"
            className="dugme dugme-zeleno"
            onClick={() => {
              promeni((t) => dogovorZavrsen(t, r.id))
              demo.obavesti(PORUKE.simulacija)
              navigate(l('X9', { razmena: r.id }))
              window.scrollTo(0, 0)
            }}
          >
            Dogovor završen
          </button>
        ) : (
          <Veza ekran="X9" parametri={{ razmena: r.id }} className="dugme dugme-zeleno">
            Idi na potvrdu primopredaje
          </Veza>
        )}
      </div>
    </section>
  )
}

export function X9Slobodno() {
  const demo = useDemo()
  const promeniUgao = usePromenaUgla()
  const { r, ja, promeni } = useRazmena()
  if (!r) return <NemaStranice />
  if (!ja || ![r.vlasnik, r.od].includes(ja)) return <TudjaRazmena r={r} naslov="Potvrdi primopredaju" />
  const potrebni = ucesnici(r)
  const prima = r.tip === 'razmena' ? potrebni.includes(ja) : ja === r.od
  const moguceKliknuti = r.faza === 2 && !r.potvrdili.includes(ja) && (prima || (r.tip !== 'razmena' && !uglaIz(r.od)))
  const tekst = r.tip === 'razmena' || prima ? 'Primio/la sam' : 'Potvrđujem predaju'
  const cekaDrugi = potrebni.find((u) => !r.potvrdili.includes(u) && uglaIz(u) && u !== ja)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X9" data-slobodna-razmena={r.id}>
      <h1>Potvrdi primopredaju</h1>
      <TrakaFaza faze={FAZE} tekuca={fazaTrake(r, r.ocene.some((o) => o.autor === ja))} />
      <Veze r={r} />
      {r.faza === 1 && (
        <Obavestenje stanje="upozorenje">
          Prvo se dogovorite o predaji. <Veza ekran="X8" parametri={{ razmena: r.id }}>Nazad na dogovor</Veza>
        </Obavestenje>
      )}
      <ul className="stog-sm" data-potvrde>
        {potrebni.map((u) => {
          const gotovo = r.potvrdili.includes(u)
          return (
            <li key={u} className="status-ucesnik" data-gotovo={gotovo ? '1' : undefined} data-potvrda={u}>
              {gotovo ? <Check size={16} strokeWidth={2} aria-hidden /> : null}
              {imeStrane(u)}: {gotovo ? 'potvrdio/la prijem' : 'čeka se potvrda'}
            </li>
          )
        })}
      </ul>
      {r.faza === 2 && (
        <div className="red-dugmad">
          <button
            type="button"
            className="dugme dugme-zeleno"
            aria-disabled={(!moguceKliknuti) || undefined}
            onClick={() => {
              promeni((t) => potvrdiPrijem(t, r.id, ja))
              demo.obavesti(PORUKE.simulacija)
            }}
          >
            {tekst}
          </button>
          {cekaDrugi && uglaIz(cekaDrugi) && (
            <button type="button" className="dugme dugme-linija" onClick={() => promeniUgao(uglaIz(cekaDrugi)!, true)}>
              Gledaj kao {NAZIV_UGLA[uglaIz(cekaDrugi)!]}
            </button>
          )}
          <Veza ekran="S5" className="dugme dugme-linija">
            Nije stiglo
          </Veza>
        </div>
      )}
      <Obavestenje>Ako neko ne potvrdi u roku, šaljemo podsetnik, pa otvaramo spor.</Obavestenje>
      {r.faza === 3 && (
        <div className="stog-sm" data-sve-potvrdjeno>
          <Obavestenje stanje="uspeh" uloga="status">
            Svi su potvrdili prijem.
          </Obavestenje>
          <Veza ekran="X10" parametri={{ razmena: r.id }} className="dugme dugme-zeleno self-start">
            Razmena obavljena
          </Veza>
        </div>
      )}
    </section>
  )
}

export function X10Slobodno() {
  const { r, ja, s } = useRazmena()
  if (!r) return <NemaStranice />
  if (!ja || ![r.vlasnik, r.od].includes(ja)) return <TudjaRazmena r={r} naslov="Razmena obavljena" />
  if (r.faza < 3)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X10" data-slobodna-razmena={r.id}>
        <h1>Razmena obavljena</h1>
        <Obavestenje>Razmena je obavljena kad svi potvrde prijem.</Obavestenje>
        <Veza ekran="X9" parametri={{ razmena: r.id }} className="dugme dugme-zeleno self-start">
          Potvrdi primopredaju
        </Veza>
      </section>
    )
  const k = s.korisnici[ja]
  const iznos = r.poeni ?? 0
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X10" data-slobodna-razmena={r.id}>
      <div className="text-center">
        <span className="velika-kvacica" aria-hidden>
          <Check size={40} strokeWidth={2.5} />
        </span>
        <h1 className="mt-3">Razmena obavljena</h1>
      </div>
      <Veze r={r} />
      <div className="kartica kartica-mirna" data-promena-poena>
        <h2>Poeni</h2>
        {r.tip === 'poeni' ? (
          <p>
            {ja === r.od ? potrosnjaOpis(iznos, r.naslov) : predataStvarDodelaOpis(iznos)} <Znacka vrsta="model" />
          </p>
        ) : r.tip === 'poklon' ? (
          <p>
            {ja === r.vlasnik ? poklonPotvrdjenTekst(iznos) : 'Poklon je primljen; tvoji poeni se ne menjaju.'} <Znacka vrsta="model" />
          </p>
        ) : (
          <p>
            Poeni se ne menjaju u ovoj razmeni.{k && <> Stanje: <b className="num">{poeni(k.poeni)}</b>.</>} <Znacka vrsta="model" />
          </p>
        )}
      </div>
      <div className="red-dugmad">
        <Veza ekran="X11" parametri={{ razmena: r.id }} className="dugme dugme-zeleno">
          Oceni razmenu
        </Veza>
        <Veza ekran="P1" className="dugme dugme-linija">
          Nazad na početnu
        </Veza>
      </div>
    </section>
  )
}

export function X11Slobodno() {
  const demo = useDemo()
  const { r, ja, promeni } = useRazmena()
  const [zvezde, setZvezde] = useState<3 | 4 | 5>(5)
  if (!r) return <NemaStranice />
  if (!ja || ![r.vlasnik, r.od].includes(ja)) return <TudjaRazmena r={r} naslov="Oceni razmenu" />
  if (r.faza < 3)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X11" data-slobodna-razmena={r.id}>
        <h1>Oceni razmenu</h1>
        <Obavestenje>Ocenjivanje se otključava kad je razmena obavljena i potvrđena sa svih strana.</Obavestenje>
        <Veza ekran="X9" parametri={{ razmena: r.id }} className="dugme dugme-zeleno self-start">
          Potvrdi primopredaju
        </Veza>
      </section>
    )
  const o = drugaStrana(r, ja)
  const moja = r.ocene.find((x) => x.autor === ja)
  const profil: { ekran: string; parametri: Record<string, string> } | null = KORISNIK_PO_ID[o] ? { ekran: 'N1', parametri: { korisnik: o } } : FIRMA_PO_ID[o] ? { ekran: 'F4', parametri: { firma: o } } : null
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X11" data-slobodna-razmena={r.id}>
      <h1>Oceni razmenu</h1>
      {moja ? (
        <div className="stog" data-recenzija-objavljena>
          <Obavestenje stanje="uspeh" uloga="status">
            <b>Recenzija je objavljena</b> na profilu: {imeStrane(o)}.
          </Obavestenje>
          <div className="znacke">
            <Zvezdice ocena={moja.ocena} /> <Znacka vrsta="provereno" />
          </div>
          <p>{KOMENTAR_PO_OCENI[moja.ocena]}</p>
          {profil && (
            <Veza ekran={profil.ekran} parametri={profil.parametri} className="dugme dugme-zeleno self-start">
              Pogledaj profil
            </Veza>
          )}
        </div>
      ) : (
        <div className="stog">
          <p>
            Ocenjuješ: <b>{imeStrane(o)}</b>
          </p>
          <div role="radiogroup" aria-label="Ocena od tri do pet" className="pilule">
            {([3, 4, 5] as const).map((n) => (
              <button key={n} type="button" role="radio" aria-checked={zvezde === n} className="pilula" aria-pressed={zvezde === n} onClick={() => setZvezde(n)}>
                {n}
              </button>
            ))}
          </div>
          <Zvezdice ocena={zvezde} velicina={28} />
          <p className="pomocni-tekst">U ovom demou se objavljuju ocene od tri do pet; izbor menja i tekst komentara.</p>
          <PrikaznoPolje oznaka="Tvoj komentar" vrednost={KOMENTAR_PO_OCENI[zvezde]} napomena />
          <div className="znacke">
            <Znacka vrsta="provereno" />
          </div>
          <p className="pomocni-tekst">Recenziju može da ostavi samo ko je obavio razmenu.</p>
          <div className="red-dugmad">
            <button
              type="button"
              className="dugme dugme-zeleno"
              onClick={() => {
                promeni((t) => oceniRazmenu(t, r.id, ja, zvezde))
                demo.obavesti(PORUKE.simulacija)
              }}
            >
              Objavi recenziju
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
