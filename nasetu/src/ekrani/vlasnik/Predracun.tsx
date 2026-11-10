// V — Predračun vlasnika (B1): izmišljen predračun za profesionalno fotografisanje prostora. Nema dugmeta "Plati".
import { Link, Navigate, useParams } from 'react-router'
import { PredracunKartica } from '../../komponente/PredracunKartica'
import { Kartica, Naslov, Stranica } from '../../komponente/osnovno'
import { nazivAktera, TIP_VLASNIKA } from '../../podaci/akteri'
import { akterTrenutni } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'
import { PrebaciPrikaz } from './PrebaciPrikaz'

export default function Predracun() {
  const { id = '' } = useParams()
  const { stanje } = useStanje()
  const p = stanje.predracuni.find((x) => x.id === id && x.vrsta === 'fotografisanje')
  if (!p) return <Navigate to="/vlasnik" replace />
  if (p.kupacId !== akterTrenutni(stanje)) return <PrebaciPrikaz vlasnikId={p.kupacId} />
  const prijava = stanje.prijaveLokacija.find((x) => x.id === p.prijavaId)
  return (
    <Stranica uzak>
      <Naslov>Vaš predračun</Naslov>
      <PredracunKartica predracun={p} kupac={nazivAktera(p.kupacId)} lokacija={prijava?.naziv ?? ''} opisCene="" />
      <Kartica className="mx-auto mt-6 max-w-[720px] p-5 text-sm">
        <p className="font-semibold">{p.uplataPotvrdjena !== null ? 'Uplata je potvrđena.' : 'Čeka uplatu. Uplatu potvrđuje Admin (u prototipu).'}</p>
        {TIP_VLASNIKA[p.kupacId] === 'fizicko' && (
          <p className="mt-2 text-sek">Za fizička lica proveriti sa knjigovođom (fiskalni račun). To je pitanje za knjigovođu, ne za prototip.</p>
        )}
      </Kartica>
      <p className="mx-auto mt-6 max-w-[720px]"><Link to="/vlasnik" className="font-semibold text-akcent hover:underline">← Nazad na tablu</Link></p>
    </Stranica>
  )
}
