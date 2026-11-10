// Traka priče za računar i tablet (struktura i mere kao u Nasetu/GoalToCart-u; mere u src/traka.css).
//  - Guided: dva reda. Red 1: korak + šta se dešava + "Show me". Red 2: Back, krugovi 1–9, Next, View as, režim, Restart.
//  - Free: jedan red.
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { NAZIVI_KORAKA } from '../prica/koraci'
import { BROJ_KORAKA } from '../scenario/racun'
import { opisKartice, PORUKE } from '../tekstovi/kartice'
import { useEkran } from './kontekst'
import { demoDatumTekst, naslovKoraka, GlavnoDugme, PrekidacRacve, PrekidacRezima, PrekidacUloge, usePrica } from './prica'

/** Nazad, krugovi 1–9 (skok na početak koraka; korak 7 nosi oznaku račve), Dalje. */
function Dots() {
  const p = usePrica()
  return (
    <div className="pr-dots" role="group" aria-label="Story steps">
      <button type="button" className="pr-nav" onClick={p.back} disabled={!p.mozeBack} aria-label="Back">
        <ChevronLeft size={14} aria-hidden /> Back
      </button>
      {Array.from({ length: BROJ_KORAKA }, (_, i) => i + 1).map((k) => {
        const tekuci = k === p.poz.korak
        const prosao = k < p.poz.korak
        return (
          <button
            key={k}
            type="button"
            onClick={() => p.idiNaKorak(k)}
            title={NAZIVI_KORAKA[k - 1]}
            className={`pr-d${prosao ? ' done' : tekuci ? ' now' : ''}${k === 7 ? ' fork' : ''}`}
            aria-current={tekuci ? 'step' : undefined}
            aria-label={`Step ${k}: ${NAZIVI_KORAKA[k - 1]}${tekuci ? ', current' : ''}${prosao ? ', completed' : ''}${k === 7 ? ', has what-if branches' : ''}`}
          >
            {k}
          </button>
        )
      })}
      <button type="button" className="pr-nav" onClick={p.next} disabled={!p.mozeNext} aria-label="Next" title={p.kraj ? PORUKE.krajPrice : undefined}>
        Next <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  )
}

export function TrakaPrice() {
  const demo = useDemo()
  const p = usePrica()
  const guided = demo.rezim === 'guided'
  const { uloga } = useEkran()
  return (
    <div className="pr-fixed" data-donji>
      <section aria-label="Story controls" className="pr-bar" data-traka-price data-rezim={demo.rezim}>
        {guided && (
          <div className="pr-story">
            <div className="pr-bar-h" data-naslov-koraka>
              {naslovKoraka(demo.poz)}
            </div>
            <p data-tekst-price>{opisKartice(demo.poz, uloga)}</p>
            <div className="pr-acts" data-kartica-price>
              <PrekidacRacve kratko rezervisi />
              <GlavnoDugme />
            </div>
          </div>
        )}
        <div className="pr-ctl">
          {!guided && (
            <div className="pr-free">
              <span data-naslov-koraka>
                <b>{naslovKoraka(demo.poz)}</b>
              </span>
              <PrekidacRacve kratko rezervisi />
              <GlavnoDugme lagano={false} sakrij={p.naEkranuPrice} />
            </div>
          )}
          <Dots />
          <div className="pr-grp">
            <span>View as</span>
            <PrekidacUloge />
          </div>
          <div className="pr-push">
            <span className="pr-demodate" data-demo-datum>
              Demo date: <b>{demoDatumTekst(demo.poz)}</b>
            </span>
            {p.kraj && <span className="sr-only">{PORUKE.krajPrice}</span>}
            <PrekidacRezima />
            <button type="button" className="pr-btn pr-btn-line" onClick={() => demo.otvoriRestart(true)}>
              <RotateCcw size={14} aria-hidden /> Restart demo
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
