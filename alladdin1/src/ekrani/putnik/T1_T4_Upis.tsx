// T1 Join group, T2 Consents, T3 Payment plan & pay, T4 You're enrolled (korak 5; T3 i kasnije plaćanje rata u koracima 6 i 8).
// Svi lični podaci su statičan tekst (demo vrednosti), nikad polja za kucanje.
import { useState } from 'react'
import { Check } from 'lucide-react'
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, OznakaStanja, PraznoStanje, RedOrganizatora } from '../../komponente/Kartica'
import { Izbor, Kvacica } from '../../komponente/Kontrole'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Potvrda, Strana } from '../../komponente/Strana'
import { useSaglasnost } from '../../demo/useSaglasnost'
import { useDemo } from '../../demo/DemoProvider'
import { useIdi } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { KRAJ_PUTOVANJA, POLAZAK, ROK_POPUNJENOSTI, ROK_RATE3 } from '../../scenario/datumi'
import { datum, eur, opsegDatuma } from '../../scenario/format'
import { AVANS_PO_PUTNIKU, CENA_V2, RATA2_PO_PUTNIKU, RATA3_PO_PUTNIKU } from '../../scenario/racun'
import { DEMO, KLUB, LJUDI, PAKET_MACAU } from '../../scenario/strane'

function Zaglavlje3({ korak }: { korak: number }) {
  return (
    <p className="polje-oznaka" data-korak-upisa>
      Step {korak} of 3
    </p>
  )
}

export function T1Podaci() {
  return (
    <Strana naslov={`Join ${PAKET_MACAU}`} stanje="upis-1" akcije={<Zaglavlje3 korak={1} />} popunjeno>
      <Kartica naslov="The trip">
        <p className="text-ink-2">
          Organizer {KLUB} ({LJUDI.organizator.ime}) · {opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)} · Macau
        </p>
      </Kartica>
      <Kartica naslov="Your details">
        <div className="grid gap-4 md:grid-cols-2">
          <PrikaznoPolje oznaka="Full name" vrednost={LJUDI.putnik.ime} />
          <PrikaznoPolje oznaka="E-mail" vrednost={LJUDI.putnik.email} />
          <PrikaznoPolje oznaka="Phone" vrednost={LJUDI.putnik.telefon} />
          <PrikaznoPolje oznaka="Date of birth" vrednost={datum(DEMO.rodjenje)} />
          <PrikaznoPolje oznaka="Passport number" vrednost={DEMO.pasos} />
          <PrikaznoPolje oznaka="Nationality" vrednost={DEMO.drzavljanstvo} />
          <PrikaznoPolje oznaka="Room" vrednost="VIP suite" />
          <PrikaznoPolje oznaka="Meal" vrednost="No preference" />
          <PrikaznoPolje oznaka="Allergies (optional)" vrednost="None" />
        </div>
        <div className="mt-5">
          <RadnjaDugme id="5.upis1" nakon={(u) => link('T2', u)}>
            Continue
          </RadnjaDugme>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">Your details go to your trip organizer and AllAddIn1 only to arrange this trip.</p>
      </Kartica>
    </Strana>
  )
}

export function T2Saglasnosti() {
  const [a, setA] = useSaglasnost('t2-uslovi')
  const [b, setB] = useSaglasnost('t2-pasos')
  const [c, setC] = useState(false) // opciono (alergije): prazno i nije uslov
  const [d, setD] = useSaglasnost('t2-18')
  const [e, setE] = useState(false) // opciono (marketing)
  const nedostaje = !a || !b || !d
  return (
    <Strana naslov="Consents" stanje="upis-2" akcije={<Zaglavlje3 korak={2} />}>
      <Kartica>
        <div className="flex flex-col gap-4">
          <Kvacica oznaka="I accept the Terms & Conditions" checked={a} onChange={setA} obavezna />
          <Kvacica oznaka="I consent to AllAddIn1 processing my passport details to arrange travel" checked={b} onChange={setB} obavezna />
          <Kvacica oznaka="I consent to processing my allergy and dietary information (optional)" checked={c} onChange={setC} />
          <Kvacica oznaka="I confirm I am 18 or over" checked={d} onChange={setD} obavezna />
          <Kvacica oznaka="Send me information about offers and events" checked={e} onChange={setE} />
        </div>
        <div className="mt-5">
          <RadnjaDugme id="5.upis2" nakon={(u) => link('T3', u)} blokirano={nedostaje ? 'Tick the required consents to continue' : undefined}>
            I agree and continue
          </RadnjaDugme>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">You can withdraw a consent at any time. Withdrawing may mean we can no longer arrange your trip.</p>
      </Kartica>
    </Strana>
  )
}

export function T3Placanje() {
  const { s } = useStanje()
  const demo = useDemo()
  const idi = useIdi()
  const [nacin, setNacin] = useState<'card' | 'bank'>('card')
  const upisan = s.marko.upisan
  const rata2 = s.marko.rata2Placena
  const rata3 = s.marko.rata3Placena
  const pri = !upisan
  const naslovR = pri ? 'Your payment plan' : !rata2 ? 'Pay installment 2' : !rata3 ? 'Pay installment 3' : 'Your payment plan'
  const placaSe = !pri && !rata3
  const id = !rata2 ? '6.rata2' : '8.rata3'
  const [uslovi, setUslovi] = useSaglasnost('t3-' + id)
  const iznos = !rata2 ? RATA2_PO_PUTNIKU : RATA3_PO_PUTNIKU
  if (s.otkazano)
    return (
      <Strana naslov="Group cancelled" stanje="otkazano">
        <Kartica>
          <p className="text-ink-2">
            {s.povracaj?.potvrdjen ? `Your refund of ${eur(s.marko.povracaj)} is confirmed.` : `Your refund of ${eur(s.marko.povracaj)} is being processed.`} No further payments are due.
          </p>
          <div className="mt-4">
            <Dugme varijanta="secondary" onClick={() => idi('T6')}>
              Back to my seat
            </Dugme>
          </div>
          <div className="mt-3">
            <RedOrganizatora />
          </div>
        </Kartica>
      </Strana>
    )
  return (
    <Strana
      popunjeno
      naslov={`${naslovR} — ${placaSe ? eur(iznos) : eur(CENA_V2)}`}
      stanje={pri ? 'upis-3' : rata3 ? 'placeno-sve' : rata2 ? 'rata-3' : 'rata-2'}
      akcije={pri ? <Zaglavlje3 korak={3} /> : undefined}
    >
      <Kartica naslov="Your payment plan">
        <ul className="flex flex-col gap-3">
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>Group deposit credit {eur(AVANS_PO_PUTNIKU)} — paid by your organizer</span>
            <OznakaStanja vrsta="ok">Paid</OznakaStanja>
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Installment 2 {eur(RATA2_PO_PUTNIKU)} — due {datum(ROK_POPUNJENOSTI)}
            </span>
            {rata2 ? <OznakaStanja vrsta="ok">Paid</OznakaStanja> : <OznakaStanja vrsta="warn">Due</OznakaStanja>}
          </li>
          <li className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Installment 3 {eur(RATA3_PO_PUTNIKU)} — due {datum(ROK_RATE3)}
            </span>
            {rata3 ? <OznakaStanja vrsta="ok">Paid</OznakaStanja> : <OznakaStanja vrsta="neu">Open</OznakaStanja>}
          </li>
        </ul>
      </Kartica>
      {pri ? (
        <Kartica>
          <p className="mb-4 text-ink-2">You can pay installments later, from your trip page.</p>
          <div className="flex flex-wrap gap-3">
            <RadnjaDugme id="5.upis3" nakon={(u) => link('T4', u)}>
              Continue — I'll pay later
            </RadnjaDugme>
            <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
              Pay {eur(RATA2_PO_PUTNIKU)} in advance
            </Dugme>
          </div>
          <div className="mt-4">
            <RedOrganizatora />
          </div>
        </Kartica>
      ) : rata3 ? (
        <PraznoStanje naslov="Paid in full">Everything is paid. Thank you.</PraznoStanje>
      ) : (
        <Kartica naslov={naslovR}>
          <div className="flex flex-col gap-4">
            <Izbor<'card' | 'bank'>
              oznaka="Payment method"
              vrednost={nacin}
              onChange={setNacin}
              opcije={[
                { v: 'card', naziv: 'Card' },
                { v: 'bank', naziv: 'Bank transfer' },
              ]}
            />
            {nacin === 'card' ? <PrikaznoPolje oznaka="Card" vrednost={DEMO.kartica} /> : <PrikaznoPolje oznaka="IBAN" vrednost={DEMO.iban} />}
            <p className="text-[13px] text-ink-3">Demo — no card is charged, nothing is sent</p>
            <Kvacica oznaka="I agree to the payment terms" checked={uslovi} onChange={setUslovi} obavezna />
            <RadnjaDugme id={id} nakon={(u) => link('T6', u)} blokirano={!uslovi ? 'Tick the payment terms to continue' : undefined}>
              Pay {eur(iznos)}
            </RadnjaDugme>
            <RedOrganizatora />
          </div>
        </Kartica>
      )}
      {!pri && (
        <div>
          <Dugme varijanta="text" onClick={() => idi('T6')}>
            Back to my seat
          </Dugme>
        </div>
      )}
    </Strana>
  )
}

export function T4Upisan() {
  const { s } = useStanje()
  const idi = useIdi()
  if (!s.marko.upisan)
    return (
      <Strana naslov="You're enrolled" stanje="nije-poceo">
        <PraznoStanje>Finish the three enrollment steps and your confirmation will appear here.</PraznoStanje>
        <div>
          <Dugme varijanta="secondary" onClick={() => idi('T1')}>
            Start with step 1
          </Dugme>
        </div>
      </Strana>
    )
  return (
    <Strana stanje="upisan">
      <Kartica className="mx-auto w-full max-w-2xl">
        <Potvrda naslov={`You're in — ${PAKET_MACAU}`} ikona={<Check size={36} strokeWidth={2} className="text-ok" aria-hidden="true" />}>
          <ul className="flex flex-col gap-1 text-ink-2">
            <li>{opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)}</li>
            <li>Room: VIP suite</li>
            <li>
              Your plan: {eur(CENA_V2)} — next due {eur(RATA2_PO_PUTNIKU)} on {datum(ROK_POPUNJENOSTI)}
            </li>
          </ul>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Dugme onClick={() => idi('T6')}>Go to my trip</Dugme>
            <Dugme varijanta="secondary" onClick={() => idi('S2')}>
              Back to home
            </Dugme>
          </div>
        </Potvrda>
      </Kartica>
    </Strana>
  )
}
