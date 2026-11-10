// Zaglavlje (tamno mornarsko, 56 px): logo, oznaka "DEMO — fictional data" (UVEK vidljiva, i na telefonu),
// uloga i korisnik. Na telefonu: pločica koraka (Free) ili meni "≡" (Guided).
import { Link } from 'react-router'
import { Ikona } from '../komponente/Ikona'
import { LogoZaglavlje } from '../komponente/Logo'
import { usePrica } from '../prica/PricaProvider'
import { nazivKoraka } from '../prica/koraci'
import { TABLA, putZa } from '../pravila/rute'
import { AGENT, FINANSIJER, IGRAC, KUPAC, PRODAVAC } from '../scenario/strane'
import { NAZIV_ULOGE, OZNAKA_DEMO } from '../tekstovi/prica'
import { demoDatum } from '../scenario/datumi'
import type { Uloga } from '../prica/tipovi'

const KORISNIK: Record<Uloga, { kome: string; inicijali: string }> = {
  selling: { kome: `${PRODAVAC.naziv} · ${PRODAVAC.osobe.sporting.uloga}`, inicijali: PRODAVAC.osobe.sporting.inicijali },
  buying: { kome: `${KUPAC.naziv} · ${KUPAC.osobe.sporting.uloga}`, inicijali: KUPAC.osobe.sporting.inicijali },
  player: { kome: IGRAC.ime, inicijali: 'LV' },
  agent: { kome: `${AGENT.ime} · Agent`, inicijali: 'NS' },
  financier: { kome: `${FINANSIJER.naziv} · ${FINANSIJER.odeljenje}`, inicijali: 'MC' },
}

export function Zaglavlje() {
  const { uloga, poz, rezim, telefon, setPanel, setMeni, meni, zavrsenKorak } = usePrica()
  const k = KORISNIK[uloga]
  return (
    <header className="topbar on-dark">
      <Link to={putZa(TABLA[uloga])} aria-label="GoalToCart, go to dashboard" style={{ textDecoration: 'none' }}>
        <LogoZaglavlje />
      </Link>
      <span className="demo-pill" data-oznaka-demo="da">{OZNAKA_DEMO}</span>
      <span className="spacer" />
      {telefon && rezim === 'free' && (
        <button type="button" className="step-pill-top" onClick={() => setPanel(true)} aria-haspopup="dialog" aria-label={`Step ${poz.korak}/9, ${nazivKoraka(poz.korak, poz.grana, 'naziv', uloga)}. Open the demo panel`}>
          Step {poz.korak}/9
          <Ikona ime="more" sm />
        </button>
      )}
      <div className="whoami">
        <div>
          {NAZIV_ULOGE[uloga]}
          <small>{k.kome}</small>
        </div>
        <span className="avatar" aria-hidden="true">{k.inicijali}</span>
      </div>
      {telefon && rezim === 'guided' && (
        <button type="button" className="menu-btn" aria-label="Menu" aria-expanded={meni} onClick={() => setMeni(!meni)}>
          <Ikona ime="menu" />
        </button>
      )}
      {/* Telefon: uloga i demo datum uvek vidljivi u zaglavlju (ostatak zaglavlja je na 360 px pun) */}
      <div className="phone-sub" data-uloga-zaglavlje>
        {NAZIV_ULOGE[uloga]} · Demo date {demoDatum(poz.korak, poz.grana, zavrsenKorak)}
      </div>
    </header>
  )
}
