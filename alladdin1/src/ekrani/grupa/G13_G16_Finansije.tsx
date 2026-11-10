// G13 Financial Overview, G15 Fill deadline, G16 Trip pack (koraci 7–9, svi ishodi). Sve brojke iz stanjeGrupe(poz).
import { Download } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, KpiPlocica, OznakaStanja, PraznoStanje, TrakaPartnera18 } from '../../komponente/Kartica'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Dve, Strana } from '../../komponente/Strana'
import { Tabela } from '../../komponente/Tabela'
import { useIdi } from '../../okvir/kontekst'
import { KRAJ_PUTOVANJA, POLAZAK, POVRACAJ_POTVRDJEN_C, ROK_POPUNJENOSTI, ROK_RATE3, ZATVORENO_C } from '../../scenario/datumi'
import { datum, eur, odOd, odOdIli, opsegDatuma, procenat, sedista } from '../../scenario/format'
import { AVANS_GRUPE, BLOK_B, KREDITNA_NOTA_B, NEPLACENO_NA_ROKU, OSLOBODJENO_B, RATA2_PO_PUTNIKU, STANDARD_SOBA_B, TROSKOVI_OBRADE_C, VIP_APARTMANA_U_B, VREDNOST_B, POVRACAJ_UKUPNO_C } from '../../scenario/racun'
import { istorijaTransakcija } from '../../scenario/stanjeGrupe'
import { HOTEL_MACAU, LJUDI, PAKET_MACAU, PREVOZNIK } from '../../scenario/strane'

type RedPrikaz = { opis: string; datum: string; iznos: string; nacin: string; status: string }

export function G13Finansije() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  // istorija dolazi iz scenario/stanjeGrupe.ts (avans je uvek pun iznos; kreditna nota je poseban red)
  const OPIS: Record<string, string> = {
    deposit: 'Group deposit',
    rata2: `Installment 2 — ${sedista(s.rata2Sedista)}`,
    kreditna: 'Credit note (deposit for released seats)',
    rata3: `Final installment — ${sedista(s.rata3Sedista)}`,
  }
  const redovi: RedPrikaz[] = istorijaTransakcija(poz).map((r) => ({ opis: OPIS[r.id], datum: datum(r.datum), iznos: eur(r.iznos), nacin: r.nacin, status: r.status }))
  if (s.povracaj) redovi.push({ opis: 'Refund to the organizer and travelers', datum: s.povracaj.potvrdjen ? datum(POVRACAJ_POTVRDJEN_C) : '—', iznos: eur(s.povracaj.ukupno), nacin: 'Bank transfer', status: s.povracaj.potvrdjen ? 'Confirmed' : 'Processing' })
  const demo = useDemo()
  // ishod C: poslednja rata se ne naplaćuje (grupa otkazana)
  if (s.otkazano && s.avansPrimljen) redovi.push({ opis: 'Final installment', datum: '—', iznos: '—', nacin: '—', status: 'Not charged' })
  // dospeća se računaju iz STVARNO preostalih rata (ne iz konstante za celu grupu); rata 2 i rata 3 su odvojene
  const dospeca = (
    <>
      {s.rata2Ostalo > 0 && <span className="block">Installment 2: {eur(s.rata2Ostalo)} due {datum(ROK_POPUNJENOSTI)}</span>}
      {s.rata3Ostalo > 0 && <span className="block">Installment 3: {eur(s.rata3Ostalo)} due {datum(ROK_RATE3)}</span>}
      {s.rata2Ostalo === 0 && s.rata3Ostalo === 0 && 'Nothing due'}
    </>
  )
  const dugovi = s.neplacenaSedista > 0 ? [{ ime: LJUDI.putnici[0], iznos: eur(RATA2_PO_PUTNIKU), rok: datum(ROK_POPUNJENOSTI) }] : []
  return (
    <Strana naslov={`Financial Overview: ${PAKET_MACAU}`} stanje={s.otkazano ? `placeno-otkazano${s.zatvoreno ? '-zatvoreno' : ''}` : `placeno-${s.procentPlaceno}`} podnaslov={`${opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)} · ${HOTEL_MACAU}`}>
      {!s.prihvacena ? (
        <PraznoStanje>Financial details appear after you accept the quote and the group deposit arrives.</PraznoStanje>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiPlocica oznaka="Total package value" vrednost={s.otkazano ? '—' : eur(s.vrednostBloka)} />
            <KpiPlocica
              oznaka="Total paid"
              vrednost={eur(s.placeno)}
              opis={s.povracaj ? `${s.povracaj.potvrdjen ? 'Refunded' : 'Refund processing'} ${eur(s.povracaj.ukupno)} · Kept ${eur(s.povracaj.zadrzano)}` : `${procenat(s.procentPlaceno)} paid`}
              traka={s.povracaj ? undefined : s.procentPlaceno}
            />
            <KpiPlocica oznaka="Remaining to collect" vrednost={s.otkazano ? '—' : eur(s.preostalo)} opis={s.otkazano ? (s.zatvoreno ? `Closed on ${datum(ZATVORENO_C)}` : 'Group cancelled') : dospeca} />
            <KpiPlocica oznaka="Issued invoices" vrednost={s.fakture} />
          </div>
          <Dve
            levo={
              <>
                {s.otkazano && s.povracaj && (
                  <Kartica naslov="Refunds">
                    <ul className="flex flex-col gap-2 text-ink-2">
                      <li>
                        Refund: <span className="num text-gold-400">{eur(s.povracaj.ukupno)}</span> ({eur(s.povracaj.avansDeo)} of the group deposit + {eur(s.povracaj.putniciDeo)} to travelers)
                      </li>
                      <li>Handling kept: {eur(TROSKOVI_OBRADE_C)}</li>
                      <li>{s.povracaj.potvrdjen ? <OznakaStanja vrsta="ok">Refunds confirmed</OznakaStanja> : <OznakaStanja vrsta="warn">Refunds being processed</OznakaStanja>}</li>
                      {s.zatvoreno && (
                        <li>
                          <OznakaStanja vrsta="neu">Closed</OznakaStanja> <span className="num">{datum(ZATVORENO_C)}</span>
                        </li>
                      )}
                    </ul>
                  </Kartica>
                )}
                <Kartica naslov="Transaction history">
                  {redovi.length === 0 ? (
                    <p className="text-ink-3">No transactions yet.</p>
                  ) : (
                    <Tabela
                      naslov="Transactions"
                      kljuc={(r) => r.opis}
                      redovi={redovi}
                      kolone={[
                        { naslov: 'Transaction', glavna: true, celija: (r) => r.opis },
                        { naslov: 'Date', celija: (r) => r.datum },
                        { naslov: 'Amount', desno: true, celija: (r) => r.iznos },
                        { naslov: 'Method', celija: (r) => r.nacin },
                        { naslov: 'Status', celija: (r) => <OznakaStanja vrsta={r.status === 'Paid' || r.status === 'Confirmed' ? 'ok' : r.status === 'Processing' ? 'warn' : 'neu'}>{r.status}</OznakaStanja> },
                      ]}
                    />
                  )}
                </Kartica>
                <Kartica naslov="Passenger debts">
                  {dugovi.length === 0 ? (
                    <p className="text-ink-3">No open debts.</p>
                  ) : (
                    <>
                      <Tabela
                        naslov="Debts"
                        kljuc={(r) => r.ime}
                        redovi={dugovi}
                        kolone={[
                          { naslov: 'Name', glavna: true, celija: (r) => r.ime },
                          { naslov: 'Amount due', desno: true, celija: (r) => r.iznos },
                          { naslov: 'Deadline', celija: (r) => r.rok },
                          {
                            naslov: 'Action',
                            celija: () => (
                              <Dugme varijanta="secondary" mala onClick={() => demo.obavesti()}>
                                Send reminder
                              </Dugme>
                            ),
                          },
                        ]}
                      />
                      <p className="polje-pomoc mt-2">Showing 1 of {s.neplacenaSedista} unpaid seats (demo sample).</p>
                    </>
                  )}
                </Kartica>
              </>
            }
            desno={
              <>
                <Kartica naslov="Group documents">
                  <div className="flex flex-col items-start gap-3">
                    <Dugme varijanta="secondary" onClick={() => idi('G14')}>
                      Generate group statement
                    </Dugme>
                    <Dugme varijanta="text" onClick={() => demo.obavesti()}>
                      <Download size={16} strokeWidth={1.75} aria-hidden="true" />
                      Download financial data (PDF/CSV)
                    </Dugme>
                    <p className="polje-pomoc">Demo document — not a real invoice.</p>
                  </div>
                </Kartica>
                {poz.korak === 8 && poz.ishod !== 'C' && (
                  <Kartica naslov="Demo event">
                    <RadnjaDugme id="8.sim">Simulate: all final payments arrive</RadnjaDugme>
                  </Kartica>
                )}
                <TrakaPartnera18 />
                {s.kreditnaNota > 0 && <p className="text-ink-2">Credit note {eur(KREDITNA_NOTA_B)} for the deposit of {OSLOBODJENO_B} released seats.</p>}
              </>
            }
          />
        </>
      )}
    </Strana>
  )
}

export function G15Rok() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  const ishod = poz.ishod
  const rano = poz.korak < 7
  const popunjeno = s.rata2Sedista >= s.blokSedista && s.blokSedista > 0
  return (
    <Strana naslov="Fill deadline — result & options" stanje={rano ? 'nije-poceo' : ishod === 'A' ? (s.blokPotvrdjen ? 'potvrdjeno' : popunjeno ? 'popunjeno' : 'otvoreno') : s.izbor === 'none' ? 'izbor' : `izabrano-${s.izbor}`}>
      {rano && !s.prihvacena ? (
        <PraznoStanje>The fill deadline applies once the group reservation is under way.</PraznoStanje>
      ) : (
        <>
          <Kartica>
            <p className="polje-oznaka">Fill deadline: {datum(ROK_POPUNJENOSTI)}</p>
            <p className="num mt-2 font-display text-[34px] leading-10 font-semibold text-gold-400">
              {odOdIli(s.otkazano, s.rata2Sedista, s.blokSedista)} <span className="text-[22px] text-ink-2">{s.otkazano ? 'group cancelled' : 'installment 2 paid'}</span>
            </p>
            {s.neplacenaSedista > 0 && <p className="text-warn">{sedista(s.neplacenaSedista)} open</p>}
          </Kartica>
          {rano ? (
            <PraznoStanje>The deadline is not reached yet. Travelers are still paying installment 2.</PraznoStanje>
          ) : ishod === 'A' ? (
            <Kartica naslov={s.blokPotvrdjen ? 'Block confirmed with partners' : popunjeno ? 'Group filled — awaiting block confirmation' : 'Seats still open'}>
              <ul className="mb-4 flex flex-col gap-2 text-ink-2">
                <li>Installment 2 paid: {odOd(s.rata2Sedista, s.blokSedista)}</li>
                <li>Group deposit received</li>
                <li>Charter operator ({PREVOZNIK}): {s.blokPotvrdjen ? 'confirmed' : 'waiting for your advisor'}</li>
                <li>Resort ({HOTEL_MACAU}): {s.blokPotvrdjen ? 'confirmed' : 'waiting for your advisor'}</li>
              </ul>
              {!popunjeno && <RadnjaDugme id="7.sim">Simulate: the last {NEPLACENO_NA_ROKU} seats are paid on the deadline day</RadnjaDugme>}
              {popunjeno && !s.blokPotvrdjen && <OznakaStanja vrsta="warn">Waiting for your advisor to confirm the block</OznakaStanja>}
              {s.blokPotvrdjen && <OznakaStanja vrsta="ok">Block confirmed</OznakaStanja>}
            </Kartica>
          ) : (
            <>
              {s.izbor === 'none' && !s.opcijePoslate && <p className="text-ink-2">Your advisor is preparing the options.</p>}
              <div className="grid gap-6 md:grid-cols-2">
                <Kartica naslov="Smaller block">
                  <ul className="mb-4 flex flex-col gap-2 text-ink-2">
                    <li>{BLOK_B} seats</li>
                    <li>
                      {STANDARD_SOBA_B} standard rooms + {VIP_APARTMANA_U_B} VIP suites
                    </li>
                    <li>Block value {eur(VREDNOST_B)}</li>
                    <li>Deposit credit {eur(KREDITNA_NOTA_B)} returned</li>
                  </ul>
                  {ishod === 'B' ? (
                    <RadnjaDugme id="7.izbor">Choose this option</RadnjaDugme>
                  ) : (
                    <p className="polje-pomoc">Shown for comparison</p>
                  )}
                </Kartica>
                <Kartica naslov="Cancel with refund">
                  <ul className="mb-4 flex flex-col gap-2 text-ink-2">
                    <li>Refund {eur(POVRACAJ_UKUPNO_C)}</li>
                    <li>Handling {eur(TROSKOVI_OBRADE_C)} (of the {eur(AVANS_GRUPE)} deposit)</li>
                  </ul>
                  {ishod === 'C' ? (
                    <RadnjaDugme id="7.izbor">Choose this option</RadnjaDugme>
                  ) : (
                    <p className="polje-pomoc">Shown for comparison</p>
                  )}
                </Kartica>
              </div>
              {s.izbor !== 'none' && <OznakaStanja vrsta="ok">{s.izbor === 'B' ? 'Smaller block chosen' : 'Cancellation with refund chosen'}</OznakaStanja>}
            </>
          )}
          <TrakaPartnera18 />
          <div>
            <Dugme varijanta="text" onClick={() => idi('G2')}>
              Read the cancellation terms
            </Dugme>
          </div>
        </>
      )}
    </Strana>
  )
}

export function G16Paket() {
  const { s } = useStanje()
  const demo = useDemo()
  const odeljci = ['Itinerary', 'Rooming list', 'Flight manifest', 'Vouchers']
  return (
    <Strana naslov="Trip pack" stanje={s.otkazano ? 'zatvoreno' : s.paketPutovanja} podnaslov={`Departs ${datum(POLAZAK)}`}>
      {s.otkazano ? (
        <PraznoStanje naslov="Closed">This group was cancelled, so there is no trip pack.</PraznoStanje>
      ) : s.paketPutovanja !== 'issued' ? (
        <PraznoStanje naslov={s.paketPutovanja === 'being' ? 'Being prepared' : 'Not started yet'}>Itinerary, rooming list, flight manifest and vouchers will appear here once your advisor issues the trip pack.</PraznoStanje>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {odeljci.map((o) => (
              <Kartica key={o} naslov={o}>
                <p className="mb-3 text-ink-2">{o === 'Rooming list' ? `${s.upisano} of ${s.blokSedista} travelers assigned` : 'Ready.'}</p>
                <Dugme varijanta="secondary" mala onClick={() => demo.obavesti()}>
                  Download
                </Dugme>
              </Kartica>
            ))}
          </div>
          <Kartica naslov="On-trip contact" tiha>
            <p className="text-ink-2">Your advisor {LJUDI.savetnik.ime} · Message · Call</p>
          </Kartica>
          <div>
            <Dugme onClick={() => demo.obavesti()}>Download trip pack</Dugme>
          </div>
        </>
      )}
    </Strana>
  )
}
