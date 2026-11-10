// V1 Advisor desk (kuća savetnika), V2 Inquiry & quote builder, V3 Group tracker, V4 Confirm block / options. Brojke iz stanjeGrupe(poz).
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, KpiPlocica, OznakaStanja, PraznoStanje, RedOrganizatora, TrakaPartnera18, TrakaTacaka } from '../../komponente/Kartica'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Dve, Strana } from '../../komponente/Strana'
import { Tabela } from '../../komponente/Tabela'
import { useIdi } from '../../okvir/kontekst'
import { AKTIVNOST } from '../../tekstovi/akcije'
import { NAZIVI_FAZA } from '../../tekstovi/faze'
import { odradjene } from '../../prica/koraci'
import { KRAJ_PUTOVANJA, POLAZAK, ROK_POPUNJENOSTI, ROK_RATE3 } from '../../scenario/datumi'
import { datum, eur, eurRazlika, odOd, odOdIli, opsegDatuma, procenat, sedista } from '../../scenario/format'
import {
  AVANS_GRUPE,
  AVANS_PROC,
  BLOK_B,
  CENA_V1,
  CENA_V2,
  DODATAK_V2,
  KREDITNA_NOTA_B,
  NEPLACENO_NA_ROKU,
  PONUDA_VAZI_DANA,
  POVRACAJ_UKUPNO_C,
  RATA2_PROC,
  RATA3_PROC,
  SEDISTA,
  STANDARD_SOBA_V2,
  TROSKOVI_OBRADE_C,
  TROSKOVI_OBRADE_PROC,
  VIP_APARTMANA,
  VREDNOST_B,
  GRAND_PRIX,
  VEGAS,
  vrednost,
} from '../../scenario/racun'
import { HOTEL_MACAU, KLUB, LJUDI, PAKET_GRAND_PRIX, PAKET_MACAU, PAKET_VEGAS, PREVOZNIK, REF } from '../../scenario/strane'
import { tabla, type StanjeGrupe } from '../../scenario/stanjeGrupe'


function zaPaznju(s: StanjeGrupe, korak: number, ishod: string): string[] {
  const l: string[] = []
  if (s.upit && s.verzija === 0) l.push(`New inquiry: ${KLUB} — Macau · ${SEDISTA} guests`)
  if (s.izmeneTrazene && s.verzija < 2) l.push('Change request received from the organizer — send quote v2')
  if (s.prihvacena && !s.avansPrimljen) l.push('Reservation waiting for deposit')
  if (s.neplacenaSedista > 0) l.push(`${sedista(s.neplacenaSedista)} unpaid — fill deadline ${datum(ROK_POPUNJENOSTI)}`)
  if (korak === 7 && ishod === 'A' && !s.blokPotvrdjen) l.push('Fill deadline — confirm the block with partners')
  if (korak === 7 && ishod !== 'A' && s.izbor === 'none') l.push('Group not full — send options to the organizer')
  if (korak >= 9 && s.paketPutovanja === 'being' && !s.otkazano) l.push('Send the trip pack to the organizer and travelers')
  return l
}

export function V1Pult() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  const lista = zaPaznju(s, poz.korak, poz.ishod)
  const odr = [...odradjene(poz)].slice(-3).reverse()
  const macauAktivna = s.prihvacena && !s.zatvoreno && !s.otkazano
  const otvoreniUpiti = s.upit && s.verzija === 0 ? 1 : 0
  const gruposi = 2 + (macauAktivna ? 1 : 0)
  const cekaUplatu = s.neplacenaSedista + (poz.korak >= 8 && !s.otkazano ? s.blokSedista - s.rata3Sedista : 0)
  // sledeći rok se izvodi iz iste tabla() kao u G6, za svaku grupu koja ima datum
  const rokZa = (id: 'vegas' | 'grandPrix' | 'macau') => {
    const d = tabla(poz).redovi.find((r) => r.id === id)?.rok.datum
    return d ? datum(d) : '—'
  }
  const redovi = [
    ...(s.upit ? [{ id: 'macau', naziv: `${PAKET_MACAU} (guided story)`, faza: s.faza, rok: rokZa('macau'), placeno: s.prihvacena && !s.otkazano ? odOd(s.rata2Sedista, s.blokSedista) : '—', otvoreno: s.prihvacena && !s.otkazano ? eur(s.preostalo) : '—' }] : []),
    { id: 'vegas', naziv: PAKET_VEGAS, faza: 3, rok: rokZa('vegas'), placeno: odOd(0, VEGAS.sedista), otvoreno: eur(VEGAS.preostalo) },
    { id: 'gp', naziv: PAKET_GRAND_PRIX, faza: 2, rok: rokZa('grandPrix'), placeno: odOd(0, GRAND_PRIX.sedista), otvoreno: eur(GRAND_PRIX.preostalo) },
  ]
  return (
    <Strana naslov={`${LJUDI.savetnik.ime} · Group advisor`} stanje={`pult-${lista.length}`}>
      <Kartica naslov={`Needs your attention (${lista.length})`}>
        {lista.length === 0 ? (
          <p className="text-ink-2" data-bez-upita>
            No new inquiries
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lista.map((t) => (
              <li key={t} className="flex flex-wrap items-start gap-2 text-ink-2">
                <OznakaStanja vrsta="warn">Action</OznakaStanja>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
      </Kartica>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiPlocica oznaka="Open inquiries" vrednost={otvoreniUpiti} />
        <KpiPlocica oznaka="Groups in progress" vrednost={gruposi} />
        <KpiPlocica oznaka="Seats awaiting payment" vrednost={cekaUplatu} />
      </div>
      <Dve
        levo={
          <Kartica naslov="My groups">
            <Tabela
              naslov="My groups"
              kljuc={(r) => r.id}
              redovi={redovi}
              kolone={[
                { naslov: 'Group', glavna: true, celija: (r) => r.naziv },
                { naslov: 'Phase', celija: (r) => <span className="text-[13px]">{NAZIVI_FAZA[r.faza]}</span> },
                { naslov: 'Next deadline', celija: (r) => r.rok },
                { naslov: 'Installment 2 paid', celija: (r) => r.placeno },
                { naslov: 'Open amount', desno: true, celija: (r) => r.otvoreno },
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <Dugme varijanta="secondary" mala onClick={() => idi('V3')}>
                Open the group tracker
              </Dugme>
              {s.upit && (
                <Dugme varijanta="secondary" mala onClick={() => idi('V2')}>
                  Open the inquiry
                </Dugme>
              )}
            </div>
          </Kartica>
        }
        desno={
          <>
            {poz.korak >= 9 && !s.otkazano && (
              <Kartica naslov="Trip pack">
                <RadnjaDugme id="9.paket">Send trip pack</RadnjaDugme>
                {s.paketPutovanja === 'issued' && <p className="mt-3 text-ink-2">Trip pack sent to the organizer and {s.upisano} travelers.</p>}
              </Kartica>
            )}
            <Kartica naslov="Latest activity" tiha>
              {odr.length === 0 ? <p className="text-ink-3">Nothing yet.</p> : <ul className="flex flex-col gap-2 text-ink-2">{odr.map((id) => <li key={id}>{AKTIVNOST[id]}</li>)}</ul>}
            </Kartica>
          </>
        }
      />
    </Strana>
  )
}

export function V2Ponuda() {
  const { s } = useStanje()
  const faza = !s.upit ? 'nema' : s.verzija === 0 ? 'v1-za-slanje' : s.izmeneTrazene ? (s.verzija === 2 ? 'v2-poslata' : 'v2-za-slanje') : 'v1-poslata'
  const cena = s.izmeneTrazene ? CENA_V2 : CENA_V1
  const sobe = s.izmeneTrazene ? `${STANDARD_SOBA_V2} standard + ${VIP_APARTMANA} VIP suites` : `${SEDISTA} standard`
  if (!s.upit)
    return (
      <Strana naslov="Inquiry & quote builder" stanje={faza}>
        <PraznoStanje naslov="No new inquiries">When an organizer sends a quote request it appears here, with a draft quote ready to adjust.</PraznoStanje>
      </Strana>
    )
  return (
    <Strana naslov="Inquiry & quote builder" stanje={faza} podnaslov={`Desk › Inquiry ${REF.upit}`} popunjeno>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr_1fr]">
        <Kartica naslov="Inquiry">
          <div className="flex flex-col gap-3">
            <PrikaznoPolje oznaka="Organizer" vrednost={`${LJUDI.organizator.ime} · ${KLUB}`} />
            <PrikaznoPolje oznaka="Contact" vrednost={LJUDI.organizator.email} />
            <PrikaznoPolje oznaka="Trip" vrednost={`Macau · ${opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)} · ${SEDISTA} guests`} />
            <PrikaznoPolje oznaka="Group type" vrednost="Poker club" />
          </div>
        </Kartica>
        <Kartica naslov="Quote builder">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
            {[
              ['Package', PAKET_MACAU],
              ['Seats', String(SEDISTA)],
              ['Rooms', sobe],
              ['Price per traveler', eur(cena)],
              ['Total', eur(vrednost(cena))],
              ['Payment schedule', `${AVANS_PROC} / ${RATA2_PROC} / ${RATA3_PROC}`],
              ['Quote validity', `${PONUDA_VAZI_DANA} days from issue (example)`],
              ['Cancellation (example terms)', `Before ${datum(ROK_POPUNJENOSTI)}: deposit minus ${procenat(TROSKOVI_OBRADE_PROC)}; traveler payments in full`],
            ].map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-ink-3">{k}</dt>
                <dd className="num">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-col gap-3">
            <TrakaPartnera18 />
            <RedOrganizatora />
          </div>
          <div className="mt-4">
            {faza === 'v1-za-slanje' && <RadnjaDugme id="2.v1">Send quote v1</RadnjaDugme>}
            {faza === 'v1-poslata' && <OznakaStanja vrsta="info">Quote v1 sent — waiting for the organizer</OznakaStanja>}
            {faza === 'v2-za-slanje' && <RadnjaDugme id="3.v2">Send quote v2</RadnjaDugme>}
            {faza === 'v2-poslata' && <OznakaStanja vrsta="ok">Quote v2 sent</OznakaStanja>}
          </div>
        </Kartica>
        <div className="flex flex-col gap-6">
          <Kartica naslov="Version history">
            <ul className="flex flex-col gap-2 text-ink-2">
              <li>{s.verzija >= 1 ? 'v1 — sent' : 'v1 — draft'}</li>
              {s.izmeneTrazene && <li>{s.verzija === 2 ? 'v2 — sent' : 'v2 — draft'}</li>}
              {s.verzija === 2 && <li className="text-[13px]">v2: price per traveler {eurRazlika(DODATAK_V2)}, VIP suites and gala dinner added</li>}
            </ul>
          </Kartica>
          {s.izmeneTrazene && (
            <Kartica naslov="Change request from organizer">
              <ul className="flex flex-col gap-2 text-ink-2">
                <li>Add VIP suites ({VIP_APARTMANA} rooms)</li>
                <li>Add a gala dinner</li>
              </ul>
            </Kartica>
          )}
        </div>
      </div>
    </Strana>
  )
}

export function V3Pracenje() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  if (!s.prihvacena)
    return (
      <Strana naslov={PAKET_MACAU} stanje="nije-poceo">
        <PraznoStanje>The group tracker starts once the organizer accepts the quote. Enrollment, payments and the fill deadline will be tracked here.</PraznoStanje>
      </Strana>
    )
  // avans je uvek pun iznos; u ishodu B kreditna nota je poseban red (isto kao u G13 i G14)
  const placaniAvans = s.avansPrimljen ? AVANS_GRUPE : 0
  const kompletni = s.upisano - s.nepotpuniPodaci
  return (
    <Strana naslov={PAKET_MACAU} stanje={`tracker-${poz.korak}-${poz.n}`} podnaslov={`Fill deadline: ${datum(ROK_POPUNJENOSTI)}`}>
      <div className="grid gap-4 sm:grid-cols-2">
        <KpiPlocica oznaka="Installment 2 paid" vrednost={odOdIli(s.otkazano, s.rata2Sedista, s.blokSedista)} traka={s.blokSedista ? (s.rata2Sedista * 100) / s.blokSedista : 0} />
        <KpiPlocica oznaka="Enrolled" vrednost={odOdIli(s.otkazano, s.upisano, s.blokSedista)} traka={s.blokSedista ? (s.upisano * 100) / s.blokSedista : 0} />
      </div>
      <Dve
        levo={
          <>
            <Kartica naslov="Enrollment">
              <Tabela
                naslov="Enrollment"
                kljuc={(r) => r.k}
                redovi={[
                  { k: 'Complete data', n: kompletni },
                  { k: 'Missing data', n: s.nepotpuniPodaci + s.cekaEmail },
                ]}
                kolone={[
                  { naslov: 'Status', glavna: true, celija: (r) => r.k },
                  { naslov: 'Travelers', desno: true, celija: (r) => r.n },
                ]}
              />
            </Kartica>
            <Kartica naslov="Payments">
              <Tabela
                naslov="Payments"
                kljuc={(r) => r.k}
                redovi={[
                  { k: 'Group deposit', v: eur(placaniAvans) },
                  ...(s.kreditnaNota > 0 ? [{ k: 'Credit note (deposit for released seats)', v: eur(-s.kreditnaNota) }] : []),
                  { k: 'Installment 2', v: s.otkazano ? eur(s.rata2Placeno) : `${eur(s.rata2Placeno)} of ${eur(s.rata2Placeno + s.rata2Ostalo)}` },
                  ...(poz.korak >= 8 ? [{ k: 'Final installment', v: s.otkazano ? 'Not charged' : `${eur(s.rata3Placeno)} of ${eur(s.rata3Placeno + s.rata3Ostalo)}` }] : []),
                ]}
                kolone={[
                  { naslov: 'Payment', glavna: true, celija: (r) => r.k },
                  { naslov: 'Received', desno: true, celija: (r) => r.v },
                ]}
              />
            </Kartica>
          </>
        }
        desno={
          <Kartica naslov="Actions">
            <div className="flex flex-col items-start gap-3">
              {poz.korak <= 4 && <RadnjaDugme id="4.avans">Mark deposit received</RadnjaDugme>}
              {poz.korak >= 5 && poz.korak <= 6 && <RadnjaDugme id="6.podsetnik">Send reminder to unpaid travelers</RadnjaDugme>}
              {poz.korak >= 7 && <Dugme varijanta="secondary" onClick={() => idi('V4')}>Open the fill deadline</Dugme>}
              {poz.korak === 8 && poz.ishod === 'C' && <RadnjaDugme id="8.povracaj">Confirm refunds</RadnjaDugme>}
              {poz.korak === 9 && poz.ishod === 'C' && <RadnjaDugme id="9.zatvori">Close the group</RadnjaDugme>}
              {poz.korak === 8 && poz.ishod !== 'C' && <RadnjaDugme id="8.sim">Simulate: all final payments arrive</RadnjaDugme>}
              {s.zatvoreno && <OznakaStanja vrsta="neu">Group closed</OznakaStanja>}
              {s.povracaj?.potvrdjen && <OznakaStanja vrsta="ok">Refunds confirmed</OznakaStanja>}
            </div>
            <TrakaTacaka className="mt-5" nazivi={NAZIVI_FAZA} tekuca={s.faza} />
            <p className="mt-4 text-[13px] text-ink-3">
              Fill-deadline {datum(ROK_POPUNJENOSTI)} · final payment {datum(ROK_RATE3)} · {HOTEL_MACAU} · {PREVOZNIK}
            </p>
          </Kartica>
        }
      />
      <TrakaPartnera18 />
    </Strana>
  )
}

export function V4Potvrda() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  // potvrda partnera: u A posle "Confirm block"; u B kad je izabran manji blok (potvrda za 96); u C nije potrebna (grupa je otkazana)
  const partneriOk = s.blokPotvrdjen || s.izbor === 'B' || s.otkazano
  const partneriTekst = s.izbor === 'B' ? `Confirmed for the smaller block (${s.blokSedista} seats)` : s.otkazano ? 'Not needed — group cancelled' : s.blokPotvrdjen ? 'Confirmed' : 'Pending'
  const provere = [
    { n: 'Installment 2 paid', ok: s.rata2Sedista >= s.blokSedista && s.blokSedista > 0, tekst: odOdIli(s.otkazano, s.rata2Sedista, s.blokSedista) },
    { n: 'Deposit received', ok: s.avansPrimljen, tekst: s.avansPrimljen ? eur(s.avansPlacen) : 'Waiting' },
    { n: `Charter operator confirmation (${PREVOZNIK})`, ok: partneriOk, tekst: partneriTekst },
    { n: `Resort confirmation (${HOTEL_MACAU})`, ok: partneriOk, tekst: partneriTekst },
  ]
  if (!s.prihvacena)
    return (
      <Strana naslov="Confirm block / options" stanje="nije-poceo">
        <PraznoStanje>This screen is used at the fill deadline, once the group is under way.</PraznoStanje>
      </Strana>
    )
  return (
    <Strana naslov="Confirm block / options" stanje={s.blokPotvrdjen ? 'potvrdjeno' : s.opcijePoslate ? 'opcije-poslate' : 'otvoreno'}>
      <Kartica naslov="Checks">
        <ul className="flex flex-col gap-3">
          {provere.map((p) => (
            <li key={p.n} className="flex flex-wrap items-center justify-between gap-2">
              <span>{p.n}</span>
              <span className="flex items-center gap-2 text-ink-2">
                {p.tekst} {p.ok ? <OznakaStanja vrsta="ok">Done</OznakaStanja> : <OznakaStanja vrsta="warn">Open</OznakaStanja>}
              </span>
            </li>
          ))}
        </ul>
      </Kartica>
      {poz.ishod === 'A' ? (
        <Kartica>
          {poz.korak === 7 && s.rata2Sedista < s.blokSedista && (
            <div className="mb-4">
              <RadnjaDugme id="7.sim">Simulate: the last {NEPLACENO_NA_ROKU} seats are paid on the deadline day</RadnjaDugme>
            </div>
          )}
          <RadnjaDugme id="7.potvrda">Confirm block with partners</RadnjaDugme>
          {s.blokPotvrdjen && (
            <p className="mt-3 flex items-center gap-2">
              <OznakaStanja vrsta="ok">Block confirmed</OznakaStanja> {s.blokSedista} seats · {s.blokSedista} rooms
            </p>
          )}
          <p className="mt-3 text-[13px] text-ink-3">Seats and rooms are contracted with partners only now.</p>
        </Kartica>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2">
            <Kartica naslov="Propose smaller block">
              <ul className="flex flex-col gap-2 text-ink-2">
                <li>{BLOK_B} seats · block value {eur(VREDNOST_B)}</li>
                <li>Deposit credit {eur(KREDITNA_NOTA_B)} returned</li>
              </ul>
            </Kartica>
            <Kartica naslov="Propose cancellation with refund">
              <ul className="flex flex-col gap-2 text-ink-2">
                <li>Refund {eur(POVRACAJ_UKUPNO_C)}</li>
                <li>Handling {eur(TROSKOVI_OBRADE_C)} of the {eur(AVANS_GRUPE)} deposit</li>
              </ul>
            </Kartica>
          </div>
          <div>
            <RadnjaDugme id="7.opcije">Send options to organizer</RadnjaDugme>
          </div>
        </>
      )}
      <TrakaPartnera18 />
      <div>
        <Dugme varijanta="text" onClick={() => idi('V3')}>
          Back to the group tracker
        </Dugme>
      </div>
    </Strana>
  )
}

