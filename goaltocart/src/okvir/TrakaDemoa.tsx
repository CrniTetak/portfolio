// Traka demoa za računar i tablet (UI.md 6.15): tamna, tirkizna linija na vrhu.
// Red 1 (samo Guided): naslov koraka + datum, kartica priče, "Show me". Red 2 (uvek): Back, 9 krugova, Next, "View as", Guided/Free, Restart.
import { Ikona } from '../komponente/Ikona'
import { usePrica } from '../prica/PricaProvider'
import { ciljNext, stanjeTacke } from '../prica/navigacija'
import { KORACI, nazivKoraka } from '../prica/koraci'
import { ULOGE } from '../prica/tipovi'
import { demoDatum } from '../scenario/datumi'
import { KRATKI_NAZIV_ULOGE, poUloziZa, pricaZa } from '../tekstovi/prica'

export function PrekidacUloge({ svetlo = false }: { svetlo?: boolean }) {
  const { uloga, promeniUlogu } = usePrica()
  return (
    <div className={`seg${svetlo ? ' light' : ''}`} role="group" aria-label="View as">
      {ULOGE.map((u) => (
        <button key={u} type="button" aria-pressed={u === uloga} onClick={() => u !== uloga && promeniUlogu(u)}>
          {u === 'selling' ? 'Selling club' : u === 'buying' ? 'Buying club' : KRATKI_NAZIV_ULOGE[u]}
        </button>
      ))}
    </div>
  )
}

/**
 * Račva "Registration result: Approved / Rejected" (UX 1.4): na koraku 6 je prekidač, a u grani Rejected na koracima 7-9
 * dugme "Back to the main story" (vraća na 6/početno u Approved).
 */
export function PrekidacRacve() {
  const { poz, uloga, setGrana } = usePrica()
  // Finansijer nema račvu: prezenter je upravlja iz druge uloge, a finansijeru se ne odaje ishod.
  if (uloga === 'financier') return null
  if (poz.korak === 6) {
    return (
      <div className="grp" data-racva>
        <span>Registration result</span>
        <div className="seg" role="group" aria-label="Registration result">
          <button type="button" aria-pressed={poz.grana === 'approved'} onClick={() => setGrana('approved')}>Approved</button>
          <button type="button" aria-pressed={poz.grana === 'rejected'} onClick={() => setGrana('rejected')}>Rejected</button>
        </div>
      </div>
    )
  }
  if (poz.korak > 6 && poz.grana === 'rejected') {
    return (
      <button type="button" className="btn btn-line" data-racva onClick={() => setGrana('approved')}>
        <Ikona ime="undo" sm />
        Back to the main story
      </button>
    )
  }
  return null
}

export function PrekidacRezima() {
  const { rezim, setRezim } = usePrica()
  return (
    <div className="seg" role="group" aria-label="Mode">
      <button type="button" aria-pressed={rezim === 'guided'} onClick={() => setRezim('guided')}>Guided</button>
      <button type="button" aria-pressed={rezim === 'free'} onClick={() => setRezim('free')}>Free</button>
    </div>
  )
}

export function TrakaDemoa() {
  const { poz, uloga, rezim, zavrsenKorak, naEkranuPrice, showMe, sledeci, nazad, skoci, setRestartOtvoren } = usePrica()
  const datum = demoDatum(poz.korak, poz.grana, zavrsenKorak)
  const naslov = `Step ${poz.korak} of 9 · ${nazivKoraka(poz.korak, poz.grana, 'naziv', uloga)}`
  const nextOnemogucen = ciljNext(poz) === null
  const poceo = poz.korak === 1 && poz.odradjeno === 0

  const izgubljen = !naEkranuPrice && (
    <span className="lostchip" role="status">
      <Ikona ime="warn" sm />
      You left the story screen
    </span>
  )

  return (
    <div className="demobar on-dark" role="region" aria-label="Demo controls" data-traka="racunar" data-rezim={rezim}>
      {rezim === 'guided' && (
        <div className="story">
          <div className="bar-h" data-naslov-koraka>
            {naslov}
            <small className="num">Demo date: {datum}</small>
          </div>
          <p>
            {pricaZa(poz.korak, poz.grana, uloga)} {poUloziZa(poz.korak, poz.grana, uloga)}
          </p>
          <div className="acts">
            <PrekidacRacve />
            {izgubljen}
            {uloga === 'financier' && poz.korak < 8 && (
              <button type="button" className="btn btn-line" onClick={() => skoci(8)}>Jump to step 8</button>
            )}
            {!naEkranuPrice && (
              <button type="button" className="btn btn-line" onClick={showMe}>Back to story</button>
            )}
            <button type="button" className="btn btn-light" onClick={showMe}>
              Show me
              <Ikona ime="right" sm />
            </button>
          </div>
        </div>
      )}
      <div className="ctl">
        {rezim === 'free' && (
          <div className="freeinfo">
            <span data-naslov-koraka><b>{naslov}</b></span>
            <span className="demodate num">Demo date: <b>{datum}</b></span>
            <PrekidacRacve />
            {izgubljen}
            {!naEkranuPrice && (
              <button type="button" className="btn btn-line" onClick={showMe}>Back to story</button>
            )}
          </div>
        )}
        <div className="dots" role="group" aria-label="Story steps">
          <button type="button" className="nav" onClick={nazad} disabled={poceo} aria-label="Back">
            <Ikona ime="left" sm />
            Back
          </button>
          {KORACI.map((k) => {
            const st = stanjeTacke(poz, k.broj)
            const opis = st === 'done' ? 'done' : st === 'now' ? 'current' : 'upcoming'
            return (
              <button
                key={k.broj}
                type="button"
                className={`d ${st === 'done' ? 'done' : st === 'now' ? 'now' : ''}${k.broj === 6 && uloga !== 'financier' ? ' fork' : ''}`}
                aria-current={st === 'now' ? 'step' : undefined}
                aria-label={`Step ${k.broj}, ${opis}: ${nazivKoraka(k.broj, poz.grana, 'naziv', uloga)}${k.broj === 6 && uloga !== 'financier' ? ' (has a what-if branch)' : ''}`}
                title={nazivKoraka(k.broj, poz.grana, 'naziv', uloga)}
                onClick={() => skoci(k.broj)}
              >
                {k.broj}
              </button>
            )
          })}
          <button
            type="button"
            className="nav"
            onClick={sledeci}
            disabled={nextOnemogucen}
            aria-label={nextOnemogucen ? 'Next (end of story)' : 'Next'}
            title={nextOnemogucen ? 'End of story — Restart or explore' : undefined}
          >
            Next
            <Ikona ime="right" sm />
          </button>
        </div>
        <div className="grp">
          <span>View as</span>
          <PrekidacUloge />
        </div>
        <div className="push">
          {nextOnemogucen && <span className="demodate">End of story — Restart or explore</span>}
          <PrekidacRezima />
          <button type="button" className="btn btn-line" onClick={() => setRestartOtvoren(true)}>
            <Ikona ime="reload" sm />
            Restart demo
          </button>
        </div>
      </div>
    </div>
  )
}
