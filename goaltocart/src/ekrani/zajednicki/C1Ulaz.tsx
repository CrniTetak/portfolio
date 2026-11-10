// C1. Enter demo: lažna prijava. Bez polja za lozinku; samo izbor uloge i režima.
import { useState } from 'react'
import { Link } from 'react-router'
import { Ikona } from '../../komponente/Ikona'
import { LogoZaglavlje } from '../../komponente/Logo'
import { usePrica } from '../../prica/PricaProvider'
import { ULOGE } from '../../prica/tipovi'
import type { Rezim, Uloga } from '../../prica/tipovi'
import { NAPOMENA_DEMO, NAZIV_ULOGE, OZNAKA_DEMO, UVOD_ULOGE } from '../../tekstovi/prica'

export default function C1Ulaz() {
  const { ulaz, rezim: sacuvan } = usePrica()
  const [uloga, setUloga] = useState<Uloga>('selling')
  const [rezim, setRezim] = useState<Rezim>(sacuvan)

  return (
    <div className="entry" data-ekran="C1">
      <header className="entrytop on-dark">
        <LogoZaglavlje />
        <span className="demo-pill" data-oznaka-demo="da">{OZNAKA_DEMO}</span>
      </header>
      <main className="entrymain" id="sadrzaj">
        <div className="stack">
          <h1>Welcome to the GoalToCart demo</h1>
          <p className="muted" style={{ fontSize: 16 }}>
            Follow one international transfer from first offer to last installment — or click around freely.
          </p>
        </div>

        <section aria-labelledby="uloge-h" className="stack-lg">
          <h2 id="uloge-h" className="eyebrow" style={{ fontWeight: 600 }}>Choose who you want to be</h2>
          <div className="rolecards">
            {ULOGE.map((u) => (
              <button key={u} type="button" className="rolecard" aria-pressed={u === uloga} onClick={() => setUloga(u)} data-uloga={u}>
                <span className="tickmark"><Ikona ime="check" /></span>
                <b>{NAZIV_ULOGE[u]}</b>
                <span>{UVOD_ULOGE[u]}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="entryactions">
          <button type="button" className="btn btn-primary btn-lg" onClick={() => ulaz(uloga, rezim)} data-enter-demo>
            Enter demo
          </button>
          <div role="group" aria-label="Mode" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="muted">Mode:</span>
            <div className="modegroup">
              <button type="button" aria-pressed={rezim === 'guided'} onClick={() => setRezim('guided')}>Guided story (recommended)</button>
              <button type="button" aria-pressed={rezim === 'free'} onClick={() => setRezim('free')}>Free exploration</button>
            </div>
          </div>
        </div>

        <p className="muted">No password needed. All data is fictional. Nothing is sent; your place in the story is remembered only in this browser tab.</p>

        <footer className="legal">
          <span>{NAPOMENA_DEMO}</span>
          <Link to="/about">About this demo</Link>
        </footer>
      </main>
    </div>
  )
}
