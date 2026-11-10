// APLIKACIJA: okvir demoa (oznaka gore, traka priče dole) + sadržaj. Uvodni ekrani i table su cela strana;
// svi ostali linkovi (#/tv/…) otvaraju raspored televizor + telefon (ili jedan uređaj na uskom ekranu).
import { useLocation } from 'react-router'
import { StranaSadrzaj } from './ekrani'
import { DijalogRestarta } from './okvir/Dijalog'
import { DemoProvider } from './okvir/stanje'
import { OznakaDemoa } from './okvir/OznakaDemoa'
import { Raspored } from './okvir/Raspored'
import { ToastProvider } from './okvir/Toast'
import { TrakaPrice } from './okvir/TrakaPrice'
import { sastavi } from './pravila/ekrani'
import { FokusProvider } from './tv-navigacija/fokus'
import { TvRuta } from './tv-navigacija/ruta'

function Sadrzaj() {
  const { pathname } = useLocation()
  const naTelevizoru = pathname === '/tv' || pathname.startsWith('/tv/')
  const uvod = [sastavi('U1'), sastavi('U2'), sastavi('U3')].includes(pathname)
  return (
    <div className="stranica">
      <OznakaDemoa />
      <main className="sredina">{naTelevizoru ? <Raspored /> : <StranaSadrzaj />}</main>
      {!uvod && <TrakaPrice />}
      <DijalogRestarta />
    </div>
  )
}

export function App() {
  return (
    <ToastProvider>
      <FokusProvider>
        <TvRuta>
          <DemoProvider>
            <Sadrzaj />
          </DemoProvider>
        </TvRuta>
      </FokusProvider>
    </ToastProvider>
  )
}
