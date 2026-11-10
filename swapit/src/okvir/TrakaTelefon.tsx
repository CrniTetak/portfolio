// Telefon (struktura i mere kao u AllAddIn1; mere su u src/traka.css): Vođena = JEDNA fiksna traka pri dnu (pločica ‹ N/9 › + glavno dugme);
// Slobodno = ikonska traka pri dnu, a pločica „Korak N/9“ je u zaglavlju. Dodir na sredinu pločice otvara panel odozdo (najviše 82% visine).
import { useRef } from 'react'
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { BROJ_KORAKA, NAZIVI_KORAKA } from '../prica/koraci'
import { opisKartice } from '../tekstovi/kartice'
import { useEkran } from './kontekst'
import { useFocusTrap } from './useFocusTrap'
import { demoDatumTekst, PrekidacGrane, PrekidacRezima, PrekidacUgla, usePrica } from './prica'

/** Pločica „Korak N/9“ u zaglavlju (slobodni režim na telefonu) koja otvara panel. */
export function PanelPricePilula() {
  const demo = useDemo()
  return (
    <button type="button" className="pr-btn pr-btn-line" onClick={() => demo.otvoriPanel(true)} aria-haspopup="dialog" data-pilula-koraka>
      Korak {demo.poz.korak}/{BROJ_KORAKA}
    </button>
  )
}

export function TrakaTelefon() {
  const demo = useDemo()
  const p = usePrica()
  if (demo.rezim !== 'vodjena' || demo.panelOtvoren) return null
  return (
    <div className="pr-fixed" data-donji>
      <section aria-label="Kontrole priče" className="pr-dock" data-traka-telefon>
        <div className="pr-pill">
          <button type="button" onClick={p.back} disabled={!p.mozeBack} aria-label="Prethodni korak">
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button type="button" className="mid" onClick={() => demo.otvoriPanel(true)} aria-haspopup="dialog" aria-label={`Korak ${demo.poz.korak}/${BROJ_KORAKA}, ${NAZIVI_KORAKA[demo.poz.korak - 1]}. Otvori panel priče`}>
            {demo.poz.korak}/{BROJ_KORAKA}
          </button>
          <button type="button" onClick={p.next} disabled={!p.mozeNext} aria-label="Sledeći korak">
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
        <div className="pr-slot">
          {p.naEkranuPrice ? (
            <button type="button" className="pr-btn pr-btn-light" onClick={p.next} disabled={!p.mozeNext}>
              {p.mozeNext ? (
                <>
                  Dalje <ChevronRight size={14} aria-hidden />
                </>
              ) : (
                'Kraj priče'
              )}
            </button>
          ) : (
            <button type="button" className="pr-btn pr-btn-light" onClick={p.showMe}>
              Pokaži mi <ChevronRight size={14} aria-hidden />
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
  const { ugao } = useEkran()
  const p = usePrica()
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, demo.panelOtvoren, () => demo.otvoriPanel(false))
  if (!demo.panelOtvoren) return null
  const zatvori = () => demo.otvoriPanel(false)
  return (
    <div className="pr-overlay" data-panel-price>
      <button type="button" className="pr-scrim" aria-hidden="true" tabIndex={-1} onClick={zatvori} />
      <div className="pr-sheet" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Panel priče">
        <button type="button" className="pr-closeb" aria-label="Zatvori panel" data-prvi-fokus onClick={zatvori}>
          <X size={18} aria-hidden />
        </button>
        <div className="pr-grab" aria-hidden />
        <div className="pr-tag">
          Korak {demo.poz.korak} od {BROJ_KORAKA} · <span className="num">{demoDatumTekst(demo.poz)}</span>
        </div>
        <div className="pr-bar-h">{NAZIVI_KORAKA[demo.poz.korak - 1]}</div>
        <p>{opisKartice(demo.poz, ugao)}</p>
        <button
          type="button"
          className="pr-btn pr-btn-light pr-btn-block"
          onClick={() => {
            zatvori()
            if (p.naEkranuPrice) p.showMe()
            else p.nazadNaPricu()
          }}
        >
          {p.naEkranuPrice ? 'Pokaži mi' : 'Nazad na priču'} <ChevronRight size={14} aria-hidden />
        </button>
        {p.poz.korak === 6 && (
          <>
            <div className="pr-lbl">Račva</div>
            <PrekidacGrane />
          </>
        )}
        <div className="pr-lbl">Gledaj kao</div>
        <PrekidacUgla />
        <div className="pr-lbl">Svi koraci</div>
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
                  {k < p.poz.korak && <span className="sr-only">, završen</span>}
                  {k === 6 && <span className="sr-only">, ima račvu</span>}
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
