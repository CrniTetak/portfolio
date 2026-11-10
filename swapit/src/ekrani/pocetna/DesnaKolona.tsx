// Desna kolona početne (UX 6.3 P1): „Sponzorisano“ (dve reklame sa podatkom ko oglašava) i PREMIUM (javna aukcija, top ponuda, istaknuto).
// Koristi se i ispod oglasa (O1). Sve plaćeno nosi oznaku: „Sponzorisano“ ili „Istaknuto · plaćeno“.
import { Bike, Wrench } from 'lucide-react'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Veza } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useStanjePrice } from '../../demo/useStanje'
import { REKLAMA_PEDALA, REKLAMA_ZUPCANIK, REKLAMA_ZUPCANIK_AKCIJA, nazivFirme, type Reklama } from '../../scenario/prica'

function ReklamaKartica({ r, ka }: { r: Reklama; ka: 'F4' | 'A1' }) {
  return (
    <article className="reklama" data-reklama={r.firma} aria-label={`Sponzorisano: ${r.naslov}`}>
      <Znacka vrsta="sponzorisano" />
      <div className="reklama-glava">
        <span className="reklama-ikona" aria-hidden>
          {r.ikonica === 'bike' ? <Bike size={28} strokeWidth={1.75} /> : <Wrench size={28} strokeWidth={1.75} />}
        </span>
        <div>
          <h3>{r.naslov}</h3>
          <p className="pomocni-tekst">Oglašava: {nazivFirme(r.firma)}</p>
        </div>
      </div>
      <p className="pomocni-tekst">{r.opis}</p>
      <Veza ekran={ka} parametri={ka === 'F4' ? { firma: r.firma } : undefined} className="dugme dugme-plavo">
        Saznaj više
      </Veza>
    </article>
  )
}

export function DesnaKolona() {
  const { s, uradjeno, tokovi } = useStanjePrice()
  const aukcija = s.oglasi.find((o) => o.aukcija)
  const top = s.oglasi.find((o) => o.istaknuto === 'top')
  const premium = s.oglasi.filter((o) => o.istaknuto === 'premium' && o !== aukcija)
  // N-3: reklama akcije se pojavljuje tek posle plaćanja akcije (9.z4 u priči ili plaćanje u slobodnom toku)
  const akcija = uradjeno('9.z4') || tokovi.poslovno.akcija
  // F9: plaćena reklama (odredište „akcija“) se odmah vidi u desnoj koloni; „profil“ je uvek tu
  const reklamaAkcije = akcija || tokovi.poslovno.reklama === 'akcija'
  return (
    <aside className="p1-desno" aria-label="Sponzorisano i PREMIUM" data-desna-kolona>
      <section className="stog-sm" aria-label="Sponzorisano">
        <h2 className="sr-only">Sponzorisano</h2>
        <ReklamaKartica r={REKLAMA_PEDALA} ka="F4" />
        <ReklamaKartica r={reklamaAkcije ? REKLAMA_ZUPCANIK_AKCIJA : REKLAMA_ZUPCANIK} ka={reklamaAkcije ? 'A1' : 'F4'} />
      </section>
      <section className="premium" aria-label="PREMIUM" data-premium>
        <h2>Premium</h2>
        <Znacka vrsta="istaknuto" />
        <p className="premium-podnaslov">Javna aukcija</p>
        {aukcija && <KarticaOglasa oglas={aukcija} plava ka="J2" />}
        <p className="premium-podnaslov">Top ponuda</p>
        {top && <KarticaOglasa oglas={top} plava />}
        {premium[0] && (
          <>
            <p className="premium-podnaslov">Premium oglas</p>
            <KarticaOglasa oglas={premium[0]} plava />
          </>
        )}
        <Veza ekran="J1" className="premium-link">
          Vidi sve →
        </Veza>
      </section>
    </aside>
  )
}
