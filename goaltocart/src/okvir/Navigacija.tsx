// Navigacija po ulozi: bočna (računar), donja (telefon, Free režim) i meni "≡" (telefon, Guided režim).
import { useLocation, Link } from 'react-router'
import { Ikona } from '../komponente/Ikona'
import type { ImeIkone } from '../komponente/Ikona'
import { usePrica } from '../prica/PricaProvider'
import { NAVIGACIJA, donjaNavigacija, idEkrana, putZa } from '../pravila/rute'
import type { StavkaNav } from '../pravila/rute'
import { odobrenjeDepozita, odobrenjeUstupanja } from '../pravila/izvedeno'
import { ESCROW } from '../scenario/strane'
import { NAZIV_ULOGE } from '../tekstovi/prica'
import { useRef } from 'react'
import { useFocusTrap } from './useFocusTrap'

const IKONA: Record<StavkaNav['ikona'], ImeIkone> = {
  home: 'home', swap: 'swap', wallet: 'wallet', bank: 'bank', shield: 'shield', user: 'user', doc: 'doc', file: 'file', lock: 'lock', list: 'list', eye: 'eye', badge: 'badge',
}

function useAktivan() {
  const loc = useLocation()
  return idEkrana(loc.pathname)?.ekran ?? null
}

function useBrojac() {
  const { poz, uloga } = usePrica()
  // Odobrenja na čekanju: jedna stavka dok je prva odobrena, ali nije dovršena
  if (uloga === 'selling') {
    const o = odobrenjeUstupanja(poz)
    return o.vidljivo && !o.zavrseno ? 1 : 0
  }
  if (uloga === 'buying') {
    const o = odobrenjeDepozita(poz)
    return o.vidljivo && !o.zavrseno ? 1 : 0
  }
  return 0
}

export function BocnaNavigacija() {
  const { uloga } = usePrica()
  const aktivan = useAktivan()
  const brojac = useBrojac()
  return (
    <nav className="sidenav" aria-label="Main">
      <div className="navlabel">{NAZIV_ULOGE[uloga]}</div>
      {NAVIGACIJA[uloga].map((s) => {
        const tren = aktivan === s.cilj || (aktivan !== null && s.aktivna.includes(aktivan))
        return (
          <Link key={s.cilj} className="nav-item" to={putZa(s.cilj)} aria-current={tren ? 'page' : undefined} title={s.oznaka}>
            <Ikona ime={IKONA[s.ikona]} />
            <span className="t-lbl">{s.oznaka}</span>
            {s.oznaka === 'Approvals' && brojac > 0 && <span className="count" aria-label={`${brojac} pending`}>{brojac}</span>}
          </Link>
        )
      })}
      {(uloga === 'selling' || uloga === 'buying') && <div className="foot">Escrow partner: {ESCROW.naziv} ({'fictional'})</div>}
    </nav>
  )
}

export function DonjaNavigacija() {
  const { uloga, setMeni, meni } = usePrica()
  const aktivan = useAktivan()
  const { glavne, vise } = donjaNavigacija(uloga)
  return (
    <nav className="bottomnav" aria-label="Main">
      {glavne.map((s) => {
        const tren = aktivan === s.cilj || (aktivan !== null && s.aktivna.includes(aktivan))
        return (
          <Link key={s.cilj} to={putZa(s.cilj)} aria-current={tren ? 'page' : undefined}>
            <Ikona ime={IKONA[s.ikona]} />
            {s.oznaka}
          </Link>
        )
      })}
      {vise.length > 0 && (
        <button type="button" onClick={() => setMeni(!meni)} aria-expanded={meni} aria-haspopup="dialog">
          <Ikona ime="more" />
          More
        </button>
      )}
    </nav>
  )
}

/** Meni preko ekrana (telefon): cela navigacija uloge + "About this demo". */
export function Meni() {
  const { uloga, meni, setMeni } = usePrica()
  const aktivan = useAktivan()
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, meni, () => setMeni(false))
  if (!meni) return null
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Menu" data-meni="da">
      <div className="scrim" onClick={() => setMeni(false)} />
      <div className="menu" ref={ref}>
        <div className="navlabel">{NAZIV_ULOGE[uloga]}</div>
        {NAVIGACIJA[uloga].map((s) => {
          const tren = aktivan === s.cilj || (aktivan !== null && s.aktivna.includes(aktivan))
          return (
            <Link key={s.cilj} className="nav-item" to={putZa(s.cilj)} aria-current={tren ? 'page' : undefined} onClick={() => setMeni(false)}>
              <Ikona ime={IKONA[s.ikona]} />
              <span className="t-lbl">{s.oznaka}</span>
            </Link>
          )
        })}
        <Link className="nav-item" to="/about" onClick={() => setMeni(false)}>
          <Ikona ime="info" />
          <span className="t-lbl">About this demo</span>
        </Link>
        <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: 8 }} data-prvi-fokus onClick={() => setMeni(false)}>
          Close menu
        </button>
      </div>
    </div>
  )
}
