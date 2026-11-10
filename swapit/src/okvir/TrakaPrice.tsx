// Traka priče za računar i tablet (struktura i mere kao u AllAddIn1; mere su u src/traka.css).
//  - Vođena: dva reda. Red 1: korak + šta se dešava + „Pokaži mi“. Red 2: Nazad, krugovi 1–9, Dalje, Gledaj kao, režim, Restart.
//  - Slobodno: jedan red (pločica „Korak N od 9“ + glavno dugme).
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { BROJ_KORAKA, NAZIVI_KORAKA } from '../prica/koraci'
import { opisKartice } from '../tekstovi/kartice'
import { PORUKE } from '../tekstovi/okvir'
import { useEkran } from './kontekst'
import { demoDatumTekst, naslovKoraka, GlavnoDugme, PrekidacGrane, PrekidacRezima, PrekidacUgla, usePrica } from './prica'

/** Nazad, krugovi 1–9 (skok na početak koraka; korak 6 nosi oznaku račve), Dalje. */
function Tacke() {
  const p = usePrica()
  return (
    <div className="pr-dots" role="group" aria-label="Koraci priče">
      <button type="button" className="pr-nav" onClick={p.back} disabled={!p.mozeBack} aria-label="Nazad">
        <ChevronLeft size={14} aria-hidden /> Nazad
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
            className={`pr-d${prosao ? ' done' : tekuci ? ' now' : ''}${k === 6 ? ' fork' : ''}`}
            aria-current={tekuci ? 'step' : undefined}
            aria-label={`Korak ${k}: ${NAZIVI_KORAKA[k - 1]}${tekuci ? ', trenutni' : ''}${prosao ? ', završen' : ''}${k === 6 ? ', ima račvu' : ''}`}
          >
            {k}
          </button>
        )
      })}
      <button type="button" className="pr-nav" onClick={p.next} disabled={!p.mozeNext} aria-label="Dalje" title={p.kraj ? PORUKE.krajPrice : undefined}>
        Dalje <ChevronRight size={14} aria-hidden />
      </button>
    </div>
  )
}

export function TrakaPrice() {
  const demo = useDemo()
  const p = usePrica()
  const vodjena = demo.rezim === 'vodjena'
  const { ugao } = useEkran()
  return (
    <div className="pr-fixed" data-donji>
      <section aria-label="Kontrole priče" className="pr-bar" data-traka-price data-rezim={demo.rezim}>
        {vodjena && (
          <div className="pr-story">
            <div className="pr-bar-h" data-naslov-koraka>
              {naslovKoraka(demo.poz)}
            </div>
            <p data-tekst-price tabIndex={0} role="group" aria-label="Opis koraka">
              {opisKartice(demo.poz, ugao)}
            </p>
            <div className="pr-acts" data-kartica-price>
              <PrekidacGrane kratko rezervisi />
              <GlavnoDugme />
            </div>
          </div>
        )}
        <div className="pr-ctl">
          {!vodjena && (
            <div className="pr-free">
              <span data-naslov-koraka>
                <b>{naslovKoraka(demo.poz)}</b>
              </span>
              <PrekidacGrane kratko rezervisi />
              <GlavnoDugme lagano={false} />
            </div>
          )}
          <Tacke />
          <div className="pr-grp">
            <span>Gledaj kao</span>
            <PrekidacUgla />
          </div>
          <div className="pr-push">
            <span className="pr-demodate" data-demo-datum>
              Demo datum: <b>{demoDatumTekst(demo.poz)}</b>
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
