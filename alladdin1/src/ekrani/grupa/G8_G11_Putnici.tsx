// G8 Passenger Management, G9 Import passengers, G11 Self-entry link (korak 5–6). Spisak i statusi iz statusiPutnika(poz).
import { Upload, UserPlus, Link2 } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { useStanje } from '../../demo/useStanje'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, OznakaStanja, PraznoStanje, TrakaPartnera18 } from '../../komponente/Kartica'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Dve, Strana } from '../../komponente/Strana'
import { Tabela } from '../../komponente/Tabela'
import { useIdi } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { LINK_VAZI_DO, POLAZAK } from '../../scenario/datumi'
import { datum, eur, odOdIli } from '../../scenario/format'
import { SEDISTA, UPIS } from '../../scenario/racun'
import { SPISAK_PUTNIKA } from '../../scenario/putnici'
import { statusiPutnika, type RedStatusa, type StatusKod } from '../../scenario/stanjeGrupe'
import { DEMO, HOTEL_MACAU, LJUDI, PAKET_MACAU } from '../../scenario/strane'
import { useDemoImena } from './imena'

function Status({ r }: { r: RedStatusa }) {
  const mapa: Record<StatusKod, [Parameters<typeof OznakaStanja>[0]['vrsta'], string]> = {
    missing: ['warn', 'Missing e-mail'],
    covered: ['info', 'Covered by group deposit'],
    paid: ['ok', `Paid ${eur(r.iznos)}`],
    due: ['warn', `Due ${eur(r.iznos)}`],
    paid_full: ['ok', 'Paid in full'],
    released: ['neu', 'Seat released'],
    refund: ['neu', `Refunded ${eur(r.iznos)}`],
    cancelled: ['neu', 'Cancelled'],
  }
  const [vrsta, tekst] = mapa[r.kod]
  return <OznakaStanja vrsta={vrsta}>{tekst}</OznakaStanja>
}

export function G8Putnici() {
  const { poz, s } = useStanje()
  const idi = useIdi()
  const demo = useDemo()
  const imena = useDemoImena()
  const redovi = statusiPutnika(poz, imena)
  const soba = (ime: string) => SPISAK_PUTNIKA.find((p) => p.ime === ime)!
  return (
    <Strana naslov={`Passenger Enrollment: ${PAKET_MACAU}`} stanje={`upisano-${s.upisano}`} popunjeno podnaslov={`Group: ${odOdIli(s.otkazano, s.upisano, s.blokSedista)} enrolled${s.pozivnicePoslate > 0 ? ` · ${s.pozivnicePoslate} invitations sent` : ''} · Date: ${datum(POLAZAK)} · Hotel: ${HOTEL_MACAU}`}>
      <div className="flex flex-wrap gap-3">
        <Dugme onClick={() => idi('G9')}>
          <Upload size={18} strokeWidth={1.75} aria-hidden="true" />
          Upload passengers
        </Dugme>
        <Dugme varijanta="secondary" onClick={() => idi('G10')}>
          <UserPlus size={18} strokeWidth={1.75} aria-hidden="true" />
          Add passenger
        </Dugme>
        <Dugme varijanta="secondary" onClick={() => idi('G11')}>
          <Link2 size={18} strokeWidth={1.75} aria-hidden="true" />
          Generate self-entry link
        </Dugme>
      </div>
      <Dve
        levo={
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <PrikaznoPolje oznaka="Search" vrednost="Search by name" />
              <PrikaznoPolje oznaka="Passengers" vrednost="All passengers" />
              <PrikaznoPolje oznaka="Data" vrednost="All data" />
              <PrikaznoPolje oznaka="Room" vrednost="Any room" />
            </div>
            <p className="polje-pomoc">Filters are for illustration.</p>
            {s.otkazano ? (
              <PraznoStanje naslov="Group cancelled">This group was cancelled, so there are no enrolled travelers.</PraznoStanje>
            ) : redovi.length === 0 ? (
              <PraznoStanje>No travelers yet. Import a list or share the self-entry link, and they will appear here.</PraznoStanje>
            ) : (
              <>
                <Tabela
                  naslov="Passengers"
                  kljuc={(r) => r.ime}
                  redovi={redovi}
                  kolone={[
                    { naslov: 'Full name', glavna: true, celija: (r) => r.ime },
                    { naslov: 'Payment status', celija: (r) => <Status r={r} /> },
                    { naslov: 'Room', celija: (r) => soba(r.ime).soba },
                    { naslov: 'Special requests', celija: (r) => soba(r.ime).zahtev },
                    {
                      naslov: 'Action',
                      celija: (r) => (
                        <span className="flex flex-wrap gap-2">
                          {r.ime === imena.marko ? (
                            <Dugme varijanta="text" mala onClick={() => idi('G12')}>
                              View profile / Edit
                            </Dugme>
                          ) : (
                            <span className="text-ink-3">Record shown for the demo traveler only</span>
                          )}
                          {r.kod === 'due' && (
                            <Dugme varijanta="secondary" mala onClick={() => demo.obavesti()}>
                              Send reminder
                            </Dugme>
                          )}
                        </span>
                      ),
                    },
                  ]}
                />
                <p className="polje-pomoc">
                  Showing {redovi.length} of {s.upisano}
                  {s.cekaEmail > 0 ? ` · ${s.cekaEmail} rows still need an e-mail address` : ''}
                </p>
              </>
            )}
          </>
        }
        desno={
          <>
          <TrakaPartnera18 />
          <Kartica naslov="Communication Center">
            <div className="flex flex-col items-start gap-3">
              <RadnjaDugme id="6.podsetnik">Send mass reminder</RadnjaDugme>
              <Dugme varijanta="secondary" onClick={() => idi('G17')}>
                Contact your advisor
              </Dugme>
            </div>
          </Kartica>
          </>
        }
      />
    </Strana>
  )
}

export function G9Uvoz() {
  const { s } = useStanje()
  const idi = useIdi()
  const demo = useDemo()
  const gotovo = s.upisano > 0
  const prvaTri = [LJUDI.putnici[1], LJUDI.putnici[2], LJUDI.putnici[0]]
  return (
    <Strana naslov="Import passengers" stanje={gotovo ? 'uvezeno' : 'za-uvoz'} popunjeno>
      <Kartica>
        <div className="flex flex-col gap-4">
          <div className="rounded-card border border-dashed border-gold-600 p-6 text-center">
            <p className="text-ink-2">Drag a .CSV/.XLSX here</p>
            <p className="mt-2 font-semibold">
              {DEMO.datotekaCsv} ({UPIS.redovaUFajlu} rows)
            </p>
          </div>
          <Dugme varijanta="text" onClick={() => demo.obavesti()}>
            Download template
          </Dugme>
          <Tabela
            naslov="Preview"
            kljuc={(r) => r}
            redovi={prvaTri}
            kolone={[
              { naslov: 'Full name', glavna: true, celija: (r) => r },
              { naslov: 'E-mail', celija: (r) => (r === LJUDI.putnici[0] ? <OznakaStanja vrsta="warn">Missing e-mail</OznakaStanja> : 'on file') },
            ]}
          />
          <p className="text-ink-2">
            {UPIS.spremnoZaUvoz} rows ready · {UPIS.cekaEmail} rows need attention (missing e-mail)
          </p>
          <p className="text-[13px] text-ink-3">Passport and health details are collected from travelers directly, with their consent.</p>
          <div className="flex flex-wrap gap-3">
            <RadnjaDugme id="5.uvoz" nakon={(u) => link('G8', u)}>
              Import {UPIS.spremnoZaUvoz} passengers
            </RadnjaDugme>
            <Dugme varijanta="secondary" onClick={() => idi('G8')}>
              Cancel
            </Dugme>
          </div>
        </div>
      </Kartica>
    </Strana>
  )
}

export function G11Link() {
  const { s } = useStanje()
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana naslov="Self-entry link" stanje={s.upisano >= SEDISTA ? 'popunjeno' : s.upisano > 0 ? 'posle-uvoza' : 'pocetak'} popunjeno>
      <Dve
        levo={
          <Kartica>
            <div className="flex flex-col gap-4">
              <PrikaznoPolje oznaka="Link (demo)" vrednost={DEMO.link} />
              <div className="flex flex-wrap items-center gap-3">
                <Dugme varijanta="secondary" onClick={() => demo.obavesti()}>
                  Copy link
                </Dugme>
                <span className="text-ink-2">Valid until {datum(LINK_VAZI_DO)}</span>
              </div>
              <p>
                Seats left: <span className="num text-gold-400">{s.otkazano ? '—' : s.slobodnoMesta}</span> (of {s.blokSedista})
                {s.pozivnicePoslate > 0 && <span className="text-ink-2"> · {s.pozivnicePoslate} invitations sent</span>}
              </p>
              <RadnjaDugme id="5.link" nakon={(u) => link('G8', u)}>
                Send invitation e-mails
              </RadnjaDugme>
              <p className="text-[13px] text-ink-3">Each traveler accepts the terms and consents themselves; you never enter their passport data.</p>
            </div>
          </Kartica>
        }
        desno={
          <Kartica naslov="What travelers will see">
            <p className="mb-4 text-ink-2">A short three-step form: details, consents, payment plan.</p>
            <Dugme varijanta="secondary" onClick={() => idi('T1', 'traveler')}>
              Preview as traveler
            </Dugme>
          </Kartica>
        }
      />
    </Strana>
  )
}
