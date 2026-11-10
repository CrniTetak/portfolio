// Q1–Q6 VIP konsijerž (slobodni tok): naši savetnici (ne marketplace), profil, zahtev, ponuda (šalje je savetnik u V5), demo plaćanje, potvrda.
import { Check } from 'lucide-react'
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Inicijali, Kartica, OznakaStanja, PraznoStanje, RedOrganizatora } from '../../komponente/Kartica'
import { Kvacica } from '../../komponente/Kontrole'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Dve, Potvrda, Strana } from '../../komponente/Strana'
import { TokDugme } from '../../komponente/TokDugme'
import { useIdi } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { GALA } from '../../scenario/datumi'
import { datum, eur, eurDec } from '../../scenario/format'
import { KONSIJERZ, konsijerzUkupno } from '../../scenario/ponude'
import { PONUDA_VAZI_DANA } from '../../scenario/racun'
import { DEMO, GALA_NAZIV, REF, REF_TOKOVI, SAVETNICI_KONSIJERZA } from '../../scenario/strane'
import { BEZ_FAJLA, FILTERI_ILUSTRACIJA, KONSIJERZ_USLUGE, OCENE_UZORAK } from '../../tekstovi/tokovi'
import { napreduj, odbij } from '../../tokovi/tokovi'

export function Q1Savetnici() {
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana naslov="VIP Concierge — your personal advisor" stanje="savetnici">
      <Dve
        levo={
          <>
            <Kartica naslov="Find your advisor">
              <div className="grid gap-4 md:grid-cols-2">
                <PrikaznoPolje oznaka="Specialty" vrednost="Any specialty" />
                <PrikaznoPolje oznaka="Languages" vrednost="Any language" />
              </div>
              <div className="mt-4">
                <Dugme varijanta="secondary" onClick={() => demo.obavesti(FILTERI_ILUSTRACIJA)}>
                  Search
                </Dugme>
              </div>
            </Kartica>
            <div className="grid gap-4 md:grid-cols-3">
              {SAVETNICI_KONSIJERZA.map((s, i) => (
                <Kartica key={s.ime}>
                  <div className="flex flex-col items-start gap-2">
                    <Inicijali tekst={s.inicijali} />
                    <p className="font-display text-[22px] leading-7 font-semibold">{s.ime}</p>
                    <p className="text-ink-2">AllAddIn1 Advisor</p>
                    <Dugme
                      varijanta="secondary"
                      mala
                      onClick={() => {
                        demo.promeniTokove((t) => ({ ...t, savetnik: i }))
                        idi('Q2')
                      }}
                    >
                      View profile
                    </Dugme>
                  </div>
                </Kartica>
              ))}
            </div>
            <p className="text-[13px] text-ink-3">Our advisors are AllAddIn1 team members.</p>
          </>
        }
        desno={
          <Kartica naslov="Concierge services">
            <ul className="mb-4 flex flex-col gap-2 text-ink-2">
              {KONSIJERZ_USLUGE.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
            <Dugme siroko onClick={() => idi('Q3')}>
              Request a consultation
            </Dugme>
          </Kartica>
        }
      />
    </Strana>
  )
}

export function Q2Profil() {
  const demo = useDemo()
  const idi = useIdi()
  const s = SAVETNICI_KONSIJERZA[demo.tokovi.savetnik]
  return (
    <Strana naslov={s.ime} stanje="profil" podnaslov="Your advisor">
      <Inicijali tekst={s.inicijali} />
      <div className="grid gap-6 md:grid-cols-2">
        <Kartica naslov="Services & specialization">
          <p className="text-ink-2">
            {s.specijalnost}. Languages: {s.jezici}.
          </p>
        </Kartica>
        <Kartica naslov="About me">
          <p className="text-ink-2">I plan trips and events around what matters to you: the right stay, the right people, and no loose ends.</p>
        </Kartica>
        <Kartica naslov="Sample ratings and comments — demo">
          <ul className="flex flex-col gap-2 text-ink-2">
            {OCENE_UZORAK.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Kartica>
      </div>
      <div className="flex flex-wrap gap-3">
        <Dugme onClick={() => idi('Q3')}>Request this advisor</Dugme>
        <Dugme varijanta="secondary" onClick={() => demo.otvoriPoruku(true)}>
          Message advisor
        </Dugme>
      </div>
    </Strana>
  )
}

export function Q3Zahtev() {
  const demo = useDemo()
  const s = SAVETNICI_KONSIJERZA[demo.tokovi.savetnik]
  return (
    <Strana naslov="Request your advisor's service" stanje="zahtev" popunjeno>
      <Kartica>
        <div className="grid gap-4 md:grid-cols-2">
          <PrikaznoPolje oznaka="Advisor" vrednost={s.ime} />
          <PrikaznoPolje oznaka="Service" vrednost="Event organisation" />
          <PrikaznoPolje oznaka="Event" vrednost={GALA_NAZIV} />
          <PrikaznoPolje oznaka="Date" vrednost={datum(GALA)} />
          <PrikaznoPolje oznaka="Guests" vrednost={String(KONSIJERZ.gostiju)} />
          <PrikaznoPolje oznaka="Notes" vrednost="A table for four and a late check-out" />
        </div>
        <div className="mt-5">
          <TokDugme primeni={(t) => napreduj(t, 'konsijerz', 'zatrazeno')} nakon={(u) => link('Q4', u)}>
            Send request
          </TokDugme>
        </div>
      </Kartica>
    </Strana>
  )
}

export function Q4Ponuda() {
  const demo = useDemo()
  const t = demo.tokovi
  if (t.konsijerz === 'none')
    return (
      <Strana naslov="Your advisor's offer" stanje="nije-poceo">
        <PraznoStanje>Send a request first. Your advisor's offer will appear here.</PraznoStanje>
      </Strana>
    )
  if (t.konsijerz === 'zatrazeno')
    return (
      <Strana naslov="Your advisor's offer" stanje="ceka">
        <PraznoStanje naslov="Waiting for your advisor's offer">Your advisor is preparing an offer for your request ({REF.zahtev3}).</PraznoStanje>
        <div>
          <TokDugme varijanta="secondary" primeni={(x) => napreduj(x, 'konsijerz', 'ponuda')} nakon={(u) => link('Q4', u)}>
            Demo shortcut: advisor replies now
          </TokDugme>
        </div>
      </Strana>
    )
  if (t.konsijerz === 'odbijeno')
    return (
      <Strana naslov="Your advisor's offer" stanje="odbijeno">
        <Kartica>
          <OznakaStanja vrsta="neu">Declined</OznakaStanja>
          <p className="mt-3 text-ink-2">You declined this offer. Nothing was charged.</p>
          <div className="mt-4">
            <RedOrganizatora />
          </div>
        </Kartica>
      </Strana>
    )
  return (
    <Strana naslov="Your advisor's offer" stanje={t.konsijerz}>
      <Kartica naslov={`${GALA_NAZIV} — ${datum(GALA)}`}>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-ink-2">
          <dt>Gala package</dt>
          <dd className="num">{eur(KONSIJERZ.galaPaket)}</dd>
          <dt>Additional services & taxes</dt>
          <dd className="num">{eur(KONSIJERZ.partneriITakse)}</dd>
          <dt className="font-semibold text-ink">Total</dt>
          <dd className="num font-semibold text-gold-400">{eur(konsijerzUkupno)}</dd>
        </dl>
        <p className="mt-3 text-ink-2">Quote validity: {PONUDA_VAZI_DANA} days (example)</p>
        <div className="mt-4 flex flex-wrap items-start gap-3">
          <TokDugme primeni={(x) => napreduj(x, 'konsijerz', 'prihvaceno')} nakon={(u) => link('Q5', u)}>
            Accept offer
          </TokDugme>
          <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
            Ask a question
          </Dugme>
          <TokDugme varijanta="danger" primeni={(x) => odbij(x, 'konsijerz')} nakon={(u) => link('Q4', u)}>
            Decline
          </TokDugme>
        </div>
        <div className="mt-4">
          <RedOrganizatora />
        </div>
      </Kartica>
    </Strana>
  )
}

export function Q5Placanje() {
  const demo = useDemo()
  const [uslovi, setUslovi] = useState(false)
  const t = demo.tokovi
  if (t.konsijerz !== 'prihvaceno' && t.konsijerz !== 'placeno')
    return (
      <Strana naslov="Finalize payment" stanje="nije-poceo">
        <PraznoStanje>Accept your advisor's offer first. The payment summary will appear here.</PraznoStanje>
      </Strana>
    )
  const s = SAVETNICI_KONSIJERZA[t.savetnik]
  return (
    <Strana naslov="Finalize payment" stanje={t.konsijerz} popunjeno>
      <Dve
        levo={
          <Kartica>
            <div className="flex items-center gap-4">
              <Inicijali tekst={s.inicijali} />
              <div>
                <p className="font-semibold">{s.ime}</p>
                <p className="text-ink-2">AllAddIn1 Advisor</p>
              </div>
            </div>
          </Kartica>
        }
        desno={
          <Kartica naslov="Payment (demo)">
            <dl className="mb-4 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-ink-2">
              <dt>Event</dt>
              <dd>{GALA_NAZIV}</dd>
              <dt>Gala package</dt>
              <dd className="num">{eurDec(KONSIJERZ.galaPaket)}</dd>
              <dt>Additional services & taxes</dt>
              <dd className="num">{eurDec(KONSIJERZ.partneriITakse)}</dd>
              <dt className="font-semibold text-ink">Total due</dt>
              <dd className="num font-semibold text-gold-400">{eurDec(konsijerzUkupno)}</dd>
            </dl>
            <div className="flex flex-col gap-3">
              <PrikaznoPolje oznaka="Card" vrednost={DEMO.kartica} />
              <p className="text-[13px] text-ink-3">Demo — no card is charged, nothing is sent</p>
              <Kvacica oznaka="I agree to the payment terms" checked={uslovi} onChange={setUslovi} obavezna />
              <TokDugme primeni={(x) => napreduj(x, 'konsijerz', 'placeno')} nakon={(u) => link('Q6', u)} blokirano={!uslovi ? 'Tick the payment terms to continue' : undefined} siroko>
                Finalize payment — {eurDec(konsijerzUkupno)}
              </TokDugme>
              <RedOrganizatora />
            </div>
          </Kartica>
        }
      />
    </Strana>
  )
}

export function Q6Potvrda() {
  const demo = useDemo()
  const t = demo.tokovi
  if (t.konsijerz !== 'placeno')
    return (
      <Strana naslov="Reservation confirmed" stanje="nije-poceo">
        <PraznoStanje>Your reservation appears here once the payment is complete.</PraznoStanje>
      </Strana>
    )
  const s = SAVETNICI_KONSIJERZA[t.savetnik]
  return (
    <Strana stanje="potvrdjeno">
      <Kartica className="mx-auto w-full max-w-2xl">
        <Potvrda naslov="Thank you — your reservation is confirmed!" ikona={<Check size={36} strokeWidth={2} className="text-ok" aria-hidden="true" />}>
          <p className="text-ink-2">Advisor: {s.ime}</p>
          <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-ink-2">
            <dt>Transaction</dt>
            <dd className="num">{REF_TOKOVI.konsijerz}</dd>
            <dt>Amount</dt>
            <dd className="num">{eurDec(konsijerzUkupno)}</dd>
            <dt>Method</dt>
            <dd>Card (demo)</dd>
            <dt>Event</dt>
            <dd>
              {GALA_NAZIV}, {datum(GALA)}
            </dd>
          </dl>
          <p>Your advisor will be in touch.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Dugme varijanta="secondary" onClick={() => demo.obavesti(BEZ_FAJLA)}>
              Download
            </Dugme>
            <Dugme varijanta="secondary" onClick={() => demo.obavesti(BEZ_FAJLA)}>
              Send to e-mail
            </Dugme>
          </div>
          <RedOrganizatora />
        </Potvrda>
      </Kartica>
    </Strana>
  )
}
