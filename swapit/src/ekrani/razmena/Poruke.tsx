// C1 „Poruke“ (UX 6.6): lista razgovora sa poslednjom porukom i oznakom nepročitano; klik otvara C2. Razgovori su unapred napisani (prikaz); razmene koje
// gledalac napravi u slobodnom toku dodaju razgovor sa drugom stranom, a lanac iz priče stoji ovde kad ga sva trojica prihvate.
import { Inicijali } from '../../komponente/Inicijali'
import { Obavestenje } from '../../komponente/Obavestenje'
import { Veza } from '../../komponente/Veza'
import { useStanjePrice } from '../../demo/useStanje'
import { useEkran } from '../../okvir/kontekst'
import { PORUKE_LANCA } from '../../scenario/prica'
import { RAZGOVORI_PO_UGLU } from '../../scenario/slobodno'
import { FIRMA_PO_ID, KORISNIK_PO_ID } from '../../scenario/svet'
import { PODRSKA_NAZIV } from '../../scenario/strane'
import { drugaStrana } from '../../tokovi/operacije'

const POSLEDNJA_RAZMENA = 'Dogovor o predaji je u toku.'

export function C1() {
  const { ugao } = useEkran()
  const { tokovi, uradjeno, ja } = useStanjePrice()
  if (ugao !== 'ana' && ugao !== 'marko' && ugao !== 'prodavnica') return null
  const osnova = RAZGOVORI_PO_UGLU[ugao]
  // razmene iz slobodnog toka: razgovor sa drugom stranom (jednom po osobi)
  const iz = ja ? tokovi.razmene.filter((r) => r.vlasnik === ja || r.od === ja).map((r) => drugaStrana(r, ja)) : []
  const dodatni = [...new Set(iz)].filter((id) => !osnova.some((o) => o.id === id)).map((id) => ({ id, poslednja: POSLEDNJA_RAZMENA, neprocitano: false }))
  const lanac = ugao !== 'prodavnica' && uradjeno('6.jovana') ? [{ id: 'lanac', poslednja: PORUKE_LANCA[PORUKE_LANCA.length - 1].tekst, neprocitano: true }] : []
  const lista = [...lanac, ...osnova, ...dodatni]
  const naziv = (id: string) => (id === 'lanac' ? 'Lanac razmene' : id === 'podrska' ? PODRSKA_NAZIV : (FIRMA_PO_ID[id]?.naziv ?? KORISNIK_PO_ID[id]?.id ?? id))
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="C1">
      <h1>Poruke</h1>
      <ul className="stog-sm" data-razgovori>
        {lista.map((r) => (
          <li key={r.id} className="stavka" data-razgovor={r.id}>
            <div className="stavka-glavna flex items-center gap-3">
              <Inicijali ime={naziv(r.id)} velicina={40} firma={!!FIRMA_PO_ID[r.id]} />
              <div className="stog-sm">
                <b>{naziv(r.id)}</b>
                <span className="pomocni-tekst">{r.poslednja}</span>
              </div>
            </div>
            <div className="stavka-akcije">
              {r.neprocitano && (
                <span className="znacka znacka-poklon" data-neprocitano>
                  Nepročitano
                </span>
              )}
              <Veza ekran="C2" parametri={{ razgovor: r.id }} className="dugme dugme-plavo">
                Otvori
              </Veza>
            </div>
          </li>
        ))}
      </ul>
      <Obavestenje>Telefon se otkriva tek posle prihvaćene ponude. Demo poruke — ništa se ne šalje.</Obavestenje>
    </section>
  )
}
