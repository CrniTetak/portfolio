// G6 Booking Overview (kuća organizatora) i G7 Group detail. Sve brojke iz tabla(poz) i stanjeGrupe(poz) (UX 8.5).
import { Plus } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { NAZIVI_FAZA } from '../../tekstovi/faze'
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, KpiPlocica, OznakaStanja, PraznoStanje, TrakaTacaka } from '../../komponente/Kartica'
import { Dve, Strana } from '../../komponente/Strana'
import { Tabela } from '../../komponente/Tabela'
import { useIdi } from '../../okvir/kontekst'
import { sledecaRadnja, odradjene } from '../../prica/koraci'
import { GRAND_PRIX_OD, GRAND_PRIX_DO, GRAND_PRIX_RATA2, POLAZAK, KRAJ_PUTOVANJA, ROK_POPUNJENOSTI, ROK_RATE3, VEGAS_DO, VEGAS_OD, VEGAS_RATA2, type Dat } from '../../scenario/datumi'
import { datum, eur, noci, odOd, odOdIli, opsegDatuma } from '../../scenario/format'
import { GRAND_PRIX, NOCI_MACAU, VEGAS } from '../../scenario/racun'
import { tabla, type RedTable } from '../../scenario/stanjeGrupe'
import { PAKET_GRAND_PRIX, PAKET_MACAU, PAKET_VEGAS } from '../../scenario/strane'
import { AKTIVNOST, tekstAkcije } from '../../tekstovi/akcije'
import { NAZIVI_KORAKA } from '../../prica/koraci'

const manje = (a: Dat, b: Dat) => a.y * 10000 + a.m * 100 + a.d - (b.y * 10000 + b.m * 100 + b.d)

const NAZIV: Record<RedTable['id'], string> = { vegas: PAKET_VEGAS, grandPrix: PAKET_GRAND_PRIX, macau: PAKET_MACAU }
const PUTOVANJE = (id: RedTable['id']) =>
  id === 'vegas' ? `${opsegDatuma(VEGAS_OD, VEGAS_DO)} (${noci(VEGAS.noci)})` : id === 'grandPrix' ? `${opsegDatuma(GRAND_PRIX_OD, GRAND_PRIX_DO)} (${noci(GRAND_PRIX.noci)})` : `${opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)} (${noci(NOCI_MACAU)})`

function rokTekst(r: RedTable): { datum: Dat | null; tekst: string } {
  if (r.id === 'vegas') return { datum: VEGAS_RATA2, tekst: `Installment 2 ${eur(r.rok.iznos)} · ${datum(VEGAS_RATA2)}` }
  if (r.id === 'grandPrix') return { datum: GRAND_PRIX_RATA2, tekst: `Installment 2 ${eur(r.rok.iznos)} · ${datum(GRAND_PRIX_RATA2)}` }
  const d = r.rok.datum
  const naziv = { avans: 'Group deposit', popunjenost: 'Installment 2', rata3: 'Final installment', rata2: 'Installment 2', nema: '' }[r.rok.vrsta]
  return { datum: d, tekst: d ? `${naziv} ${eur(r.rok.iznos)} · ${datum(d)}` : 'Nothing due' }
}

export function G6Tabla() {
  const { poz } = useStanje()
  const idi = useIdi()
  const demo = useDemo()
  const t = tabla(poz)
  const rokovi = t.redovi.map(rokTekst).filter((r) => r.datum).sort((a, b) => manje(a.datum!, b.datum!))
  const sledeci = rokovi[0]
  const odr = [...odradjene(poz)]
  const poslednje = odr.slice(-2).reverse()
  return (
    <Strana
      naslov="Booking Overview"
      stanje={`aktivne-${t.aktivne}`}
      akcije={
        <Dugme onClick={() => idi('G1')}>
          <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
          New Group Reservation
        </Dugme>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiPlocica oznaka="Active Bookings" vrednost={t.aktivne} opis="Group reservations in progress" />
        <KpiPlocica oznaka="Enrolled passengers" vrednost={odOd(t.potvrdjeniPutnici, t.ukupnoSedista)} opis="Enrolled / seats" traka={(t.potvrdjeniPutnici * 100) / t.ukupnoSedista} />
        <KpiPlocica oznaka="Remaining to be Charged" vrednost={eur(t.preostaloZaNaplatu)} opis={sledeci ? `Next: ${sledeci.tekst}` : 'Nothing due'} />
        <KpiPlocica oznaka="Action Required" vrednost={t.akcije.length} opis="Items need your attention" />
      </div>
      <Dve
        levo={
          <Kartica naslov="Your group bookings">
            <Tabela
              naslov="Group bookings"
              kljuc={(r) => r.id}
              redovi={t.redovi}
              kolone={[
                { naslov: 'Package name', glavna: true, celija: (r) => NAZIV[r.id] },
                { naslov: 'Travel date', celija: (r) => PUTOVANJE(r.id) },
                { naslov: 'Payment status', celija: (r) => `Paid: ${eur(r.placeno)} / Remaining: ${eur(r.preostalo)}` },
                {
                  naslov: 'Action',
                  celija: (r) =>
                    r.id === 'macau' ? (
                      <Dugme varijanta="secondary" mala onClick={() => idi('G7')}>
                        Manage Group
                      </Dugme>
                    ) : (
                      <Dugme varijanta="text" mala onClick={() => demo.obavesti('Only the Macau group is detailed in this demo')}>
                        Manage Group
                      </Dugme>
                    ),
                },
              ]}
            />
            {t.aktivne === 2 && poz.korak < 4 && <p className="polje-pomoc mt-3">Your Macau request is not a reservation yet. It appears here once you accept the quote.</p>}
          </Kartica>
        }
        desno={
          <>
            <Kartica naslov="Needs your attention">
              <ul className="flex flex-col gap-2">
                {t.akcije.map((a) => (
                  <li key={a.kod + ('n' in a ? a.n : '')} className="flex gap-2 text-ink-2">
                    <OznakaStanja vrsta="warn">Action</OznakaStanja>
                    <span>{tekstAkcije(a)}</span>
                  </li>
                ))}
              </ul>
            </Kartica>
            <Kartica naslov="Recent Activity" tiha>
              {poslednje.length === 0 ? (
                <p className="text-ink-3">Nothing yet.</p>
              ) : (
                <ul className="flex flex-col gap-2 text-ink-2">
                  {poslednje.map((id) => (
                    <li key={id}>{AKTIVNOST[id]}</li>
                  ))}
                </ul>
              )}
            </Kartica>
          </>
        }
      />
    </Strana>
  )
}

export function G7Grupa() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  if (!s.prihvacena)
    return (
      <Strana naslov={`${PAKET_MACAU} · ${opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)}`} stanje="nije-poceo">
        <PraznoStanje>The group reservation starts when you accept the quote. Its progress, deadlines and shortcuts will appear here.</PraznoStanje>
      </Strana>
    )
  if (s.otkazano && s.povracaj)
    return (
      <Strana naslov={PAKET_MACAU} stanje="otkazano">
        <Kartica naslov="Group cancelled">
          <p className="text-ink-2">
            Refund {eur(s.povracaj.ukupno)} ({eur(s.povracaj.avansDeo)} of the group deposit and {eur(s.povracaj.putniciDeo)} to travelers); handling {eur(s.povracaj.zadrzano)} kept.{' '}
            {s.povracaj.potvrdjen ? 'Refunds are confirmed.' : 'Refunds are being processed.'}
          </p>
          <div className="mt-4">
            <Dugme varijanta="secondary" onClick={() => idi('G13')}>
              Open finances
            </Dugme>
          </div>
        </Kartica>
      </Strana>
    )
  const sl = sledecaRadnja(poz)
  return (
    <Strana naslov={`${PAKET_MACAU} · ${opsegDatuma(POLAZAK, KRAJ_PUTOVANJA)}`} stanje={`faza-${s.faza}`} podnaslov={`Overview › ${PAKET_MACAU}`}>
      <Kartica>
        <p className="polje-oznaka mb-3">
          Step {poz.korak} · {NAZIVI_KORAKA[poz.korak - 1]}
          {sl ? '' : ' · complete'}
        </p>
        <TrakaTacaka nazivi={NAZIVI_FAZA} tekuca={s.faza} />
      </Kartica>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiPlocica oznaka="Seats" vrednost={s.otkazano ? '—' : s.blokSedista} />
        <KpiPlocica oznaka="Enrolled" vrednost={odOdIli(s.otkazano, s.upisano, s.blokSedista)} />
        <KpiPlocica oznaka="Installment 2 paid" vrednost={odOdIli(s.otkazano, s.rata2Sedista, s.blokSedista)} />
        <KpiPlocica oznaka="Total paid" vrednost={eur(s.placeno)} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Kartica naslov="Next deadlines">
          <ul className="flex flex-col gap-2 text-ink-2">
            {!s.blokPotvrdjen && s.izbor === 'none' && <li>Fill deadline: {datum(ROK_POPUNJENOSTI)}</li>}
            <li>Final payment: {datum(ROK_RATE3)}</li>
          </ul>
        </Kartica>
        <Kartica naslov="Shortcuts">
          <div className="flex flex-wrap gap-2">
            {[
              ['Passengers', 'G8'],
              ['Finances', 'G13'],
              ['Fill deadline', 'G15'],
              ['Trip pack', 'G16'],
              ['Advisor', 'G17'],
            ].map(([n, e]) => (
              <Dugme key={e} varijanta="secondary" mala onClick={() => idi(e)}>
                {n}
              </Dugme>
            ))}
          </div>
        </Kartica>
      </div>
    </Strana>
  )
}
