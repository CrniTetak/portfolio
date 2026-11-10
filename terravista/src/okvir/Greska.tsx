// ErrorBoundary (nikad beli ekran): ako bilo koji deo demoa pukne, prikazuje se kratka poruka sa oznakom demoa i dugme „Vrati na početak“.
// Ne zavisi ni od jednog provajdera (oni su ispod); čišćenje je samo brisanje sačuvanog stanja i povratak na uvodni ekran.
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { KLJUC_CUVANJA } from '../podaci/svet'
import { OznakaDemoa } from './OznakaDemoa'

type Stanje = { puklo: boolean }

export class Greska extends Component<{ children: ReactNode }, Stanje> {
  state: Stanje = { puklo: false }

  static getDerivedStateFromError(): Stanje {
    return { puklo: true }
  }

  componentDidCatch(greska: Error, info: ErrorInfo): void {
    // samo u konzoli (nema slanja nigde)
    console.error('Greška u demou:', greska, info.componentStack)
  }

  vrati = () => {
    try {
      sessionStorage.removeItem(KLJUC_CUVANJA)
    } catch {
      /* skladište blokirano: nema šta da se briše */
    }
    window.location.hash = '#/'
    window.location.reload()
  }

  render() {
    if (!this.state.puklo) return this.props.children
    return (
      <div className="greska-okvir" role="alert">
        <OznakaDemoa />
        <div className="strana">
          <div className="strana-sadrzaj">
            <h1>Nešto nije u redu u demou</h1>
            <p>Ništa se nije sačuvalo ni poslalo. Vrati demo na početak i probaj ponovo.</p>
            <button type="button" className="strana-veza" onClick={this.vrati}>
              Vrati na početak
            </button>
          </div>
        </div>
      </div>
    )
  }
}
