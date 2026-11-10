// Telefon (UX 1.3, UI 6.16): u vođenom režimu postoji JEDAN fiksni sloj pri dnu: spojena traka
// "‹ Step 4/9 ›" + glavna akcija ekrana. Tap na sredinu otvara panel od dole sa karticom priče, listom koraka i prekidačima.
import { useEffect, useRef } from 'react'
import { Ikona } from '../komponente/Ikona'
import { useDock } from './DockKontekst'
import { usePrica } from '../prica/PricaProvider'
import { ciljNext, stanjeTacke } from '../prica/navigacija'
import { KORACI, nazivKoraka } from '../prica/koraci'
import { demoDatum } from '../scenario/datumi'
import { NAZIV_ULOGE, poUloziZa, pricaZa } from '../tekstovi/prica'
import { PrekidacRacve, PrekidacRezima, PrekidacUloge } from './TrakaDemoa'
import { useFocusTrap } from './useFocusTrap'

export function TrakaTelefon() {
  const { poz, uloga, naEkranuPrice, showMe, sledeci, nazad, setPanel } = usePrica()
  const dock = useDock()
  const slotRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    dock.postaviSlot(slotRef.current)
    return () => dock.postaviSlot(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const poceo = poz.korak === 1 && poz.odradjeno === 0
  const kraj = ciljNext(poz) === null
  const imaAkciju = dock.brojDugmadi > 0

  return (
    <div className="dock on-dark" role="region" aria-label="Demo controls" data-traka="telefon">
      <div className="pill">
        <button type="button" onClick={nazad} disabled={poceo} aria-label="Previous step">
          <Ikona ime="left" />
        </button>
        <button type="button" className="mid" onClick={() => setPanel(true)} aria-haspopup="dialog" aria-label={`Step ${poz.korak}/9, ${nazivKoraka(poz.korak, poz.grana, 'naziv', uloga)}. Open the demo panel`} data-pocetak-panela>
          Step {poz.korak}/9
        </button>
        <button type="button" onClick={sledeci} disabled={kraj} aria-label={kraj ? 'Next (end of story)' : 'Next step'}>
          <Ikona ime="right" />
        </button>
      </div>
      <div className="slot">
        <div ref={slotRef} className="slotporta" />
        {!imaAkciju &&
          (naEkranuPrice ? (
            <button type="button" className="btn btn-light" onClick={sledeci} disabled={kraj}>
              {kraj ? 'End of story' : 'Next'}
              {!kraj && <Ikona ime="right" sm />}
            </button>
          ) : (
            <button type="button" className="btn btn-light" onClick={showMe}>
              Show me
              <Ikona ime="right" sm />
            </button>
          ))}
      </div>
    </div>
  )
}

/** Panel od dole (bottom sheet), ne više od ~82% visine. */
export function PanelOdDole() {
  const { poz, uloga, panel, setPanel, zavrsenKorak, showMe, skoci, naEkranuPrice, setRestartOtvoren } = usePrica()
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, panel, () => setPanel(false))
  if (!panel) return null
  const datum = demoDatum(poz.korak, poz.grana, zavrsenKorak)
  return (
    <div className="overlay on-dark" data-panel="da">
      <div className="scrim" onClick={() => setPanel(false)} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Demo panel" ref={ref}>
        <button type="button" className="closeb" aria-label="Close panel" data-prvi-fokus onClick={() => setPanel(false)}>
          <Ikona ime="x" />
        </button>
        <div className="grab" aria-hidden="true" />
        <div className="tag num">Step {poz.korak} of 9 · Demo date {datum} · {NAZIV_ULOGE[uloga]}</div>
        <div className="bar-h">{nazivKoraka(poz.korak, poz.grana, 'naziv', uloga)}</div>
        <p>
          {pricaZa(poz.korak, poz.grana, uloga)} {poUloziZa(poz.korak, poz.grana, uloga)}
        </p>
        <button
          type="button"
          className="btn btn-light btn-block"
          onClick={() => {
            showMe()
            setPanel(false)
          }}
        >
          {naEkranuPrice ? 'Show me' : 'Back to story'}
          <Ikona ime="right" sm />
        </button>
        {(poz.korak === 6 || poz.grana === 'rejected') && uloga !== 'financier' && (
          <>
            <div className="lbl">What-if</div>
            <PrekidacRacve />
          </>
        )}
        <div className="lbl">View as</div>
        <PrekidacUloge />
        {uloga === 'financier' && poz.korak < 8 && (
          <button type="button" className="btn btn-line btn-block" onClick={() => { skoci(8); setPanel(false) }}>Jump to step 8</button>
        )}
        <div className="lbl">All steps</div>
        <ol>
          {KORACI.map((k) => {
            const st = stanjeTacke(poz, k.broj)
            return (
              <li key={k.broj}>
                <button
                  type="button"
                  className={st === 'done' ? 'done' : st === 'now' ? 'now' : ''}
                  aria-current={st === 'now' ? 'step' : undefined}
                  onClick={() => {
                    skoci(k.broj)
                    setPanel(false)
                  }}
                >
                  <span className="n">{k.broj}</span>
                  {nazivKoraka(k.broj, poz.grana, 'naziv', uloga)}
                </button>
              </li>
            )
          })}
        </ol>
        <div className="row">
          <PrekidacRezima />
          <button
            type="button"
            className="btn btn-line"
            onClick={() => {
              setPanel(false)
              setRestartOtvoren(true)
            }}
          >
            <Ikona ime="reload" sm />
            Restart demo
          </button>
        </div>
      </div>
    </div>
  )
}
