// X8 „Dogovor i primopredaja“, X9 „Potvrdi primopredaju“, X10 „Razmena obavljena“, X11 „Oceni razmenu“ (UX 6.5).
// Koraci 7 i 8 priče. U glavnom toku razmena ima tri veze (lanac): Ana → Jovana, Jovana → Marko, Marko → Ana. U račvi „za poene“ postoji jedna: Marko → Ana.
import { ArrowRight, Check, Truck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Padajuce, Prekidac } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { TrakaFaza } from '../../komponente/TrakaFaza'
import { Veza, useLink } from '../../komponente/Veza'
import { Zvezdice } from '../../komponente/Zvezdice'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { demoDatum, danUNedelji } from '../../scenario/datumi'
import { datum, poeni } from '../../scenario/format'
import { KOMENTAR_PO_OCENI, LANAC, PONUDE_MARKO, PREDAJA_LANCA, RECENZIJE_PRICE, type VezaLanca } from '../../scenario/prica'
import { JAVNA_MESTA, KURIR, REF_POSILJKA, TELEFON_DEMO } from '../../scenario/strane'
import { ANA_ID, JOVANA_ID, KORISNIK_PO_ID, korisnikUgla, MARKO_ID, oglasPoId } from '../../scenario/svet'
import { PORUKE } from '../../tekstovi/okvir'
import { potrosioDodelioTekst } from '../../scenario/poslovno'
import { X10Slobodno, X11Slobodno, X8Slobodno, X9Slobodno } from './SlobodnaRazmena'

/** Ocena koju priča objavljuje (RECENZIJE_PRICE); u vođenoj priči je zaključana na njoj. */
const OCENA_PRICE = 5

const FAZE = ['Ponuda prihvaćena', 'Dogovor', 'Primopredaja', 'Potvrda', 'Ocene']
const ANA = ANA_ID
const MARKO = MARKO_ID

/** Veze razmene: lanac u glavnom toku, jedna veza u račvi „za poene“. */
export const vezeRazmene = (grana: 'lanac' | 'poeni'): VezaLanca[] => (grana === 'lanac' ? LANAC : [LANAC[2]])

function Veze({ veze, dodatak }: { veze: VezaLanca[]; dodatak?: (v: VezaLanca, i: number) => ReactNode }) {
  return (
    <ul className="stog-sm" data-veze>
      {veze.map((v, i) => {
        const o = oglasPoId(v.oglas)!
        return (
          <li key={v.oglas} className="stavka" data-veza={v.oglas}>
            <div className="stavka-glavna stog-sm">
              <p className="flex flex-wrap items-center gap-2">
                <b>{v.od}</b> <ArrowRight size={16} strokeWidth={1.75} aria-hidden /> <b>{v.ka}</b>
              </p>
              <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id, ikonica: 'puzzle' }} />
              {dodatak?.(v, i)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

function fazaDogovora(korak: number, uradjeno: (id: string) => boolean, poeni_: boolean): number {
  if (uradjeno(poeni_ ? '8R.x11' : '8.x11')) return 5
  if (uradjeno(poeni_ ? '8R.pot.marko' : '8.pot.jovana')) return 4
  if (korak >= 8) return 3
  if (uradjeno('7.z4')) return 2
  return 1
}

/** S2: razmena sa jednom ponudom (nije lanac) u priči je samo pregled; priča se nastavlja lancem. */
function DogovorPregled({ ponudaId }: { ponudaId: string }) {
  const ponuda = PONUDE_MARKO.find((p) => p.id === ponudaId)!
  const bicikl = oglasPoId('markov-bicikl')!
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X8" data-dogovor-pregled={ponuda.id}>
      <h1>Dogovor i primopredaja</h1>
      <Obavestenje>Pregled: u ovoj priči Marko dogovara lanac razmene, pa se dogovor sa ovom ponudom ovde samo prikazuje.</Obavestenje>
      <ul className="stog-sm" data-veze>
        <li className="stavka">
          <div className="stavka-glavna stog-sm">
            <p className="flex flex-wrap items-center gap-2">
              <b>{MARKO_ID}</b> <ArrowRight size={16} strokeWidth={1.75} aria-hidden /> <b>{ponuda.od}</b>
            </p>
            <MalaStvar stvar={{ naslov: bicikl.naslov, vrsta: bicikl.vrsta, oglas: bicikl.id }} />
          </div>
        </li>
        <li className="stavka">
          <div className="stavka-glavna stog-sm">
            <p className="flex flex-wrap items-center gap-2">
              <b>{ponuda.od}</b> <ArrowRight size={16} strokeWidth={1.75} aria-hidden /> <b>{MARKO_ID}</b>
            </p>
            {ponuda.stvari.map((st) => (
              <MalaStvar key={st.naslov} stvar={st} />
            ))}
          </div>
        </li>
      </ul>
      <div className="red-dugmad">
        <Veza ekran="X4" parametri={{ oglas: 'markov-bicikl' }} className="dugme dugme-zeleno">
          Nazad na primljene ponude
        </Veza>
      </div>
    </section>
  )
}

function X8Prica() {
  const l = useLink()
  const demo = useDemo()
  const { ugao, parametri } = useEkran()
  const { korak, grana, uradjeno } = useStanjePrice()
  const [telefon, setTelefon] = useSaglasnost('x8_telefon')
  const [mesto, setMesto] = useState<string>(JAVNA_MESTA[0])
  const dogovoreno = uradjeno('7.c2')
  const poruceno = uradjeno('7.z4')
  // S2: razmena se čita iz parametra linka; ponuda koja nije lanac (npr. Irenina) u priči je samo pregled
  const pojedinacna = parametri.razmena !== 'lanac' ? PONUDE_MARKO.find((p) => p.id === parametri.razmena) : undefined
  if (pojedinacna) return <DogovorPregled ponudaId={pojedinacna.id} />
  if (grana === 'lanac' && !uradjeno('6.jovana')) return <JosNijePocelo naslov="Dogovor i primopredaja" opis="Kad sve troje prihvate lanac, ovde se dogovarate o predaji stvari i bira se lično preuzimanje ili kurir." korak={7} />
  const veze = vezeRazmene(grana)
  const jeAna = ugao === 'ana'
  const dan = demoDatum(7, true)
  const ja = ugao === 'ana' ? ANA_ID : MARKO_ID
  const ucesniciOstali = (grana === 'lanac' ? [ANA_ID, MARKO_ID, JOVANA_ID] : [ANA_ID, MARKO_ID]).filter((id) => id !== ja)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X8">
      <h1>Dogovor i primopredaja</h1>
      <TrakaFaza faze={FAZE} tekuca={fazaDogovora(korak, uradjeno, grana === 'poeni')} />
      <Veze
        veze={veze}
        dodatak={(_v, i) =>
          grana === 'lanac' && PREDAJA_LANCA[i] === 'kurir' ? (
            <p data-predaja="kurir">
              <Truck size={16} strokeWidth={1.75} aria-hidden className="mr-1 inline" />
              Kurirom: {KURIR} (izmišljeno).{' '}
              {poruceno ? (
                <Veza ekran="D3" parametri={{ posiljka: REF_POSILJKA }}>
                  Pošiljka {REF_POSILJKA}
                </Veza>
              ) : (
                jeAna ? 'Dostavu poručuješ ti.' : 'Čeka se da Ana poruči dostavu.'
              )}
            </p>
          ) : (
            <div data-predaja="licno" className="stog-sm">
              <Padajuce oznaka="Lično, na preporučenom javnom mestu" vrednost={mesto} onChange={setMesto} opcije={[...JAVNA_MESTA]} />
              <p className="pomocni-tekst">
                Termin: {danUNedelji(dan)}, {datum(dan)}
              </p>
            </div>
          )
        }
      />
      <div className="stog-sm">
        <Prekidac oznaka="Otkrij broj telefona" ukljucen={telefon} onChange={setTelefon} />
        {telefon ? (
          // S7: telefon po osobi (svoj broj ne prikazujemo sebi)
          <div className="stog-sm" data-telefoni>
            {ucesniciOstali.map((id) => (
              <PrikaznoPolje key={id} oznaka={`Telefon: ${KORISNIK_PO_ID[id].ime}`} vrednost={TELEFON_DEMO} />
            ))}
          </div>
        ) : (
          <p className="pomocni-tekst">Telefon se otkriva tek posle prihvaćene ponude, i samo ako {grana === 'lanac' ? 'se svi slažu' : 'oboje želite'}.</p>
        )}
      </div>
      <div className="red-dugmad">
        <RadnjaDugme id="7.x8" varijanta="plavo" nakon={l('C2', { razgovor: grana === 'lanac' ? 'lanac' : MARKO })} poruka={false} pregled={l('C2', { razgovor: 'lanac' })}>
          Poruke
        </RadnjaDugme>
        {grana === 'lanac' &&
          (jeAna ? (
            dogovoreno ? (
              <Veza ekran="D1" className="dugme dugme-linija">
                <Truck size={18} strokeWidth={1.75} aria-hidden /> Pošalji kurirom
              </Veza>
            ) : (
              <span className="radnja-dugme">
                <button type="button" className="dugme dugme-linija" disabled>
                  <Truck size={18} strokeWidth={1.75} aria-hidden /> Pošalji kurirom
                </button>
                <span className="razlog-neaktivno">Prvo: dogovorite se u razgovoru</span>
              </span>
            )
          ) : (
            <span className="razlog-neaktivno">Čeka se da Ana poruči dostavu.</span>
          ))}
        {poruceno ? (
          <Veza ekran="X9" parametri={{ razmena: 'lanac' }} className="dugme dugme-zeleno">
            Dogovor završen
          </Veza>
        ) : (
          <span className="radnja-dugme">
            <button type="button" className="dugme dugme-zeleno" disabled onClick={() => demo.obavesti(PORUKE.simulacija)}>
              Dogovor završen
            </button>
            <span className="razlog-neaktivno">{grana === 'lanac' ? 'Prvo: poruči dostavu bicikla' : 'Prvo: dogovorite se u razgovoru'}</span>
          </span>
        )}
      </div>
    </section>
  )
}

function X9Prica() {
  const { ugao } = useEkran()
  const { korak, grana, uradjeno } = useStanjePrice()
  const poenska = grana === 'poeni'
  if (korak < 7 || (grana === 'lanac' && korak === 7 && !uradjeno('7.z4'))) return <JosNijePocelo naslov="Potvrdi primopredaju" opis="Kad stvari stignu, svako potvrđuje „Primio/la sam“. Tek kad sve strane potvrde, razmena je obavljena." korak={8} />
  const veze = vezeRazmene(grana)
  const svi = uradjeno(poenska ? '8R.pot.marko' : '8.pot.jovana')
  // ko potvrđuje: primalac stvari (lanac); u račvi Ana prima bicikl, a Marko potvrđuje predaju
  const potvrdio = (korisnik: string): boolean => {
    if (poenska) return korisnik === ANA ? uradjeno('8R.pot.ana') : uradjeno('8R.pot.marko')
    if (korisnik === ANA) return uradjeno('8.pot.ana')
    if (korisnik === MARKO) return uradjeno('8.pot.marko')
    return uradjeno('8.pot.jovana')
  }
  const radnjaGledaoca = poenska ? (ugao === 'ana' ? '8R.pot.ana' : '8R.pot.marko') : ugao === 'ana' ? '8.pot.ana' : '8.pot.marko'
  const korisnik = ugao === 'ana' ? ANA : MARKO
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X9">
      <h1>Potvrdi primopredaju</h1>
      <TrakaFaza faze={FAZE} tekuca={fazaDogovora(korak, uradjeno, poenska)} />
      <Veze
        veze={veze}
        dodatak={(v) => {
          const prima = v.ka
          const gotovo = potvrdio(prima)
          const moja = !poenska && prima === korisnik
          return (
            <div className="stog-sm" data-potvrda={prima}>
              <p className="status-ucesnik" data-gotovo={gotovo ? '1' : undefined}>
                {gotovo ? <Check size={16} strokeWidth={2} aria-hidden /> : null}
                {prima}: {gotovo ? 'potvrdio/la prijem' : 'čeka se potvrda'}
              </p>
              {moja && (
                <div className="red-dugmad">
                  <RadnjaDugme id={radnjaGledaoca} poruka>
                    Primio/la sam
                  </RadnjaDugme>
                  <Veza ekran="S5" className="dugme dugme-linija">
                    Nije stiglo
                  </Veza>
                </div>
              )}
            </div>
          )
        }}
      />
      {poenska && (
        <div className="red-dugmad">
          {(ugao === 'ana' || ugao === 'marko') && (
            <RadnjaDugme id={radnjaGledaoca} poruka>
              {ugao === 'ana' ? 'Primio/la sam' : 'Potvrđujem predaju'}
            </RadnjaDugme>
          )}
          <Veza ekran="S5" className="dugme dugme-linija">
            Nije stiglo
          </Veza>
        </div>
      )}
      <Obavestenje>Ako neko ne potvrdi u roku, šaljemo podsetnik, pa otvaramo spor.</Obavestenje>
      {svi && (
        <div className="stog-sm" data-sve-potvrdjeno>
          <Obavestenje stanje="uspeh" uloga="status">
            {poenska ? 'Obe strane su potvrdile prijem.' : 'Sve troje je potvrdilo prijem.'}
          </Obavestenje>
          <Veza ekran="X10" parametri={{ razmena: 'lanac' }} className="dugme dugme-zeleno self-start">
            Razmena obavljena
          </Veza>
        </div>
      )}
    </section>
  )
}

function X10Prica() {
  const l = useLink()
  const { ugao } = useEkran()
  const { s, korak, grana, uradjeno } = useStanjePrice()
  const poenska = grana === 'poeni'
  if (korak < 8 || !uradjeno(poenska ? '8R.pot.marko' : '8.pot.jovana')) return <JosNijePocelo naslov="Razmena obavljena" opis="Ovaj ekran se otvara kad sve strane potvrde primopredaju." korak={8} />
  const veze = vezeRazmene(grana)
  const korisnik = korisnikUgla(s, ugao)
  const vrednost = oglasPoId('markov-bicikl')!.vrednostPoena ?? 0
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X10">
      <div className="text-center">
        <span className="velika-kvacica" aria-hidden>
          <Check size={40} strokeWidth={2.5} />
        </span>
        <h1 className="mt-3">Razmena obavljena</h1>
      </div>
      <Veze veze={veze} />
      <div className="kartica kartica-mirna" data-promena-poena>
        <h2>Poeni</h2>
        {poenska ? (
          <p data-poeni-razmene>
            {potrosioDodelioTekst(vrednost)} <Znacka vrsta="model" />
          </p>
        ) : (
          <p>Poeni se ne menjaju u ovoj razmeni. {korisnik && <>Stanje: <b className="num">{poeni(korisnik.poeni)}</b>.</>} <Znacka vrsta="model" /></p>
        )}
      </div>
      <div className="red-dugmad">
        <RadnjaDugme id={poenska ? '8R.x10' : '8.x10'} nakon={l('X11', { razmena: 'lanac' })} poruka={false} pregled={l('X11', { razmena: 'lanac' })}>
          Oceni razmenu
        </RadnjaDugme>
        <Veza ekran="P1" className="dugme dugme-linija">
          Nazad na početnu
        </Veza>
      </div>
    </section>
  )
}

function X11Prica() {
  const l = useLink()
  const { ugao } = useEkran()
  const { s, korak, grana, uradjeno } = useStanjePrice()
  const poenska = grana === 'poeni'
  const objavljena = uradjeno(poenska ? '8R.x11' : '8.x11')
  const demo = useDemo()
  const uPrici = demo.rezim === 'vodjena'
  const [zvezde, setZvezde] = useState<number>(OCENA_PRICE)
  if (korak < 8 || !uradjeno(poenska ? '8R.pot.marko' : '8.pot.jovana')) return <JosNijePocelo naslov="Oceni razmenu" opis="Ocenjivanje se otključava kad je razmena obavljena i potvrđena sa svih strana." korak={8} />
  // Ana ocenjuje Marka, Marko ocenjuje Jovanu (glavni tok); u račvi recenziju ostavlja samo Ana
  const rec = RECENZIJE_PRICE.find((r) => r.autor === (ugao === 'marko' ? MARKO : ANA)) ?? RECENZIJE_PRICE[0]
  const ocenjuje = !(poenska && ugao === 'marko')
  // L-8: kraj grane „za poene“
  const krajGrane = poenska && uradjeno('8R.x11')
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X11">
      <h1>Oceni razmenu</h1>
      {krajGrane && (
        <Obavestenje stanje="uspeh">
          <span data-kraj-grane>
            Kraj grane „za poene“: Marko sada ima {poeni(s.korisnici[MARKO].poeni)} i može da uzme Jovanine udžbenike za poene.
          </span>
        </Obavestenje>
      )}
      {!ocenjuje ? (
        <>
          <Obavestenje>U ovoj grani razmene recenziju ostavlja Ana. Ti je dobijaš na profil.</Obavestenje>
          <RadnjaDugme id="8R.x11" nakon={l('N1', { korisnik: MARKO })}>
            Pogledaj recenziju
          </RadnjaDugme>
        </>
      ) : objavljena ? (
        <div className="stog" data-recenzija-objavljena>
          <Obavestenje stanje="uspeh" uloga="status">
            <b>Recenzija je objavljena</b> na profilu korisnika {rec.o}.
          </Obavestenje>
          <div className="znacke">
            <Zvezdice ocena={rec.ocena} /> <Znacka vrsta="provereno" />
          </div>
          <p>{rec.tekst}</p>
          <Veza ekran="N1" parametri={{ korisnik: rec.o }} className="dugme dugme-zeleno self-start">
            Pogledaj profil
          </Veza>
        </div>
      ) : (
        <div className="stog">
          <p>
            Ocenjuješ korisnika: <b>{rec.o}</b>
          </p>
          <div role="radiogroup" aria-label="Ocena od jedan do pet" className="pilule">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={zvezde === n} className="pilula" aria-pressed={zvezde === n} disabled={uPrici && n !== OCENA_PRICE} onClick={() => setZvezde(n)}>
                {n}
              </button>
            ))}
          </div>
          <Zvezdice ocena={zvezde} velicina={28} />
          {uPrici ? (
            <p className="pomocni-tekst" data-ocena-zakljucana>
              U priči je ocena zaključana na {OCENA_PRICE}, da se prosek na profilu slaže sa ocenama koje se zaista broje.
            </p>
          ) : (
            zvezde !== OCENA_PRICE && (
              <p className="pomocni-tekst" data-ocena-pregled>
                Izabrana ocena menja samo tekst komentara. U ovom demou se objavljuje ocena {OCENA_PRICE}, pa se prosek na profilu ne menja drugačije.
              </p>
            )
          )}
          <PrikaznoPolje oznaka="Tvoj komentar" vrednost={zvezde === OCENA_PRICE ? rec.tekst : KOMENTAR_PO_OCENI[zvezde as 1 | 2 | 3 | 4 | 5]} napomena />
          <div className="znacke">
            <Znacka vrsta="provereno" />
          </div>
          <p className="pomocni-tekst">Recenziju može da ostavi samo ko je obavio razmenu.</p>
          <div className="red-dugmad">
            <RadnjaDugme id={poenska ? '8R.x11' : '8.x11'} nakon={l('N1', { korisnik: rec.o })} blokirano={zvezde === OCENA_PRICE ? undefined : `U ovom demou se objavljuje ocena ${OCENA_PRICE}`}>
              Objavi recenziju
            </RadnjaDugme>
          </div>
        </div>
      )}
    </section>
  )
}

// ---------------------------------------------------------------------------------------------------------------------
// Razmena iz priče (lanac ili ponuda za Markov bicikl) ostaje vezana za radnje priče; svaka druga razmena je slobodni tok (SlobodnaRazmena.tsx).
// ---------------------------------------------------------------------------------------------------------------------
const jeIzPrice = (razmena: string): boolean => razmena === 'lanac' || PONUDE_MARKO.some((p) => p.id === razmena)

export function X8() {
  const { parametri } = useEkran()
  return jeIzPrice(parametri.razmena) ? <X8Prica /> : <X8Slobodno />
}
export function X9() {
  const { parametri } = useEkran()
  return jeIzPrice(parametri.razmena) ? <X9Prica /> : <X9Slobodno />
}
export function X10() {
  const { parametri } = useEkran()
  return jeIzPrice(parametri.razmena) ? <X10Prica /> : <X10Slobodno />
}
export function X11() {
  const { parametri } = useEkran()
  return jeIzPrice(parametri.razmena) ? <X11Prica /> : <X11Slobodno />
}
