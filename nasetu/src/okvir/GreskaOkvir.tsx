// Poslednja mreža: ako ekran pukne, vlasnik vidi jasnu poruku i dugme Reset umesto praznog prozora.
import { Component, type ReactNode } from 'react'
import { KLJUC_SESIJE } from '../stanje/tipovi'

export class GreskaOkvir extends Component<{ children: ReactNode }, { greska: boolean }> {
  state = { greska: false }
  static getDerivedStateFromError() { return { greska: true } }

  /** Briše sačuvano stanje i kreće iz početnog scenarija. */
  private reset = () => {
    try { sessionStorage.removeItem(KLJUC_SESIJE) } catch { /* nebitno */ }
    window.location.hash = '#/'
    window.location.reload()
  }

  render() {
    if (!this.state.greska) return this.props.children
    return (
      <div className="min-h-screen bg-traka">
        <div className="bg-prototip-s px-4 py-1.5 text-[13px] text-prototip-tekst" role="note">
          <b className="tracking-[0.08em]">PROTOTIP</b> — izmišljeni podaci. Ništa se ne šalje.
        </div>
        <main className="mx-auto max-w-xl px-4 py-16">
          <h1 className="text-[26px] md:text-[32px]">Prototip je naišao na grešku</h1>
          <p className="mt-3 text-sek">Ništa nije izgubljeno osim onoga što ste kliknuli u ovoj sesiji. Reset vraća početni scenario.</p>
          <button
            type="button" onClick={this.reset}
            className="mt-6 inline-flex h-11 cursor-pointer items-center rounded-dugme bg-akcent px-5 font-semibold text-white hover:bg-akcent-t"
          >Reset</button>
        </main>
      </div>
    )
  }
}
