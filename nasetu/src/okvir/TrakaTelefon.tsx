// Telefon (plan dorade 3, 7.1): u vođenom režimu postoji JEDAN fiksni sloj pri dnu: pločica „‹ Korak 4/9 ›" + glavno dugme ekrana.
// Dodir na sredinu pločice otvara panel odozdo (do 82% visine) sa karticom priče, „Šta ako", „Gledaj kao", listom koraka i prekidačima.
// U slobodnom režimu isti panel (sa „Alati") otvara pločica „Korak N/9" iz zaglavlja. Mere su 1:1 iz GoalToCart-a (src/traka.css).
import { ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { ciljNext, stanjeTacke } from '../prica/navigacija'
import { BROJ_KORAKA, KORAK_RACVE } from '../prica/tipovi'
import { NAZIV_ULOGE } from '../podaci/akteri'
import { useStanje } from '../stanje/StanjeProvider'
import { nazivKoraka, opisKoraka, poUloziZa } from '../tekstovi/prica'
import { useDock } from './DockKontekst'
import { AlatiSadrzaj, OznakaOdstupanja, PrekidacRacve, PrekidacRezima, PrekidacUloge } from './TrakaPrice'
import { useFocusTrap } from './useFocusTrap'

export function TrakaTelefon() {
  const { poz, naEkranuPrice, prikaziMi, dalje, nazad, setPanel } = useStanje()
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
    <div className="pr-dock tamno" role="region" aria-label="Traka priče" data-traka="telefon">
      <div className="pr-pill">
        <button type="button" onClick={nazad} disabled={poceo} aria-label="Prethodni korak"><ChevronLeft size={20} aria-hidden /></button>
        <button
          type="button" className="mid" onClick={() => setPanel(true)} aria-haspopup="dialog" data-pocetak-panela
          aria-label={`Korak ${poz.korak} od 9, ${nazivKoraka(poz.korak, poz.grana)}. Otvori panel priče`}
        >Korak {poz.korak}/9</button>
        <button type="button" data-dalje onClick={dalje} disabled={kraj} aria-label={kraj ? 'Dalje (kraj priče)' : 'Sledeći korak'}><ChevronRight size={20} aria-hidden /></button>
      </div>
      <div className="pr-slot">
        <div ref={slotRef} style={{ display: 'contents' }} data-slot-trake />
        {!imaAkciju && (naEkranuPrice ? (
          <button type="button" className="pr-btn pr-btn-light" onClick={dalje} disabled={kraj}>
            {kraj ? 'Kraj priče' : <>Dalje <ChevronRight size={16} aria-hidden /></>}
          </button>
        ) : (
          <button type="button" className="pr-btn pr-btn-light" onClick={prikaziMi}>Prikaži mi <ChevronRight size={16} aria-hidden /></button>
        ))}
      </div>
    </div>
  )
}

/** Panel odozdo (bottom sheet), najviše 82% visine. */
export function PanelOdDole() {
  const { poz, stanje, vodjeno, panel, setPanel, prikaziMi, skoci, naEkranuPrice, kreniIspocetka } = useStanje()
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, panel, () => setPanel(false))
  if (!panel) return null
  const uloga = stanje.uloga === 'admin' ? 'produkcija' : stanje.uloga
  return (
    <div className="pr-overlay tamno" data-panel="da">
      <div className="pr-scrim" onClick={() => setPanel(false)} aria-hidden />
      <div className="pr-sheet" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Panel priče">
        <button type="button" className="pr-closeb" aria-label="Zatvori panel" data-prvi-fokus onClick={() => setPanel(false)}><X size={20} aria-hidden /></button>
        <div className="pr-grab" aria-hidden />
        <div className="pr-tag">Korak {poz.korak} od {BROJ_KORAKA} · {NAZIV_ULOGE[stanje.uloga]}</div>
        <div className="pr-bar-h">{nazivKoraka(poz.korak, poz.grana)}</div>
        <p>{opisKoraka(poz)} {poUloziZa(poz, uloga)}</p>
        {stanje.prica.odstupljeno && <div className="pr-row" style={{ marginBottom: 8 }}><OznakaOdstupanja /></div>}
        {stanje.uloga !== 'admin' && (
          <button type="button" className="pr-btn pr-btn-light pr-btn-block" onClick={() => { prikaziMi(); setPanel(false) }}>
            {naEkranuPrice ? 'Prikaži mi' : 'Nazad u priču'} <ChevronRight size={16} aria-hidden />
          </button>
        )}
        {poz.korak === KORAK_RACVE && <><div className="pr-lbl">Šta ako</div><PrekidacRacve /></>}
        <div className="pr-lbl">Gledaj kao</div>
        <PrekidacUloge />
        {!vodjeno && <><div className="pr-lbl">Alati</div><AlatiSadrzaj tamno /></>}
        <div className="pr-lbl">Svi koraci</div>
        <ol>
          {Array.from({ length: BROJ_KORAKA }, (_, i) => i + 1).map((k) => {
            const st = stanjeTacke(poz, k)
            return (
              <li key={k}>
                <button type="button" className={st === 'gotovo' ? 'done' : st === 'sada' ? 'now' : ''} aria-current={st === 'sada' ? 'step' : undefined} onClick={() => { skoci(k); setPanel(false) }}>
                  <span className="n">{k}</span>{nazivKoraka(k, poz.grana)}
                </button>
              </li>
            )
          })}
        </ol>
        <div className="pr-row">
          <PrekidacRezima />
          <button type="button" className="pr-btn pr-btn-line" onClick={() => { setPanel(false); kreniIspocetka() }}><RotateCcw size={16} aria-hidden /> Kreni ispočetka</button>
        </div>
      </div>
    </div>
  )
}
