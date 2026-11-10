// F1 „Poslovni nalog — planovi“, F2 „Otvaranje poslovnog naloga“, F5 „Uredi profil firme“, F7 „Servisi i zanatlije“, F8 „Pretplata (upravljanje)“ i
// F9 „Reklama Sponzorisano“ (UX 6.13). Iznosi su izmišljeni i nose oznaku „ilustrativno, nije cenovnik“, sa PDV-om. Plaćanje je lažni prikaz (Z3, Z4).
// Plan i podešavanja firme se čuvaju u tokovima (nestaju sa „Restart demo“); firma plaća kao poslovni korisnik (V-3).
import { Megaphone } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { useSaglasnost, useStanjePrice } from '../../demo/useStanje'
import { Ilustracija } from '../../komponente/Ilustracija'
import { Kvacica, Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { OvoRadi } from '../../komponente/OvoRadi'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { Dijalog } from '../../okvir/Dijalozi'
import { useEkran } from '../../okvir/kontekst'
import { DATUM_SLEDECA_NAPLATA, ISTORIJA_RACUNA } from '../../scenario/datumi'
import { broj, datum, din } from '../../scenario/format'
import { DELATNOSTI, F2_PRIMER_NAZIV, F2_SAGLASNOST, F9_ODREDISTE_OPIS, PLANOVI, type PlanId } from '../../scenario/poslovno'
import { ODREDISTA_REKLAME, RADNA_VREMENA } from '../../scenario/slobodno'
import { PIB_DEMO } from '../../scenario/strane'
import { CENE, FIRMA_PO_ID, FIRME, KATEGORIJA_PO_ID, nazivOpstine, REKLAMA_DANA, ZUPCANIK_ID } from '../../scenario/svet'
import { izmeniPoslovno } from '../../tokovi/operacije'
import { PORUKE } from '../../tekstovi/okvir'

const cenaPlana = (id: PlanId): number => (id === 'majstor' ? CENE.pretplataMajstor : CENE.pretplataRadnja)
const jePlan = (x: string | null): x is PlanId => x === 'majstor' || x === 'radnja'

/** Plan iz linka (?plan=…) ili plan koji firma već ima. */
function usePlan(): PlanId {
  const q = new URLSearchParams(useLocation().search).get('plan')
  const { s } = useStanjePrice()
  return jePlan(q) ? q : s.zupcanik.plan === 'Majstor' ? 'majstor' : 'radnja'
}

export function F1() {
  const { ugao } = useEkran()
  const { s } = useStanjePrice()
  const moj = ugao === 'prodavnica' ? (s.zupcanik.plan === 'Majstor' ? 'majstor' : 'radnja') : null
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="F1">
      <h1>Poslovni nalog — planovi</h1>
      <p>Za servise, zanatlije i prodavnice. Iznosi su mesečni, sa PDV-om.</p>
      <div className="dva-stupca dva-stupca-jednaka" data-planovi>
        {PLANOVI.map((p) => (
          <article key={p.id} className="kartica kartica-mirna stog" data-plan={p.id} aria-current={moj === p.id ? 'true' : undefined}>
            <h2>
              {p.naziv} <span className="pomocni-tekst">— {p.za}</span>
            </h2>
            <p className="iznos-veliki">
              {din(cenaPlana(p.id))} <span className="pomocni-tekst">mesečno</span>
            </p>
            <div>
              <Znacka vrsta="ilustrativno" />
            </div>
            <ul className="lista-pravila">
              {p.sadrzi.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            {moj === p.id ? (
              <span className="znacka znacka-poklon self-start">Tvoj plan</span>
            ) : (
              <Veza ekran="F2" upit={{ plan: p.id }} className="dugme dugme-zeleno self-start">
                {moj ? 'Pređi na ovaj plan' : 'Otvori poslovni nalog'}
              </Veza>
            )}
          </article>
        ))}
      </div>
      <Obavestenje>Oznaka „Firma“ stoji na svim oglasima firme. Firme ne drže poene.</Obavestenje>
    </section>
  )
}

export function F2() {
  const navigate = useNavigate()
  const l = useLink()
  const { ugao } = useEkran()
  const plan = usePlan()
  const [saglasan, setSaglasan] = useSaglasnost('f2_saglasnost')
  const [delatnost, setDelatnost] = useState<string>(ugao === 'prodavnica' ? DELATNOSTI[2] : DELATNOSTI[0])
  const firma = ugao === 'prodavnica' ? FIRMA_PO_ID[ZUPCANIK_ID] : null
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="F2">
      <h1>{firma ? 'Promena plana' : 'Otvaranje poslovnog naloga'}</h1>
      <PrikaznoPolje oznaka="Naziv firme" vrednost={firma?.naziv ?? F2_PRIMER_NAZIV} napomena />
      <div className="grupa-polja">
        <span className="polje-oznaka">Delatnost</span>
        <Pilule<string> oznaka="Delatnost" vrednost={delatnost} onChange={setDelatnost} opcije={DELATNOSTI.map((d) => ({ v: d, naziv: d }))} />
      </div>
      <PrikaznoPolje oznaka="Opština" vrednost={firma ? nazivOpstine(firma.opstina) : 'Zvezdara'} />
      <PrikaznoPolje oznaka="PIB" vrednost={PIB_DEMO} />
      <PrikaznoPolje oznaka="Kontakt" vrednost="kontakt@demo-firma.example" />
      <p data-izabrani-plan>
        Plan: <b>{PLANOVI.find((p) => p.id === plan)?.naziv}</b> · <b className="num">{din(cenaPlana(plan))}</b> mesečno, sa PDV-om <Znacka vrsta="ilustrativno" />
      </p>
      <Kvacica obavezna checked={saglasan} onChange={setSaglasan} dataKljuc="f2_saglasnost" oznaka={F2_SAGLASNOST} />
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          aria-disabled={(!saglasan) || undefined}
          onClick={() => {
            navigate(l('Z3', { svrha: 'pretplata', ref: plan }))
            window.scrollTo(0, 0)
          }}
        >
          Nastavi na pretplatu
        </button>
        {!saglasan && <span className="razlog-neaktivno">Označi obavezna polja</span>}
        <Veza ekran="F1" className="dugme dugme-tekst">
          Nazad na planove
        </Veza>
      </div>
    </section>
  )
}

export function F5() {
  const navigate = useNavigate()
  const demo = useDemo()
  const l = useLink()
  const { tokovi, promeni } = useStanjePrice()
  const firma = FIRMA_PO_ID[ZUPCANIK_ID]
  const [vreme, setVreme] = useState<string>(RADNA_VREMENA[tokovi.poslovno.radnoVreme])
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="F5">
      <h1>Uredi profil firme</h1>
      <PrikaznoPolje oznaka="Naziv firme" vrednost={firma.naziv} napomena />
      <PrikaznoPolje oznaka="Opis" vrednost={firma.opis} />
      <div className="grupa-polja">
        <span className="polje-oznaka">Radno vreme</span>
        <Pilule<string> oznaka="Radno vreme" vrednost={vreme} onChange={setVreme} opcije={RADNA_VREMENA.map((v) => ({ v, naziv: v }))} />
      </div>
      <PrikaznoPolje oznaka="Delatnost" vrednost={firma.delatnost} />
      <div className="grupa-polja">
        <span className="polje-oznaka">Slike</span>
        <div className="foto-trake">
          <div className="foto-polje">
            <Ilustracija ikonica="bike" velicina={36} />
          </div>
          <div className="foto-polje">
            <Ilustracija ikonica="dumbbell" velicina={36} />
          </div>
        </div>
        <span className="razlog-neaktivno">Slike su izabrane za demo; ništa se ne šalje.</span>
      </div>
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          onClick={() => {
            promeni((t) => izmeniPoslovno(t, { radnoVreme: Math.max(0, RADNA_VREMENA.findIndex((v) => v === vreme)) }))
            demo.obavesti('Izmene profila firme su sačuvane')
            navigate(l('F4', { firma: ZUPCANIK_ID }))
            window.scrollTo(0, 0)
          }}
        >
          Sačuvaj
        </button>
        <Veza ekran="F4" parametri={{ firma: ZUPCANIK_ID }} className="dugme dugme-tekst">
          Odustani
        </Veza>
      </div>
    </section>
  )
}

export function F7() {
  const { ugao } = useEkran()
  const { s } = useStanjePrice()
  const usluge = FIRME.filter((f) => s.oglasi.some((o) => o.vlasnik === f.id && o.vrsta === 'usluga'))
  const vrste = ['Sve', ...usluge.map((f) => f.delatnost)]
  const [vrsta, setVrsta] = useState('Sve')
  const lista = usluge.filter((f) => vrsta === 'Sve' || f.delatnost === vrsta)
  const smeDaPonudi = ugao === 'ana' || ugao === 'marko'
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="F7">
      <h1>Servisi i zanatlije</h1>
      <p className="pomocni-tekst">Usluga za robu, robu za uslugu, ideju za uslugu…</p>
      <div className="grupa-polja">
        <span className="polje-oznaka">Vrsta usluge</span>
        <Pilule<string> oznaka="Vrsta usluge" vrednost={vrsta} onChange={setVrsta} opcije={vrste.map((v) => ({ v, naziv: v }))} />
      </div>
      <ul className="stog-sm" data-firme>
        {lista.map((f) => {
          const usluga = s.oglasi.find((o) => o.vlasnik === f.id && o.vrsta === 'usluga')!
          return (
            <li key={f.id} className="stavka" data-firma={f.id}>
              <div className="stavka-glavna stog-sm">
                <h2>{f.naziv}</h2>
                <div className="znacke">
                  <Znacka vrsta="firma" />
                </div>
                <p className="pomocni-tekst">
                  {nazivOpstine(f.opstina)} · {f.delatnost}
                </p>
                <p>
                  Usluga: <b>{usluga.naslov}</b> <span className="pomocni-tekst">({KATEGORIJA_PO_ID[usluga.kat].naziv})</span>
                </p>
              </div>
              <div className="stavka-akcije">
                <Veza ekran="F4" parametri={{ firma: f.id }} className="dugme dugme-linija">
                  Profil
                </Veza>
                {smeDaPonudi && (
                  <Veza ekran="X1" parametri={{ oglas: usluga.id }} className="dugme dugme-plavo">
                    Ponudi razmenu
                  </Veza>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {lista.length === 0 && <p className="prazno-stanje">Nema firmi za izabranu vrstu usluge.</p>}
    </section>
  )
}

export function F8() {
  const demo = useDemo()
  const { s, tokovi, promeni } = useStanjePrice()
  const [otkazivanje, setOtkazivanje] = useState(false)
  const plan = s.zupcanik.plan
  const iznos = plan === 'Majstor' ? CENE.pretplataMajstor : CENE.pretplataRadnja
  const otkazana = tokovi.poslovno.otkazana
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="F8">
      <h1>Pretplata</h1>
      <dl className="podaci-oglasa">
        <dt>Plan</dt>
        <dd>
          {plan} · <b className="num">{din(iznos)}</b> mesečno, sa PDV-om <Znacka vrsta="ilustrativno" />
        </dd>
        <dt>Stanje</dt>
        <dd data-stanje-pretplate>{otkazana ? 'Otkazana' : 'Aktivna'}</dd>
        {!otkazana && (
          <>
            <dt>Sledeća naplata</dt>
            <dd data-sledeca-naplata>{datum(DATUM_SLEDECA_NAPLATA)}</dd>
          </>
        )}
      </dl>
      {otkazana && <Obavestenje stanje="upozorenje">Pretplata je otkazana; plan važi do kraja plaćenog perioda. U demou se ništa ne naplaćuje.</Obavestenje>}
      <div className="red-dugmad">
        <Veza ekran="F1" className="dugme dugme-plavo">
          Promeni plan
        </Veza>
        {otkazana ? (
          <button
            type="button"
            className="dugme dugme-zeleno"
            onClick={() => {
              promeni((t) => izmeniPoslovno(t, { otkazana: false }))
              demo.obavesti(PORUKE.simulacija)
            }}
          >
            Obnovi pretplatu
          </button>
        ) : (
          <button type="button" className="dugme dugme-crveno" onClick={() => setOtkazivanje(true)}>
            Otkaži
          </button>
        )}
      </div>
      <section className="stog-sm" aria-label="Istorija računa">
        <h2>Istorija računa (demo)</h2>
        <ul className="stog-sm" data-racuni>
          {ISTORIJA_RACUNA.map((d) => (
            <li key={`${d.m}-${d.d}`} className="stavka">
              <div className="stavka-glavna">
                <b>{datum(d)}</b> · <span className="num">{din(iznos)}</span>
              </div>
              <div className="stavka-akcije">
                <button type="button" className="dugme dugme-linija" onClick={() => demo.obavesti(PORUKE.simulacija)}>
                  Račun (demo)
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {otkazivanje && (
        <Dijalog naslov="Otkazati pretplatu?" onZatvori={() => setOtkazivanje(false)}>
          <p className="mb-4">Ovo je lažni prikaz: ništa se ne otkazuje i ne naplaćuje. U demou se samo menja stanje na ekranu.</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="dugme dugme-crveno"
              onClick={() => {
                promeni((t) => izmeniPoslovno(t, { otkazana: true }))
                setOtkazivanje(false)
                demo.obavesti(PORUKE.simulacija)
              }}
            >
              Da, otkaži
            </button>
            <button type="button" className="dugme dugme-linija" data-prvi-fokus onClick={() => setOtkazivanje(false)}>
              Odustani
            </button>
          </div>
        </Dijalog>
      )}
      <Veza ekran="F3" className="dugme dugme-tekst self-start">
        Tabla firme
      </Veza>
    </section>
  )
}

export function F9() {
  const navigate = useNavigate()
  const l = useLink()
  const { ugao } = useEkran()
  const { tokovi } = useStanjePrice()
  const [odrediste, setOdrediste] = useState<string>(tokovi.poslovno.reklama ?? ODREDISTA_REKLAME[0].v)
  if (ugao !== 'prodavnica') return <OvoRadi ko="prodavnica" naslov="Reklama „Sponzorisano“" opis="Reklamu naručuje firma." nazad={{ ekran: 'P1', naziv: 'Nazad na početnu' }} />
  const firma = FIRMA_PO_ID[ZUPCANIK_ID]
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="F9">
      <h1>Reklama „Sponzorisano“</h1>
      <article className="reklama" data-reklama={ZUPCANIK_ID} aria-label="Pregled reklame">
        <Znacka vrsta="sponzorisano" />
        <div className="reklama-glava">
          <span className="reklama-ikona" aria-hidden>
            <Megaphone size={28} strokeWidth={1.75} />
          </span>
          <div>
            <h2>{odrediste === 'akcija' ? 'Staro za novo' : 'Sportska oprema i bicikli'}</h2> {/* T4-5: h1 → h2 (bez preskakanja nivoa) */}
            <p className="pomocni-tekst">
              Sponzorisano · {firma.naziv}
            </p>
          </div>
        </div>
        <span className="dugme dugme-plavo self-start" aria-hidden>
          Saznaj više
        </span>
      </article>
      <div className="grupa-polja">
        <span className="polje-oznaka">Odredište</span>
        <Pilule<string> oznaka="Odredište reklame" vrednost={odrediste} onChange={setOdrediste} opcije={ODREDISTA_REKLAME.map((o) => ({ v: o.v, naziv: o.naziv }))} />
        <span className="pomocni-tekst">{F9_ODREDISTE_OPIS}</span>
      </div>
      <p data-cena-reklame>
        Trajanje {broj(REKLAMA_DANA)} dana — <b className="num">{din(CENE.reklama7Dana)}</b> sa PDV-om <Znacka vrsta="ilustrativno" />
      </p>
      {tokovi.poslovno.reklama && (
        <Obavestenje stanje="uspeh" uloga="status">
          <b>Reklama je objavljena</b> (plaćeno) i vidi se u desnoj koloni početne strane, uvek sa oznakom „Sponzorisano“. <Veza ekran="P1">Pogledaj početnu</Veza> · <Veza ekran="F3">Tabla firme</Veza>
        </Obavestenje>
      )}
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          onClick={() => {
            navigate(l('Z3', { svrha: 'reklama', ref: odrediste }))
            window.scrollTo(0, 0)
          }}
        >
          {tokovi.poslovno.reklama ? 'Plati novu reklamu' : 'Plati i objavi'}
        </button>
        <Veza ekran="F3" className="dugme dugme-tekst">
          Tabla firme
        </Veza>
      </div>
    </section>
  )
}
