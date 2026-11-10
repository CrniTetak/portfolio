// Ruter: C1 na korenu, C3 na /about, ostali ekrani na #/<uloga>/<ekran> (lista ruta je jedan podatak: pravila/rute.ts).
import { Navigate, Route, Routes } from 'react-router'
import { Okvir } from './okvir/Okvir'
import { komponentaZa } from './ekrani'
import C1Ulaz from './ekrani/zajednicki/C1Ulaz'
import C2PregledTransfera from './ekrani/zajednicki/C2PregledTransfera'
import { EKRANI, TABLA, putZa } from './pravila/rute'
import { usePrica } from './prica/PricaProvider'
import { Napomena } from './komponente/Kartica'
import { Link } from 'react-router'

/** Nepostojeća ruta vodi na tablu uloge, uz kratku poruku. */
function NemaRute() {
  const { uloga } = usePrica()
  return (
    <div className="page">
      <Napomena>That page does not exist in this demo. Here is your dashboard instead.</Napomena>
      <div>
        <Link className="btn btn-primary" to={putZa(TABLA[uloga])}>Go to the dashboard</Link>
      </div>
      <Navigate to={putZa(TABLA[uloga])} replace state={{ nemaRute: true }} />
    </div>
  )
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<C1Ulaz />} />
      <Route element={<Okvir />}>
        {EKRANI.filter((e) => e.id !== 'C1').map((e) => {
          const Komponenta = komponentaZa(e.id)
          return <Route key={e.id} path={e.putanja} element={<Komponenta />} />
        })}
        <Route path="selling/transfers/:id" element={<C2PregledTransfera uloga="selling" />} />
        <Route path="buying/transfers/:id" element={<C2PregledTransfera uloga="buying" />} />
        <Route path="*" element={<NemaRute />} />
      </Route>
    </Routes>
  )
}
