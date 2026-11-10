// Vremenske linije (UI.md 6.7) i mala linija faze (UI.md 6.5).
import { nazivKoraka, KORACI } from '../prica/koraci'
import type { Pozicija } from '../prica/tipovi'
import { fazaKoraka, odbijeno, tackeIgraca } from '../pravila/izvedeno'

/** Vodoravna linija 9 koraka (vertikalna na telefonu, CSS). Urađeni: plavi sa kvačicom; tekući: mornarski sa tirkiznim oreolom. */
export function VremenskaLinija9({ poz }: { poz: Pozicija }) {
  return (
    <ol className="tl card" aria-label="Transfer progress, 9 steps">
      {KORACI.map((k) => {
        const faza = fazaKoraka(poz, k.broj)
        // crveno X je samo odbijena registracija (korak 6); povraćaj je uspešan ishod i nije crven
        const odbijen = k.broj === 6 && odbijeno(poz)
        const klasa = odbijen ? 'r' : faza === 'zavrsen' ? 'd' : faza === 'tekuci' ? 'c' : ''
        const opis = faza === 'zavrsen' ? 'done' : faza === 'tekuci' ? 'current' : 'upcoming'
        return (
          <li key={k.broj} className={klasa} aria-current={faza === 'tekuci' ? 'step' : undefined}>
            <span className="sr">Step {k.broj}, {opis}: </span>
            {nazivKoraka(k.broj, poz.grana, 'kratak')}
            {odbijen && <small>Refused</small>}
          </li>
        )
      })}
    </ol>
  )
}

/** Linija od 6 tačaka za igrača i agenta (bez novca drugih strana). */
export function VremenskaLinija6({ poz }: { poz: Pozicija }) {
  const tacke = tackeIgraca(poz)
  return (
    <ol className="tl tl6 card" aria-label="Your transfer, 6 points">
      {tacke.map((t, i) => {
        const klasa = t.stanje === 'done' ? 'd' : t.stanje === 'now' ? 'c' : t.stanje === 'nije-zavrseno' ? 'r' : ''
        const dodatak = t.stanje === 'nije-zavrseno' ? 'Not completed' : t.stanje === 'ne-vazi' ? 'Not applicable' : null
        return (
          <li key={i} className={klasa} aria-current={t.stanje === 'now' ? 'step' : undefined}>
            {t.oznaka}
            {dodatak && <small>{dodatak}</small>}
          </li>
        )
      })}
    </ol>
  )
}

/** Mala linija faze: 9 segmenata (urađeno plavo, tekuće tirkizno-tamno, zakasnelo crveno, ostalo sivo) + tekst. */
export function MiniLinijaFaze({ korak, zavrsen = false, zakasnelo = false, tekst }: { korak: number; zavrsen?: boolean; zakasnelo?: boolean; tekst: string }) {
  return (
    <span className="phase">
      <span className="segs" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => {
          const k = i + 1
          let c = ''
          if (k < korak || (k === korak && zavrsen)) c = 'd'
          else if (k === korak) c = zakasnelo ? 'o' : 'c'
          return <i key={k} className={c} />
        })}
      </span>
      <small>{tekst}</small>
    </span>
  )
}

/** Linija 9 koraka za proizvoljan korak (sporedni transferi u pregledu, C2). */
export function LinijaKoraka({ korak, zakasnelo = false }: { korak: number; zakasnelo?: boolean }) {
  return (
    <ol className="tl card" aria-label="Transfer progress, 9 steps">
      {KORACI.map((k) => {
        const klasa = k.broj < korak ? 'd' : k.broj === korak ? (zakasnelo ? 'r' : 'c') : ''
        return (
          <li key={k.broj} className={klasa} aria-current={k.broj === korak ? 'step' : undefined}>
            <span className="sr">Step {k.broj}: </span>
            {k.kratak}
          </li>
        )
      })}
    </ol>
  )
}
