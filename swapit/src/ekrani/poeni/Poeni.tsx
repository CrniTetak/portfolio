// W1 „Moji poeni“, W2 „Nedovoljno poena“, W5 „Zatraži poklon“ (UX 6.7, 7.5). Poeni su MODEL U PROVERI: ne kupuju se, ne isplaćuju, ne prenose.
// N-1 (PRAVNO): poene dodeljuje i oduzima SWAPIT, nikad korisnik korisniku, i to tek posle potvrđenog prijema.
// Račva „za poene“ (6R–8R): Ana ima 20 poena, bicikl vredi 50; poklanja PlayStation 2 (SWAPIT joj dodeljuje 50 kad Jovana potvrdi prijem = 70) i uzima bicikl (−50 = 20).
// Slobodni tok: uzmi stvar „za poene“ (W2 → X8 → X9), zatraži ili potvrdi poklon (W5). Firme ne drže poene.
import { Gift } from 'lucide-react'
import { BICIKL_ID, PS2_ID } from '../../scenario/svet'
import { useNavigate } from 'react-router'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { Dijalog } from '../../okvir/Dijalozi'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { KarticaOglasa, imeVlasnika } from '../../komponente/KarticaOglasa'
import { KorisnikRed } from '../../komponente/KorisnikRed'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { datum, poeni } from '../../scenario/format'
import { KAKO_RADI_POENI, POKLON_NAPOMENA, PORUKA_POKLONU, VREDNOSTI_OPIS, ZAHTEV_ZA_POKLON, poklonPotvrdjenTekst, potrosnjaOpis } from '../../scenario/poslovno'
import { NEPOZNATI_PRIMALAC_POKLONA } from '../../scenario/slobodno'
import { VREDNOST_POKLONA_SLOBODNO, istorijaPoena, JOVANA_ID, korisnikUgla, nadjiOglas, POENI_BICIKL, POENI_PS2, VREDNOSTI_POENA } from '../../scenario/svet'
import { nadjiRazmenu, pokreniRazmenu, poklonVrednost, zatraziPoklon } from '../../tokovi/operacije'
import { NEUSPEH, PORUKE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const BICIKL = BICIKL_ID
const PS2 = PS2_ID
const JOVANA = JOVANA_ID

/** Znak promene poena: „+“ ili „−“. */
const predznak = (n: number): string => (n < 0 ? '−' : '+')

export function W1() {
  const { s, ugao, grana, korak, slobodno, tokovi } = useStanjePrice()
  const demo = useDemo()
  const l = useLink()
  const k = korisnikUgla(s, ugao)
  if (!k) return null
  const istorija = istorijaPoena(demo.poz, k.id, tokovi)
  const bicikl = nadjiOglas(s, BICIKL)!
  const imaBicikl = !slobodno && ugao === 'ana' && grana === 'poeni' && korak >= 6
  const fali = POENI_BICIKL - k.poeni
  return (
    <div className="stog" data-ekran-sadrzaj="W1">
      <section className="kartica stog" aria-label="Stanje poena">
        <h1>Moji poeni</h1>
        <p className="iznos-veliki" data-poeni>
          {poeni(k.poeni)}
        </p>
        <div>
          <Znacka vrsta="model" />
        </div>
      </section>
      {imaBicikl && (
        <section className="kartica stog" aria-label="Bicikl za poene" data-bicikl-za-poene>
          <h2>Bicikl za poene</h2>
          <MalaStvar stvar={{ naslov: bicikl.naslov, vrsta: 'roba', oglas: bicikl.id }} />
          <p>
            <Znacka vrsta="poeni" vrednost={POENI_BICIKL} />
          </p>
          <div className="red-dugmad">
            <RadnjaDugme id="8R.uzmi" nakon={l('X9', { razmena: 'lanac' })} poruka={`${potrosnjaOpis(POENI_BICIKL, bicikl.naslov)}`} blokirano={fali > 0 ? `Nedovoljno poena: fali ${poeni(fali)}` : undefined}>
              Uzmi bicikl za poene
            </RadnjaDugme>
            <Veza ekran="O1" parametri={{ oglas: BICIKL }} className="dugme dugme-linija">
              Pogledaj oglas
            </Veza>
          </div>
        </section>
      )}
      <section className="kartica stog" aria-label="Kako radi">
        <h2>Kako radi</h2>
        <ol className="lista-pravila">
          {KAKO_RADI_POENI.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>
      <section className="kartica stog" aria-label="Vrednosti stvari">
        <h2>Vrednosti stvari</h2>
        <ul className="lista-pravila" data-vrednosti>
          {VREDNOSTI_POENA.map((v) => (
            <li key={v}>
              <b className="num">{poeni(v)}</b>: {VREDNOSTI_OPIS[v]}
            </li>
          ))}
        </ul>
        <div>
          <Znacka vrsta="model" />
        </div>
      </section>
      <section className="stog-sm" aria-label="Istorija poena">
        <h2>Istorija</h2>
        {istorija.length === 0 ? (
          <p className="prazno-stanje">Još nema promena poena.</p>
        ) : (
          <ul className="stog-sm" data-istorija>
            {istorija.map((st, i) => (
              <li key={`${st.opis}-${i}`} className="stavka" data-stavka-poena>
                <div className="stavka-glavna stog-sm">
                  <b>{st.opis}</b>
                  <span className="pomocni-tekst">{datum(st.datum)}</span>
                </div>
                <b className="num" data-iznos-poena={st.iznos}>
                  {predznak(st.iznos)}
                  {poeni(Math.abs(st.iznos))}
                </b>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="red-dugmad">
        <Veza ekran="P5" upit={{ nacin: 'poeni' }} className="dugme dugme-plavo">
          Pogledaj oglase za poene
        </Veza>
        <Veza ekran="P1" className="dugme dugme-linija">
          Nazad na početnu
        </Veza>
      </div>
    </div>
  )
}

export function W2() {
  const { parametri, ugao } = useEkran()
  const { s, grana, slobodno, uradjeno, tokovi, ja, promeni } = useStanjePrice()
  const demo = useDemo()
  const navigate = useNavigate()
  const l = useLink()
  const k = korisnikUgla(s, ugao)
  const oglas = nadjiOglas(s, parametri.oglas, tokovi)
  if (!oglas) return <NemaStranice />
  if (!k) return null
  const aktivan = s.oglasi.find((o) => o.id === oglas.id) ?? oglas
  const vrednost = aktivan.poeni ?? aktivan.vrednostPoena ?? 0
  const fali = vrednost - k.poeni
  const moj = oglas.vlasnik === k.id
  const izPrice = oglas.id === BICIKL && grana === 'poeni' && !slobodno
  const ps2 = nadjiOglas(s, PS2)!
  const pokloni = uradjeno('6R.pokloni')
  const jeZaPoene = aktivan.nacin === 'poeni' && !!aktivan.poeni
  const imaVrednost = vrednost > 0
  const idRazmene = `poeni-${oglas.id}`
  const uzeto = !!nadjiRazmenu(tokovi, idRazmene)
  const uzmi = () => {
    const novo = promeni((t) => pokreniRazmenu(t, { id: idRazmene, tip: 'poeni', cilj: oglas.id, naslov: oglas.naslov, vlasnik: oglas.vlasnik, od: k.id, stvari: [], poeni: vrednost, raspolozivo: k.poeni }))
    if (!nadjiRazmenu(novo, idRazmene)) return demo.obavesti(NEUSPEH.poeni) // D6
    demo.obavesti(potrosnjaOpis(vrednost, oglas.naslov))
    navigate(l('X8', { razmena: idRazmene }))
    window.scrollTo(0, 0)
  }
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W2">
      <h1>{fali > 0 && !moj ? 'Nedovoljno poena' : 'Uzmi za poene'}</h1>
      <div className="stavka">
        <div className="stavka-glavna stog-sm">
          <MalaStvar stvar={{ naslov: aktivan.naslov, vrsta: aktivan.vrsta, oglas: aktivan.id }} />
          <div className="znacke">
            <Znacka vrsta={aktivan.firma ? 'firma' : 'gradjanin'} />
            {vrednost > 0 && <Znacka vrsta="poeni" vrednost={vrednost} />}
          </div>
          <p className="pomocni-tekst">Vlasnik: {imeVlasnika(aktivan)}</p>
        </div>
      </div>
      {moj ? (
        <Obavestenje>Ovo je tvoj oglas.</Obavestenje>
      ) : !imaVrednost ? (
        <Obavestenje stanje="upozorenje" uloga="status">
          Ovaj oglas nije „za poene“. Možeš da ponudiš razmenu ili da zatražiš poklon, ako je poklon.
        </Obavestenje>
      ) : fali > 0 ? (
        <Obavestenje stanje="upozorenje" uloga="status">
          <b data-fali>
            Imaš {poeni(k.poeni)}, fali ti {poeni(fali)}.
          </b>{' '}
          Treba ti {poeni(vrednost)}.
        </Obavestenje>
      ) : (
        <Obavestenje stanje="uspeh" uloga="status">
          Imaš dovoljno poena: {poeni(k.poeni)}.
        </Obavestenje>
      )}
      {!moj && imaVrednost && fali > 0 && (
        <div className="stog" data-predlozi>
          <h2>Šta možeš</h2>
          <div className="stavka">
            <div className="stavka-glavna stog-sm">
              <b>Pokloni nešto i dobij poene</b>
              {izPrice ? <MalaStvar stvar={{ naslov: ps2.naslov, vrsta: 'roba', oglas: ps2.id, ikonica: 'gamepad-2' }} /> : <p className="pomocni-tekst">Objavi stvar kao poklon.</p>}
              <p className="pomocni-tekst">
                SWAPIT ti dodeljuje {poeni(izPrice ? POENI_PS2 : VREDNOST_POKLONA_SLOBODNO)} kad primalac potvrdi prijem poklona. <Znacka vrsta="model" />
              </p>
            </div>
            <div className="stavka-akcije">
              {izPrice ? (
                <RadnjaDugme id="6R.pokloni" poruka={`PlayStation 2 će biti poklon. SWAPIT dodeljuje ${poeni(POENI_PS2)} tek posle potvrđenog prijema`}>
                  Pokloni PlayStation 2
                </RadnjaDugme>
              ) : (
                <Veza ekran="O2" upit={{ novi: '1', nacin: 'poklon' }} className="dugme dugme-zeleno">
                  Pokloni nešto
                </Veza>
              )}
            </div>
          </div>
          {pokloni && izPrice && (
            <Obavestenje stanje="uspeh">
              PlayStation 2 je spreman za poklon. U narednom koraku: <Veza ekran="O2" upit={{ uredi: PS2 }}>uredi oglas</Veza>.
            </Obavestenje>
          )}
          <div className="stavka">
            <div className="stavka-glavna stog-sm">
              <b>Razmeni umesto toga</b>
              <p className="pomocni-tekst">Ponudi nešto što imaš za ovaj predmet.</p>
            </div>
            <div className="stavka-akcije">
              <Veza ekran="X1" parametri={{ oglas: oglas.id }} className="dugme dugme-plavo">
                Ponudi razmenu
              </Veza>
            </div>
          </div>
          <div className="stavka">
            <div className="stavka-glavna stog-sm">
              <b>Dodaj u listu želja</b>
              <p className="pomocni-tekst">Javićemo ti kad se pojavi poklapanje.</p>
            </div>
            <div className="stavka-akcije">
              <Veza ekran="W3" className="dugme dugme-linija">
                Lista želja
              </Veza>
            </div>
          </div>
        </div>
      )}
      {!moj && imaVrednost && fali <= 0 && (jeZaPoene || izPrice) && (
        <div className="red-dugmad">
          {izPrice ? (
            <Veza ekran="W1" className="dugme dugme-zeleno">
              Moji poeni
            </Veza>
          ) : uzeto ? (
            <Veza ekran="X8" parametri={{ razmena: idRazmene }} className="dugme dugme-zeleno">
              Idi na dogovor
            </Veza>
          ) : (
            <button type="button" className="dugme dugme-zeleno" data-uzmi-za-poene onClick={uzmi} aria-disabled={(ja === null) || undefined}>
              Uzmi za poene
            </button>
          )}
          <Veza ekran="W1" className="dugme dugme-linija">
            Moji poeni
          </Veza>
        </div>
      )}
      <p className="pomocni-tekst">
        Poeni se ne mogu kupiti. SWAPIT ih oduzima kad uzmeš stvar „za poene“. <Znacka vrsta="model" />
      </p>
    </section>
  )
}

export function W5() {
  const { parametri, ugao } = useEkran()
  const { s, grana, korak, uradjeno, slobodno, tokovi, promeni } = useStanjePrice()
  const demo = useDemo()
  const navigate = useNavigate()
  const l = useLink()
  const k = korisnikUgla(s, ugao)
  const [dijalog, setDijalog] = useState(false)
  const oglas = nadjiOglas(s, parametri.oglas, tokovi)
  if (!oglas) return <NemaStranice />
  const moj = !!k && oglas.vlasnik === k.id
  const izPrice = oglas.id === PS2 && grana === 'poeni' && !slobodno
  if (moj) {
    if (!izPrice) {
      // slobodni tok: vlasnik oglasa „Poklanjam“ potvrđuje poklon; zahtev stiže od drugog korisnika (ili je unapred pripremljen primer)
      const sopstveniPoklon = oglas.nacin === 'poklon'
      if (!sopstveniPoklon)
        return (
          <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="W5">
            <h1>Zatraži poklon</h1>
            <Obavestenje>Ovo je tvoj oglas. Zahtevi za poklon stižu ovde kad oglas postane poklon.</Obavestenje>
            <Veza ekran="O6" className="dugme dugme-plavo self-start">
              Moji oglasi
            </Veza>
          </section>
        )
      const idRazmene = `poklon-${oglas.id}`
      const razmena = nadjiRazmenu(tokovi, idRazmene)
      const stvarni = tokovi.zahtevi.filter((z) => z.oglas === oglas.id).map((z) => z.od)
      const zahtevaoci = stvarni.length > 0 ? stvarni : [NEPOZNATI_PRIMALAC_POKLONA]
      return (
        <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W5" data-vlasnik data-slobodan-poklon>
          <h1>Zahtev za poklon</h1>
          <MalaStvar stvar={{ naslov: oglas.naslov, vrsta: oglas.vrsta, oglas: oglas.id }} />
          {zahtevaoci.map((od) => (
            <div key={od} className="stavka" data-zahtev-od={od}>
              <div className="stavka-glavna stog-sm">
                <KorisnikRed id={od} />
                <p data-zahtev>{PORUKA_POKLONU}</p>
              </div>
              <div className="stavka-akcije">
                {razmena ? (
                  razmena.od === od && <Znacka vrsta="provereno" />
                ) : (
                  <button
                    type="button"
                    className="dugme dugme-zeleno"
                    onClick={() => {
                      const novo = promeni((t) => pokreniRazmenu(t, { id: idRazmene, tip: 'poklon', cilj: oglas.id, naslov: oglas.naslov, vlasnik: oglas.vlasnik, od, stvari: [], poeni: poklonVrednost(oglas.vrednostPoena) }))
                      if (!nadjiRazmenu(novo, idRazmene)) return demo.obavesti(NEUSPEH.razmena) // D6
                      demo.obavesti('Poklon je potvrđen. SWAPIT dodeljuje poene tek kad primalac potvrdi prijem.')
                      navigate(l('X8', { razmena: idRazmene }))
                      window.scrollTo(0, 0)
                    }}
                  >
                    Potvrdi poklon
                  </button>
                )}
              </div>
            </div>
          ))}
          {razmena && (
            <Obavestenje stanje="uspeh" uloga="status" >
              Poklon je potvrđen. SWAPIT ti dodeljuje <b>{poeni(razmena.poeni ?? 0)}</b> tek kad primalac potvrdi prijem. <Veza ekran="X8" parametri={{ razmena: idRazmene }}>Idi na dogovor</Veza>
            </Obavestenje>
          )}
          <p className="pomocni-tekst">{POKLON_NAPOMENA}</p>
        </section>
      )
    }
    if (korak < 7 || !uradjeno('7R.uredi')) return <JosNijePocelo naslov="Zatraži poklon" opis="Zahtev za poklon stiže kad Ana izmeni oglas PlayStation 2 u „Poklanjam“." korak={7} />
    // N-1: poklon je potvrđen kad Ana potvrdi, a poene dodeljuje SWAPIT tek kad Jovana potvrdi prijem (radnja 7R.prijem)
    const potvrdjen = uradjeno('7R.potvrdi')
    const dodeljeno = uradjeno('7R.prijem')
    return (
      <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W5" data-vlasnik>
        <h1>Zahtev za poklon</h1>
        <MalaStvar stvar={{ naslov: oglas.naslov, vrsta: 'roba', oglas: oglas.id, ikonica: 'gamepad-2' }} />
        <div className="stavka">
          <div className="stavka-glavna stog-sm">
            <KorisnikRed id={JOVANA} />
            <p data-zahtev>{ZAHTEV_ZA_POKLON}</p>
          </div>
        </div>
        {potvrdjen ? (
          <div className="stog" data-poklon-potvrdjen>
            <Obavestenje stanje="uspeh" uloga="status">
              <b>Poklon je potvrđen.</b> {dodeljeno && <span data-dodela>{poklonPotvrdjenTekst(POENI_PS2)}</span>} <Znacka vrsta="model" />
            </Obavestenje>
            <div className="red-dugmad">
              <Veza ekran="W1" className="dugme dugme-zeleno">
                Moji poeni
              </Veza>
              <Veza ekran="O6" className="dugme dugme-linija">
                Moji oglasi
              </Veza>
            </div>
          </div>
        ) : (
          <div className="red-dugmad">
            <RadnjaDugme id="7R.potvrdi" poruka={`Primalac je potvrdio prijem. SWAPIT ti je dodelio ${poeni(POENI_PS2)}`}>
              Potvrdi poklon
            </RadnjaDugme>
            <button type="button" className="dugme dugme-tekst" onClick={() => setDijalog(true)}>
              Odbij
            </button>
          </div>
        )}
        <p className="pomocni-tekst">{POKLON_NAPOMENA}</p>
        {dijalog && (
          <Dijalog naslov="Odbijanje zahteva" onZatvori={() => setDijalog(false)}>
            <p className="mb-4">U priči Ana potvrđuje poklon, pa se odbijanje ne primenjuje. Vrati se i potvrdi poklon.</p>
            <button type="button" className="dugme dugme-zeleno" data-prvi-fokus onClick={() => setDijalog(false)}>
              Vrati
            </button>
          </Dijalog>
        )}
      </section>
    )
  }
  // traži poklon (građanin koji nije vlasnik)
  if (ugao !== 'ana' && ugao !== 'marko') return null
  const poslat = !!k && tokovi.zahtevi.some((z) => z.oglas === oglas.id && z.od === k.id)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="W5" data-trazilac>
      <h1>Zatraži poklon</h1>
      <KarticaOglasa oglas={oglas} prva />
      <PrikaznoPolje oznaka="Poruka" vrednost={PORUKA_POKLONU} napomena />
      {oglas.nacin !== 'poklon' && <Obavestenje stanje="upozorenje">Ovaj oglas nije „Poklanjam“. Možeš da ponudiš razmenu.</Obavestenje>}
      {poslat ? (
        <Obavestenje stanje="uspeh" uloga="status">
          Zahtev je poslat vlasniku oglasa (demo). Čeka se njegova potvrda.
        </Obavestenje>
      ) : (
        <div className="red-dugmad">
          <button
            type="button"
            className="dugme dugme-zeleno"
            onClick={() => {
              if (k) promeni((t) => zatraziPoklon(t, oglas.id, k.id))
              demo.obavesti(PORUKE.simulacija)
            }}
          >
            <Gift size={18} strokeWidth={1.75} aria-hidden /> Zatraži poklon
          </button>
          <Veza ekran="O1" parametri={{ oglas: oglas.id }} className="dugme dugme-tekst">
            Nazad na oglas
          </Veza>
        </div>
      )}
      <p className="pomocni-tekst">{POKLON_NAPOMENA}</p>
    </section>
  )
}
