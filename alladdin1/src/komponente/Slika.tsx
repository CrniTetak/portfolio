// Fotografija iz spiska (podaci/fotografije.ts): srcset 800/1600, fiksne razmere (nema skakanja), zatamnjenje u CSS-u (UI 5).
// Slika koje nema u spisku ne može da se prikaže (a test ne dozvoljava ni fajl bez spiska).
import { fotografija } from '../podaci/fotografije'

export function Slika({ id, prva = false, hero = false, sizes = '(min-width: 1024px) 1160px, 100vw' }: { id: string; prva?: boolean; hero?: boolean; sizes?: string }) {
  const f = fotografija(id)
  const osnova = `${import.meta.env.BASE_URL}slike/${f.id}`
  return (
    <div className={hero ? "slika slika-hero" : "slika"}>
      <img
        src={`${osnova}-800.webp`}
        srcSet={f.sirine.map((w) => `${osnova}-${w}.webp ${w}w`).join(", ")}
        sizes={sizes}
        alt={f.ukrasna ? '' : f.alt}
        width={800}
        height={450}
        loading={prva ? 'eager' : 'lazy'}
        decoding="async"
      />
    </div>
  )
}

/** Neutralna pozadina umesto fotografije (da se ista slika ne ponavlja na ekranima koji nemaju svoju): isti okvir kao Slika, bez fajla. */
export function PozadinaBezSlike({ hero = false }: { hero?: boolean }) {
  return <div className={`slika slika-neutralna${hero ? ' slika-hero' : ''}`} aria-hidden="true" />
}
