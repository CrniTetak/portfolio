// Fotografija oglasa (PLAN B6.4): srcset po nameni, fiksne razmere (nema „skakanja“ pri učitavanju), lazy učitavanje osim prve slike.
// Fajlovi su u public/slike/<id>-<namena>-<širina>.webp i prave ih skripte/slike.mjs; spisak i licence su u podaci/fotografije.ts.
import { FOTOGRAFIJE, type Namena } from '../podaci/fotografije'
import { PRERADA_LICENCA, adresaLicence, nazivDela, punNazivLicence } from '../podaci/licence'

const SIRINE: Record<Namena, number[]> = { kartica: [400, 800], detalj: [800, 1600], prica: [320, 640], reklama: [800] }
const RAZMERA: Record<Namena, [number, number]> = { kartica: [1, 1], detalj: [4, 3], prica: [5, 7], reklama: [16, 9] }

type Props = { id: string; namena: Namena; prva?: boolean; className?: string; velicine?: string }

export function Slika({ id, namena: trazena, prva = false, className, velicine }: Props) {
  const f = FOTOGRAFIJE.find((x) => x.id === id)
  if (!f) return null
  // slika koja se pravi samo za neke namene (npr. samo kartica) koristi prvu koju ima
  const namena: Namena = f.namene.includes(trazena) ? trazena : f.namene[0]
  const osnova = `${import.meta.env.BASE_URL}slike/${id}-${namena}-`
  const sirine = SIRINE[namena]
  const [rw, rh] = RAZMERA[namena]
  const najmanja = sirine[0]
  return (
    <img
      className={className}
      src={`${osnova}${najmanja}.webp`}
      srcSet={sirine.map((w) => `${osnova}${w}.webp ${w}w`).join(', ')}
      sizes={velicine ?? `${najmanja}px`}
      width={najmanja}
      height={Math.round((najmanja * rh) / rw)}
      alt={trazena === 'detalj' || trazena === 'reklama' ? f.alt : ''} // P-S6: na karticama u listama alt je prazan (naslov je odmah pored), na detalju je opis prizora
      loading={prva ? 'eager' : 'lazy'}
      decoding="async"
      data-slika={id}
    />
  )
}

/** Red ispod velike slike (CC BY / CC BY-SA traži navođenje autora): „Foto: Autor · licenca · Wikimedia Commons“. Adresa je samo tekst. */
export function NavodjenjeAutora({ id }: { id: string }) {
  const f = FOTOGRAFIJE.find((x) => x.id === id)
  if (!f) return null
  return (
    <p className="pomocni-tekst" data-navodjenje>
      Foto: {f.autor} · {nazivDela(f.naslovNaCommons)} · {punNazivLicence(f.licenca)} · Wikimedia Commons
      {adresaLicence(f.licenca) && <> · Tekst licence: {adresaLicence(f.licenca)}</>}
      <br />
      {PRERADA_LICENCA}
    </p>
  )
}
