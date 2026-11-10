// U3 „O ovom demou“ (UX 6.1): šta demo jeste i šta nije, crvene linije platforme, ilustrativni iznosi, poeni (model u proveri), ilustrativna mapa,
// kako je demo napravljen, izmišljena imena i izvori slika (PK4: navođenje autora). Bez brojki poslovnog modela.
import { IzvoriSlika } from '../komponente/IzvoriSlika'
import { Veza } from '../komponente/Veza'
import { useEkran } from '../okvir/kontekst'
import { KUCA } from '../pravila/rute'
import { FIRME, KORISNICI, REGION_KORISNICI } from '../scenario/svet'
import { KURIR, MODERATORKA, PRUZALAC_USLUGE, REF_AKCIJA_PRIJAVA, REF_PLACANJE, REF_POSILJKA, TELEFON_DEMO } from '../scenario/strane'
import { CRVENE_LINIJE, U3_ILUSTRATIVNI_IZNOSI, U3_JESTE, U3_KAKO_JE_NAPRAVLJEN, U3_MAPA, U3_NIJE, U3_POENI } from '../scenario/stranice'

export function U3() {
  const { ugao } = useEkran()
  return (
    <section className="kartica mx-auto max-w-4xl stog" data-ekran-sadrzaj="U3">
      <h1>O ovom demou</h1>
      <p>Svi podaci, imena i brojke u ovom demou su izmišljeni. Ništa se ne šalje i ne naplaćuje; ono što uradiš pamti se samo dok je prozor otvoren.</p>
      <div className="dva-stupca dva-stupca-jednaka">
        <section className="kartica kartica-mirna stog-sm" aria-label="Šta ovaj demo jeste" data-u3-jeste>
          <h2>Šta ovaj demo jeste</h2>
          <ul className="lista-pravila">
            {U3_JESTE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
        <section className="kartica kartica-mirna stog-sm" aria-label="Šta ovaj demo nije" data-u3-nije>
          <h2>Šta nije</h2>
          <ul className="lista-pravila">
            {U3_NIJE.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="stog-sm" aria-label="Šta SWAPIT namerno ne radi" data-crvene-linije>
        <h2>Šta SWAPIT namerno ne radi</h2>
        <ol className="lista-pravila">
          {CRVENE_LINIJE.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ol>
        <Veza ekran="S2" className="dugme dugme-tekst self-start">
          Spisak zabranjenih stvari
        </Veza>
      </section>
      <section className="stog-sm" aria-label="Ilustrativni iznosi" data-ilustrativni-iznosi>
        <h2>Ilustrativni iznosi</h2>
        <p>{U3_ILUSTRATIVNI_IZNOSI}</p>
      </section>
      <section className="stog-sm" aria-label="Poeni">
        <h2>Poeni — model u proveri</h2>
        <p>{U3_POENI}</p>
      </section>
      <section className="stog-sm" aria-label="Ilustrativna mapa" data-ilustrativna-mapa>
        <h2>Ilustrativna mapa</h2>
        <p>{U3_MAPA}</p>
      </section>
      <section className="stog-sm" aria-label="Kako je demo napravljen" data-kako-je-napravljen>
        <h2>Kako je demo napravljen</h2>
        <ul className="lista-pravila">
          {U3_KAKO_JE_NAPRAVLJEN.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </section>
      <section className="stog-sm" aria-label="Izmišljeni nazivi i imena" data-izmisljena-imena>
        <h2>Izmišljeni nazivi i imena</h2>
        <p className="pomocni-tekst">Firme: {FIRME.map((f) => f.naziv).join(', ')}. Kurirska služba: {KURIR}. Pružalac usluge: {PRUZALAC_USLUGE}. Moderatorka: {MODERATORKA}.</p>
        <p className="pomocni-tekst">
          Korisnici: {KORISNICI.slice(0, 9).map((k) => k.id).join(', ')} i još {KORISNICI.length - 9 + REGION_KORISNICI.length} izmišljenih naloga iz Beograda i regiona.
        </p>
        <p className="pomocni-tekst">
          Očigledno lažni podaci: {TELEFON_DEMO}, {REF_POSILJKA}, {REF_AKCIJA_PRIJAVA}, {REF_PLACANJE}.
        </p>
      </section>
      <IzvoriSlika />
      <div className="red-dugmad">
        <Veza ekran="U2" className="dugme dugme-zeleno">
          Uđi u demo
        </Veza>
        <Veza ekran={KUCA[ugao]} className="dugme dugme-linija">
          Nazad
        </Veza>
      </div>
    </section>
  )
}
