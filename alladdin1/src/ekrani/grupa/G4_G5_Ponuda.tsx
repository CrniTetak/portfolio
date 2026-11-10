// G4 Quote & versions (koraci 2–3) i G5 Reserve & group deposit (korak 4). Brojke iz scenario/ (racun.ts, stanjeGrupe.ts).
import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { useSaglasnost } from '../../demo/useSaglasnost'
import { useDemo } from '../../demo/DemoProvider'
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, OznakaStanja, PraznoStanje, RedOrganizatora, TrakaPartnera18 } from '../../komponente/Kartica'
import { Izbor, Kvacica } from '../../komponente/Kontrole'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Dve, Strana } from '../../komponente/Strana'
import { useIdi } from '../../okvir/kontekst'
import { KRAJ_PUTOVANJA, POLAZAK, ROK_AVANSA, ROK_POPUNJENOSTI } from '../../scenario/datumi'
import { datum, eur, eurRazlika, opsegDatuma, procenat } from '../../scenario/format'
import { PONUDA_VAZI_DANA, AVANS_GRUPE, AVANS_PROC, AVANS_PO_PUTNIKU, cenaVerzije, DODATAK_V2, RAZLIKA_V2_UKUPNO, SEDISTA, STANDARD_SOBA_V2, TROSKOVI_OBRADE_PROC, vrednost, vrednostV2, VIP_APARTMANA, avansGrupe } from '../../scenario/racun'
import { DEMO, KORISNIK_NALOG, PAKET_MACAU, REF } from '../../scenario/strane'

export function G4Ponuda() {
  const { s } = useStanje()
  const idi = useIdi()
  const demo = useDemo()
  const [verzija, setVerzija] = useState<1 | 2>(2)
  const najnovija = s.verzija
  // prikaz prati najnoviju verziju kad stigne nova
  useEffect(() => {
    if (najnovija >= 1) setVerzija(najnovija as 1 | 2)
  }, [najnovija])
  const [vip, setVip] = useSaglasnost('g4-vip')
  const [gala, setGala] = useSaglasnost('g4-gala')

  if (najnovija === 0)
    return (
      <Strana naslov={`Quote ${REF.ponuda} · ${PAKET_MACAU}`} stanje={s.upit ? 'ceka-ponudu' : 'nema-upita'}>
        {s.upit ? (
          <PraznoStanje naslov="Waiting for your advisor's quote">Your advisor is preparing version 1 of the quote. You will see it here.</PraznoStanje>
        ) : (
          <PraznoStanje>Send a group quote request first. The quote and its versions will appear here.</PraznoStanje>
        )}
      </Strana>
    )

  const v = Math.min(verzija, najnovija) as 1 | 2
  const cena = cenaVerzije(v)
  return (
    <Strana naslov={`Quote ${REF.ponuda} · ${PAKET_MACAU}`} stanje={`v${najnovija}`}>
      <div className="flex flex-wrap items-center gap-4">
        <Izbor<'1' | '2'>
          oznaka="Quote version"
          opcije={[
            { v: '1', naziv: 'v1' },
            ...(najnovija === 2 ? [{ v: '2' as const, naziv: 'v2' }] : []),
          ]}
          vrednost={String(v) as '1' | '2'}
          onChange={(x) => setVerzija(Number(x) as 1 | 2)}
        />
        {najnovija === 2 ? (
          <OznakaStanja vrsta="ok">{v === 2 ? 'Quote v2 received' : 'v1 superseded'}</OznakaStanja>
        ) : s.izmeneTrazene ? (
          <OznakaStanja vrsta="warn">Changes requested — waiting for v2</OznakaStanja>
        ) : (
          <OznakaStanja vrsta="info">Quote v1 received</OznakaStanja>
        )}
      </div>
      <Dve
        levo={
          <Kartica naslov="Quote details">
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
              {[
                ['Package', PAKET_MACAU],
                ['Dates', opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)],
                ['Seats', String(SEDISTA)],
                ['Rooms', v === 1 ? `${SEDISTA} standard` : `${STANDARD_SOBA_V2} standard + ${VIP_APARTMANA} VIP suites`],
                ['Price per traveler', eur(cena)],
                ['Total', eur(vrednost(cena))],
                [`Group deposit ${procenat(AVANS_PROC)}`, eur(avansGrupe(cena))],
                ['Payment schedule', 'Group deposit at acceptance · Installment 2 on the fill deadline · Installment 3 final'],
                ['Cancellation terms (example terms)', `Before ${datum(ROK_POPUNJENOSTI)}: deposit returned minus ${procenat(TROSKOVI_OBRADE_PROC)}; traveler payments in full`],
                ['Quote validity', `${PONUDA_VAZI_DANA} days from issue (example)`],
              ].map(([k, x]) => (
                <div key={k} className="contents">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="num">{x}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-col gap-3">
              <TrakaPartnera18 />
              <RedOrganizatora />
            </div>
          </Kartica>
        }
        desno={
          <>
            {v === 2 && najnovija === 2 && (
              <Kartica naslov="What changed in v2">
                <ul className="flex flex-col gap-2 text-ink-2">
                  <li>VIP suites added — {VIP_APARTMANA} rooms</li>
                  <li>Gala dinner added</li>
                  <li>Price per traveler {eurRazlika(DODATAK_V2)}</li>
                  <li>Total {eurRazlika(RAZLIKA_V2_UKUPNO)}</li>
                </ul>
              </Kartica>
            )}
            {najnovija === 1 && !s.izmeneTrazene && (
              <Kartica naslov="Request changes">
                <div className="flex flex-col gap-3">
                  <Kvacica oznaka={`Add VIP suites (${VIP_APARTMANA} rooms)`} checked={vip} onChange={setVip} />
                  <Kvacica oznaka="Add a gala dinner" checked={gala} onChange={setGala} />
                  <PrikaznoPolje oznaka="Message" vrednost="Please add VIP suites and a gala dinner for the group." napomena />
                  <RadnjaDugme id="3.izmene" siroko blokirano={!vip && !gala ? 'Choose at least one change' : undefined}>
                    Request changes
                  </RadnjaDugme>
                </div>
              </Kartica>
            )}
            {s.izmeneTrazene && najnovija === 1 && (
              <Kartica naslov="Changes requested">
                <p className="flex items-center gap-2 text-ink-2">
                  <Clock size={16} strokeWidth={1.75} aria-hidden="true" /> Your advisor is preparing quote v2. Every version stays on record.
                </p>
              </Kartica>
            )}
            <div className="flex flex-wrap gap-3">
              {najnovija === 2 ? (
                <Dugme onClick={() => idi('G5')}>Accept quote</Dugme>
              ) : (
                <Dugme disabled opis="">
                  Accept quote
                </Dugme>
              )}
              <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
                Ask your advisor
              </Dugme>
            </div>
            {najnovija === 1 && <p className="polje-pomoc">In this demo, the quote is accepted after one revision (v2).</p>}
          </>
        }
      />
    </Strana>
  )
}

export function G5Rezervacija() {
  const { s } = useStanje()
  const idi = useIdi()
  const [uslovi, setUslovi] = useSaglasnost('g5-uslovi')
  const [punoletni, setPunoletni] = useSaglasnost('g5-18')

  if (s.verzija < 2)
    return (
      <Strana naslov="Reserve & group deposit" stanje="nije-poceo">
        <PraznoStanje>You can reserve once quote v2 has been received. The deposit details will appear here.</PraznoStanje>
      </Strana>
    )
  return (
    <Strana naslov="Reserve & group deposit" popunjeno stanje={s.avansPrimljen ? 'avans-primljen' : s.transferPoslat ? 'ceka-potvrdu' : s.prihvacena ? 'prihvaceno' : 'za-prihvatanje'}>
      <Dve
        levo={
          <Kartica naslov="Review & accept">
            <ul className="mb-4 flex flex-col gap-1.5 text-ink-2">
              <li>{PAKET_MACAU}</li>
              <li>
                {SEDISTA} seats · <span className="num text-gold-400">{eur(vrednostV2)}</span>
              </li>
            </ul>
            <div className="flex flex-col gap-3">
              <Kvacica oznaka="I accept the quote terms and the cancellation terms" checked={uslovi || s.prihvacena} onChange={setUslovi} obavezna disabled={s.prihvacena} />
              <Kvacica oznaka="I confirm all travelers will be 18 or over" checked={punoletni || s.prihvacena} onChange={setPunoletni} obavezna disabled={s.prihvacena} />
            </div>
            <div className="mt-4">
              <RadnjaDugme id="4.prihvati" blokirano={!uslovi || !punoletni ? 'Tick both confirmations to continue' : undefined}>
                Accept quote and get deposit details
              </RadnjaDugme>
            </div>
            <div className="mt-4">
              <RedOrganizatora />
            </div>
          </Kartica>
        }
        desno={
          <Kartica naslov={`Group deposit: ${eur(AVANS_GRUPE)} (${procenat(AVANS_PROC)})`}>
            {!s.prihvacena ? (
              <p className="text-ink-2">Accept the quote to see the deposit details.</p>
            ) : (
              <div className="flex flex-col gap-4">
                <p className="polje-oznaka">Pay by bank transfer</p>
                <PrikaznoPolje oznaka="Beneficiary" vrednost={KORISNIK_NALOG} />
                <PrikaznoPolje oznaka="IBAN" vrednost={DEMO.iban} />
                <PrikaznoPolje oznaka="Reference" vrednost={REF.ponuda} />
                <p className="text-ink-2">Due by {datum(ROK_AVANSA)}</p>
                <p className="text-[13px] text-ink-3">That is {eur(AVANS_PO_PUTNIKU)} per seat. Demo — no card is charged, nothing is sent.</p>
                <RadnjaDugme id="4.transfer">I have sent the transfer</RadnjaDugme>
                {s.transferPoslat && !s.avansPrimljen && <OznakaStanja vrsta="warn">Waiting for confirmation</OznakaStanja>}
                {s.avansPrimljen && <OznakaStanja vrsta="ok">Deposit received — seats and rooms are on option until {datum(ROK_POPUNJENOSTI)}</OznakaStanja>}
              </div>
            )}
            <p className="mt-4 text-[13px] text-ink-3">Seats and rooms are contracted with our partners only when the group is full (see fill deadline).</p>
            {s.avansPrimljen && (
              <div className="mt-4">
                <Dugme varijanta="secondary" onClick={() => idi('G7')}>
                  Go to the group
                </Dugme>
              </div>
            )}
          </Kartica>
        }
      />
    </Strana>
  )
}
