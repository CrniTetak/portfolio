// B1 All-In membership (bez cene članarine) i B2 My All-In status (broji REZERVISANA putovanja iz slobodnih tokova; pragovi su dostižni u demou).
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, KpiPlocica, PraznoStanje } from '../../komponente/Kartica'
import { Strana } from '../../komponente/Strana'
import { TokDugme } from '../../komponente/TokDugme'
import { useIdi } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { CLANSTVO, paket } from '../../scenario/ponude'
import { GALA_NAZIV, NAZIVI_KRSTARENJA, SAVETNICI_KONSIJERZA } from '../../scenario/strane'
import { CLANSTVO_POGODNOSTI } from '../../tekstovi/tokovi'
import { TRANSPORT_USLUGE } from '../../scenario/ponude'
import { rezervisanaPutovanja, napreduj, nivoClanstva } from '../../tokovi/tokovi'

const NIVOI = [
  { naziv: 'Member', prag: CLANSTVO.member },
  { naziv: 'Select', prag: CLANSTVO.select },
  { naziv: 'Signature', prag: CLANSTVO.signature },
] as const

export function B1Clanstvo() {
  return (
    <Strana naslov="All-In — a status earned through your trips" stanje="clanstvo">
      <div className="grid gap-4 md:grid-cols-3">
        {NIVOI.map((n) => (
          <Kartica key={n.naziv} naslov={n.naziv}>
            <p className="mb-3 text-gold-400">
              {n.prag} booked {n.prag === 1 ? 'trip' : 'trips'}
            </p>
            <ul className="flex flex-col gap-2 text-ink-2">
              {CLANSTVO_POGODNOSTI[n.naziv].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </Kartica>
        ))}
      </div>
      <p className="text-ink-2">Status is based on booked trips, not on play.</p>
      <div>
        <TokDugme primeni={(t) => napreduj(t, 'clanstvo', 'prijavljeno')} nakon={(u) => link('B2', u)}>
          Apply for membership
        </TokDugme>
      </div>
    </Strana>
  )
}

export function B2Status() {
  const demo = useDemo()
  const idi = useIdi()
  const t = demo.tokovi
  const n = rezervisanaPutovanja(t)
  const nivo = nivoClanstva(n)
  // bez rezervisanog putovanja članstvo je tek prijava; Member počinje od prvog putovanja
  const sledeci = n === 0 ? 'Member' : nivo === 'Member' ? 'Select' : nivo === 'Select' ? 'Signature' : null
  const cilj = n === 0 ? CLANSTVO.member : nivo === 'Member' ? CLANSTVO.select : CLANSTVO.signature
  const prihvaceno = (f: string) => f === 'prihvaceno' || f === 'potvrdjeno' || f === 'placeno'
  const putovanja = [
    t.krstarenje === 'placeno' ? NAZIVI_KRSTARENJA.iberian : null,
    prihvaceno(t.monteKarlo) ? paket('royal').naziv : null,
    prihvaceno(t.konsijerz) ? `${GALA_NAZIV} · ${SAVETNICI_KONSIJERZA[t.savetnik].ime}` : null,
    t.transport === 'prihvaceno' ? TRANSPORT_USLUGE[t.usluga].naziv : null,
  ].filter((x): x is string => x !== null)
  if (t.clanstvo === 'none')
    return (
      <Strana naslov="My All-In status" stanje="nije-prijavljen">
        <PraznoStanje naslov="No membership yet">Apply for All-In to see your status and the trips that count towards it.</PraznoStanje>
        <div>
          <Dugme onClick={() => idi('B1')}>See membership levels</Dugme>
        </div>
      </Strana>
    )
  return (
    <Strana naslov="My All-In status" stanje={`${nivo}-${n}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <KpiPlocica oznaka="Your status" vrednost={n === 0 ? 'Application received' : nivo} opis={n === 0 ? 'Your application is received — an advisor will be in touch' : 'Your booked trips count towards your status'} />
        <KpiPlocica oznaka={`Progress to ${sledeci ?? 'the top level'}`} vrednost={`${Math.min(n, cilj)} of ${cilj} ${cilj === 1 ? 'trip' : 'trips'}`} traka={(Math.min(n, cilj) * 100) / cilj} />
      </div>
      <Kartica naslov="Benefits">
        {n === 0 ? (
          <p className="text-ink-3">Benefits start with your first booked trip.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-ink-2">
            {CLANSTVO_POGODNOSTI[nivo].map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </Kartica>
      <Kartica naslov="Trips counted">
        {putovanja.length === 0 ? (
          <p className="text-ink-3">No booked trips yet. Trips you book in the demo appear here.</p>
        ) : (
          <ul className="flex flex-col gap-2 text-ink-2">
            {putovanja.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        )}
      </Kartica>
    </Strana>
  )
}

