// D1–D3 u SLOBODNOM toku: dostava za razmenu koju je gledalac sam napravio (ili za primer, kad je ulaz „kamion“ u traci). Kurir preuzima i
// isporučuje stvar, ne prenosi novac. Naknada je ilustrativna („nije cenovnik“); plaćanje je lažno (Z3, Z4). Stanje: tokovi.dostava.
import { Truck } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useTelefon } from '../../okvir/useMedia'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Kvacica, Padajuce, Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { danUNedelji, demoDatum, dodajDane } from '../../scenario/datumi'
import { datum, din, kg } from '../../scenario/format'
import { MALA_POSILJKA_KG } from '../../scenario/prica'
import { DOSTAVA_PRIMER, TERMINI_DOSTAVE } from '../../scenario/slobodno'
import { KURIR, REF_POSILJKA_SLOBODNA } from '../../scenario/strane'
import { CENE } from '../../scenario/svet'
import { sledecaFazaDostave, strane } from '../../tokovi/operacije'
import { PORUKE } from '../../tekstovi/okvir'

const FAZE_POSILJKE = ['Naručeno', 'Preuzeto', 'U vožnji', 'Isporučeno']
type Velicina = 'mala' | 'velika'

/** Razmene za koje gledalac može da naruči dostavu: njegove nezavršene razmene i primer. */
function useStavke() {
  const { tokovi, ja } = useStanjePrice()
  const razmene = tokovi.razmene.filter((r) => r.faza < 3 && !!ja && strane(r).includes(ja)).map((r) => ({ id: r.id, naslov: r.naslov, vrsta: 'roba' as const, oglas: r.cilj as string | undefined, ikonica: 'package' as string | undefined }))
  return [...razmene, { id: DOSTAVA_PRIMER.id, naslov: DOSTAVA_PRIMER.naslov, vrsta: DOSTAVA_PRIMER.vrsta, oglas: undefined as string | undefined, ikonica: DOSTAVA_PRIMER.ikonica as string | undefined }]
}

const nazivVelicine = (v: Velicina) => (v === 'mala' ? `Mala (do ${kg(MALA_POSILJKA_KG)})` : 'Velika')

export function D1Slobodno() {
  const navigate = useNavigate()
  const l = useLink()
  const { korak } = useStanjePrice()
  const telefon = useTelefon()
  const stavke = useStavke()
  const trazena = new URLSearchParams(useLocation().search).get('razmena')
  const [razmena, setRazmena] = useState(stavke.some((x) => x.id === trazena) ? (trazena as string) : stavke[0].id)
  const [velicina, setVelicina] = useState<Velicina>('mala')
  const [termin, setTermin] = useState<string>(TERMINI_DOSTAVE[0])
  const izabrana = stavke.find((x) => x.id === razmena) ?? stavke[0]
  const dan = dodajDane(demoDatum(korak, true), 1)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="D1" data-slobodna-dostava>
      <h1>Dostava — poručivanje</h1>
      <Obavestenje>Kurir preuzima i isporučuje stvar; ne prenosi novac.</Obavestenje>
      <div className="grupa-polja">
        <span className="polje-oznaka">Razmena</span>
        {telefon ? (
          // N4: na telefonu je predmet prikazan JEDNOM (kartica sa ikonicom je ujedno izbor), ne čip + kartica
          <ul className="stog-sm" aria-label="Razmena" data-izbor-razmene>
            {stavke.map((x) => (
              <li key={x.id}>
                <button type="button" className="stavka stavka-izbor" aria-pressed={x.id === izabrana.id} onClick={() => setRazmena(x.id)}>
                  <MalaStvar stvar={{ naslov: x.naslov, vrsta: x.vrsta, oglas: x.oglas, ikonica: x.ikonica }} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <Pilule oznaka="Razmena" vrednost={izabrana.id} onChange={setRazmena} opcije={stavke.map((x) => ({ v: x.id, naziv: x.naslov }))} />
            <div className="stavka">
              <MalaStvar stvar={{ naslov: izabrana.naslov, vrsta: izabrana.vrsta, oglas: izabrana.oglas, ikonica: izabrana.ikonica }} />
            </div>
          </>
        )}
      </div>
      <div className="grupa-polja">
        <span className="polje-oznaka">Veličina pošiljke</span>
        <Pilule<Velicina>
          oznaka="Veličina pošiljke"
          vrednost={velicina}
          onChange={setVelicina}
          opcije={[
            { v: 'mala', naziv: nazivVelicine('mala') },
            { v: 'velika', naziv: nazivVelicine('velika') },
          ]}
        />
        <p className="pomocni-tekst">
          Naknada: <b className="num">{din(velicina === 'mala' ? CENE.dostavaMala : CENE.dostavaVelika)}</b> sa PDV-om <Znacka vrsta="ilustrativno" />
        </p>
      </div>
      <p className="pomocni-tekst">Preuzimanje i isporuka: adresu vidi samo kurir.</p>
      <Padajuce oznaka="Termin" vrednost={termin} onChange={setTermin} opcije={[...TERMINI_DOSTAVE]} />
      <p className="pomocni-tekst">
        Dan: {danUNedelji(dan)}, {datum(dan)}
      </p>
      <p>
        <Truck size={16} strokeWidth={1.75} aria-hidden className="mr-1 inline" />
        Kurir: <b>{KURIR}</b> (izmišljeno)
      </p>
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          onClick={() => {
            const upit = new URLSearchParams({ razmena: izabrana.id, velicina, termin: String(TERMINI_DOSTAVE.findIndex((t) => t === termin)) })
            navigate(`${l('D2')}?${upit.toString()}`)
            window.scrollTo(0, 0)
          }}
        >
          Nastavi
        </button>
      </div>
    </section>
  )
}

export function D2Slobodno() {
  const l = useLink()
  const navigate = useNavigate()
  const { korak } = useStanjePrice()
  const stavke = useStavke()
  const q = new URLSearchParams(useLocation().search)
  const [uslovi, setUslovi] = useSaglasnost('d2_uslovi_slobodno')
  const izabrana = stavke.find((x) => x.id === q.get('razmena')) ?? stavke[stavke.length - 1]
  const velicina: Velicina = q.get('velicina') === 'velika' ? 'velika' : 'mala'
  const termin = q.get('termin') === '1' ? 1 : 0
  const iznos = velicina === 'mala' ? CENE.dostavaMala : CENE.dostavaVelika
  const dan = dodajDane(demoDatum(korak, true), 1)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="D2" data-slobodna-dostava>
      <h1>Dostava — pregled i naknada</h1>
      <div className="stavka">
        <div className="stavka-glavna stog-sm">
          <MalaStvar stvar={{ naslov: izabrana.naslov, vrsta: izabrana.vrsta, oglas: izabrana.oglas }} />
          <p className="pomocni-tekst">
            Kurir: {KURIR} (izmišljeno) · {nazivVelicine(velicina).toLowerCase()} pošiljka · {danUNedelji(dan)}, {datum(dan)} · {TERMINI_DOSTAVE[termin].toLowerCase()}
          </p>
        </div>
      </div>
      <p>
        Naknada: <b className="num iznos-veliki">{din(iznos)}</b> sa PDV-om
      </p>
      <Znacka vrsta="ilustrativno" />
      <p className="pomocni-tekst" data-ko-prima-naknadu>
        Naknadu prima platforma za uslugu kurirske službe; ne ide drugom korisniku.
      </p>
      <Kvacica obavezna checked={uslovi} onChange={setUslovi} dataKljuc="d2_uslovi_slobodno" oznaka="Prihvatam uslove dostave" />
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          aria-disabled={(!uslovi) || undefined}
          onClick={() => {
            const upit = new URLSearchParams({ razmena: izabrana.id, velicina, termin: String(termin) })
            navigate(`${l('Z3', { svrha: 'dostava', ref: REF_POSILJKA_SLOBODNA })}?${upit.toString()}`)
            window.scrollTo(0, 0)
          }}
        >
          Plati dostavu
        </button>
        {!uslovi && <span className="razlog-neaktivno">Označi obavezna polja</span>}
        <Veza ekran="D1" upit={{ razmena: izabrana.id }} className="dugme dugme-tekst">
          Nazad
        </Veza>
      </div>
      <p className="pomocni-tekst">Demo — ništa se ne naplaćuje.</p>
    </section>
  )
}

export function D3Slobodno() {
  const demo = useDemo()
  const { tokovi, promeni } = useStanjePrice()
  const d = tokovi.dostava
  if (!d)
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="D3" data-slobodna-dostava data-nema-dostave>
        <h1>Praćenje pošiljke</h1>
        <Obavestenje>Još nisi poručio/la dostavu. Posle plaćanja ovde se prati pošiljka.</Obavestenje>
        <Veza ekran="D1" className="dugme dugme-zeleno self-start">
          Poruči dostavu
        </Veza>
      </section>
    )
  const jePrimer = d.razmena === DOSTAVA_PRIMER.id
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="D3" data-slobodna-dostava>
      <h1>Praćenje pošiljke</h1>
      <p>
        Pošiljka <b>{REF_POSILJKA_SLOBODNA}</b> · {KURIR} (izmišljeno)
      </p>
      <ol className="posiljka" aria-label="Faze pošiljke" data-posiljka>
        {FAZE_POSILJKE.map((f, i) => (
          <li key={f} data-stanje={i < d.faza ? 'gotovo' : i === d.faza ? 'tekuce' : 'buduce'} aria-current={i === d.faza ? 'step' : undefined}>
            {f}
            <span className="sr-only">{i < d.faza ? ' — urađeno' : i === d.faza ? ' — trenutno' : ' — još nije'}</span>
          </li>
        ))}
      </ol>
      <div className="red-dugmad">
        {d.faza < 3 && (
          <button
            type="button"
            className="dugme dugme-plavo"
            onClick={() => {
              promeni(sledecaFazaDostave)
              demo.obavesti(PORUKE.simulacija)
            }}
          >
            Sledeća faza (demo)
          </button>
        )}
        {jePrimer ? (
          <Veza ekran="X12" className="dugme dugme-linija">
            Moje razmene i ponude
          </Veza>
        ) : (
          <Veza ekran="X9" parametri={{ razmena: d.razmena }} className="dugme dugme-zeleno">
            Potvrdi prijem
          </Veza>
        )}
        <Veza ekran="S5" className="dugme dugme-linija">
          Prijavi problem
        </Veza>
      </div>
      <p className="pomocni-tekst">Faze pošiljke se u demou menjaju dugmetom; ništa se ne šalje.</p>
    </section>
  )
}
