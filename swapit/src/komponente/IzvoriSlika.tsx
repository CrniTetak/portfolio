// „Izvori slika“ (PK4): autor, licenca, naziv dela i izvor (kao TEKST, demo nema spoljnih linkova) za SVAKU fotografiju iz spiska.
// Isti izvor deli više slika (npr. bicikl), pa se svaki izvor navodi jednom. Koristi se na ekranu „O ovom demou“ (U3).
import { FOTOGRAFIJE } from '../podaci/fotografije'
import { PRERADA_LICENCA, adresaLicence, nazivDela, punNazivLicence } from '../podaci/licence'

/** Jedinstveni izvori (po stranici na Commons-u) sa spiskom slika koje iz njih potiču. */
export function izvoriSlika() {
  const po = new Map<string, { f: (typeof FOTOGRAFIJE)[number]; slike: string[] }>()
  for (const f of FOTOGRAFIJE) {
    const stavka = po.get(f.stranica)
    if (stavka) stavka.slike.push(f.alt)
    else po.set(f.stranica, { f, slike: [f.alt] })
  }
  return [...po.values()]
}

export function IzvoriSlika() {
  return (
    <section aria-labelledby="izvori-slika-naslov" data-izvori-slika>
      <h2 id="izvori-slika-naslov">Izvori slika</h2>
      <p className="pomocni-tekst mt-1">Fotografije su sa Wikimedia Commons-a, umanjene i isečene. Navodimo autora, licencu i izvor. Adrese su samo tekst.</p>
      <p className="pomocni-tekst mt-1" data-prerada-licenca>{PRERADA_LICENCA}</p>
      <ul className="stog-sm mt-3">
        {izvoriSlika().map(({ f, slike }) => (
          <li key={f.stranica} className="stavka" data-izvor={f.id}>
            <div className="stavka-glavna stog-sm">
              <p>
                <b>{slike.join(' · ')}</b>
              </p>
              <p className="pomocni-tekst">
                Autor: {f.autor} · Delo: {nazivDela(f.naslovNaCommons)} · Licenca: {punNazivLicence(f.licenca)}
                {adresaLicence(f.licenca) && <> · Tekst licence: {adresaLicence(f.licenca)}</>}
              </p>
              <p className="pomocni-tekst break-all">Izvor: {f.stranica}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
