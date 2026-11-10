// Telefon (struktura i mere kao u Nasetu/GoalToCart-u; mere u src/traka.css): Guided = JEDNA fiksna traka pri dnu (pločica ‹ Step N/9 › + glavno dugme);
// Free = bez donje trake, pločica "Step N/9" u zaglavlju. Dodir na sredinu pločice otvara panel odozdo (najviše 82% visine).
import { useRef } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { NAZIVI_KORAKA } from '../prica/koraci'
import { BROJ_KORAKA } from '../scenario/racun'
import { opisKartice } from '../tekstovi/kartice'
import { useEkran } from './kontekst'
import { useFocusTrap } from './useFocusTrap'
import { demoDatumTekst, PrekidacRacve, PrekidacRezima, PrekidacUloge, usePrica } from './prica'

/** Pločica "Step 5/9" u zaglavlju (Free na telefonu) koja otvara panel. */
export function PanelPricePill() {
  const demo = useDemo()
  return (
    <button type="button" className="pr-btn pr-btn-line" onClick={() => demo.otvoriPanel(true)} aria-haspopup="dialog" data-pilula-koraka>
      Step {demo.poz.korak}/{BROJ_KORAKA}
    </button>
  )
}

export function TrakaTelefon() {
  const demo = useDemo()
  const p = usePrica()
  if (demo.rezim !== 'guided' || demo.panelOtvoren) return null
  return (
    <div className="pr-fixed" data-donji>
      <section aria-label="Story controls" className="pr-dock" data-traka-telefon>
        <div className="pr-pill">
          <button type="button" onClick={p.back} disabled={!p.mozeBack} aria-label="Previous step">
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="mid"
            onClick={() => demo.otvoriPanel(true)}
            aria-haspopup="dialog"
            aria-label={`Step ${demo.poz.korak}/${BROJ_KORAKA}, ${NAZIVI_KORAKA[demo.poz.korak - 1]}. Open the story panel`}
          >
            Step {demo.poz.korak}/{BROJ_KORAKA}
          </button>
          <button type="button" onClick={p.next} disabled={!p.mozeNext} aria-label="Next step">
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
        <div className="pr-slot">
          {p.naEkranuPrice ? (
            <button type="button" className="pr-btn pr-btn-light" onClick={p.next} disabled={!p.mozeNext}>
              {p.mozeNext ? (
                <>
                  Next <ChevronRight size={14} aria-hidden />
                </>
              ) : (
                'End of story'
              )}
            </button>
          ) : (
            <button type="button" className="pr-btn pr-btn-light" onClick={p.showMe}>
              Show me <ChevronRight size={14} aria-hidden />
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

/** Panel odozdo (bottom sheet), najviše 82% visine. */
export function PanelPrice() {
  const demo = useDemo()
  const { uloga } = useEkran()
  const p = usePrica()
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, demo.panelOtvoren, () => demo.otvoriPanel(false))
  if (!demo.panelOtvoren) return null
  const zatvori = () => demo.otvoriPanel(false)
  return (
    <div className="pr-overlay" data-panel-price>
      <button type="button" className="pr-scrim" aria-hidden="true" tabIndex={-1} onClick={zatvori} />
      <div className="pr-sheet" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Story panel">
        <button type="button" className="pr-closeb" aria-label="Close panel" data-prvi-fokus onClick={zatvori}>
          <X size={18} aria-hidden />
        </button>
        <div className="pr-grab" aria-hidden />
        <div className="pr-tag">
          Step {demo.poz.korak} of {BROJ_KORAKA} · <span className="num">{demoDatumTekst(demo.poz)}</span>
        </div>
        <div className="pr-bar-h">{NAZIVI_KORAKA[demo.poz.korak - 1]}</div>
        <p>{opisKartice(demo.poz, uloga)}</p>
        <button
          type="button"
          className="pr-btn pr-btn-light pr-btn-block"
          onClick={() => {
            zatvori()
            if (p.naEkranuPrice) p.showMe()
            else p.nazadNaPricu()
          }}
        >
          {p.naEkranuPrice ? 'Show me' : 'Back to story'} <ChevronRight size={14} aria-hidden />
        </button>
        {p.poz.korak === 7 && (
          <>
            <div className="pr-lbl">What if</div>
            <PrekidacRacve />
          </>
        )}
        <div className="pr-lbl">View as</div>
        <PrekidacUloge />
        <div className="pr-lbl">All steps</div>
        <ol>
          {Array.from({ length: BROJ_KORAKA }, (_, i) => i + 1).map((k) => {
            const tekuci = k === p.poz.korak
            return (
              <li key={k}>
                <button
                  type="button"
                  className={k < p.poz.korak ? 'done' : tekuci ? 'now' : ''}
                  aria-current={tekuci ? 'step' : undefined}
                  onClick={() => {
                    zatvori()
                    p.idiNaKorak(k)
                  }}
                >
                  <span className="n">{k}</span>
                  {NAZIVI_KORAKA[k - 1]}
                  {k < p.poz.korak && <span className="sr-only">, completed</span>}
                  {k === 7 && <span className="sr-only">, has what-if branches</span>}
                </button>
              </li>
            )
          })}
        </ol>
        <div className="pr-row">
          <PrekidacRezima />
          <button
            type="button"
            className="pr-btn pr-btn-line"
            onClick={() => {
              zatvori()
              demo.otvoriRestart(true)
            }}
          >
            <RotateCcw size={14} aria-hidden /> Restart demo
          </button>
        </div>
      </div>
    </div>
  )
}
