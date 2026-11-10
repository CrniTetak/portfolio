// Fotografija lokacije. Slike dolaze iz podaci/fotografije.ts (puni ih drugi agent) i nalaze se
// u public/slike/. Dok za lokaciju nema slika, prikazuje se neutralna siva pločica sa tipom prostora.
import { Image as IkonaSlike } from 'lucide-react'
import { FOTOGRAFIJE, HERO, type Fotografija } from '../podaci/fotografije'
import type { Lokacija } from '../podaci/lokacije'

/** Putanja do jedne veličine slike (800 ili 1600 px široka WebP). Radi i kad se sajt ne nalazi u korenu. */
export function putanjaSlike(fajl: string, sirina: 800 | 1600): string {
  return `${import.meta.env.BASE_URL}${fajl.replace(/^\/+/, '')}-${sirina}.webp`
}

export function fotografijeLokacije(id: string): Fotografija[] {
  return FOTOGRAFIJE[id] ?? []
}

/** Slika sa dve veličine (srcset). `prva` = bez lenjog učitavanja (prva slika na ekranu). */
export function Slika({
  foto, prva = false, sizes = '(min-width: 1024px) 384px, 100vw', className = '',
}: { foto: Fotografija; prva?: boolean; sizes?: string; className?: string }) {
  return (
    <img
      src={putanjaSlike(foto.fajl, 800)}
      srcSet={`${putanjaSlike(foto.fajl, 800)} 800w, ${putanjaSlike(foto.fajl, 1600)} 1600w`}
      sizes={sizes}
      alt={foto.alt}
      loading={prva ? 'eager' : 'lazy'}
      decoding="async"
      className={`h-full w-full object-cover ${className}`}
    />
  )
}

/** Siva pločica kad nema fotografije: nikad nasumična slika. */
export function Ploca({ tekst, className = '' }: { tekst: string; className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-[#EBE8E5] text-sek ${className}`}>
      <IkonaSlike size={32} strokeWidth={1.25} aria-hidden />
      <span className="px-2 text-center text-sm font-semibold">{tekst}</span>
    </div>
  )
}

/** Naslovna slika kartice (prva fotografija lokacije) ili siva pločica sa tipom prostora. */
export function NaslovnaSlika({ lokacija, prva = false }: { lokacija: Lokacija; prva?: boolean }) {
  const foto = fotografijeLokacije(lokacija.id)[0]
  // sizes odgovaraju stvarnoj širini kartice (1/2/3 kolone), da tablet ne vuče preveliku sliku
  const sizes = '(min-width: 1280px) 340px, (min-width: 1024px) 320px, (min-width: 768px) 32vw, (min-width: 640px) 48vw, 100vw'
  return foto ? <Slika foto={foto} prva={prva} sizes={sizes} /> : <Ploca tekst={lokacija.tip} />
}

/** Slika za hero na početnoj; null ako je nema (tada ostaje tamni preliv). */
export function HeroSlika() {
  if (!HERO.fajl) return null
  return (
    <img
      src={putanjaSlike(HERO.fajl, 1600)}
      srcSet={`${putanjaSlike(HERO.fajl, 800)} 800w, ${putanjaSlike(HERO.fajl, 1600)} 1600w`}
      sizes="100vw"
      alt=""
      aria-hidden
      loading="eager"
      className="absolute inset-0 h-full w-full object-cover"
    />
  )
}
