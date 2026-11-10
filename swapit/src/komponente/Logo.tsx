// LOGO (BREND.md): pun logo, znak i jabučica kao inline SVG iz dizajn/logo/ (oblik, razmere i boje se ne menjaju).
// Inline je zato što SVG u <img> ne vidi spakovani font (slogan koristi Bebas Neue); pun logo se koristi samo kad je širi od 120 px.
// Jedinstveni id-jevi gradijenata (useId) da više logoa na istoj strani ne dele id.
import { useId } from 'react'

const TRAKA_PUTANJA = 'M80 108 C62 92 98 80 114 66'
const TRAKA_GLAVA = '136.6,43.4 133.1,85.1 94.9,46.9'

function Trake({ prefiks, transformacija }: { prefiks: string; transformacija: string }) {
  return (
    <g transform={transformacija} fill="#F2F2F4" stroke="#F2F2F4">
      <g id={`${prefiks}-traka`}>
        <path d={TRAKA_PUTANJA} fill="none" strokeWidth="26" strokeLinecap="round" />
        <polygon points={TRAKA_GLAVA} strokeWidth="2" strokeLinejoin="round" />
      </g>
      <g transform="rotate(180 100 104)">
        <path d={TRAKA_PUTANJA} fill="none" strokeWidth="26" strokeLinecap="round" />
        <polygon points={TRAKA_GLAVA} strokeWidth="2" strokeLinejoin="round" />
      </g>
    </g>
  )
}

function Nalepnica({ telo, ugao }: { telo: string; ugao: string }) {
  return (
    <>
      <path d="M188.9 123.8 A92 92 0 1 0 117.6 190.3 Q143 143 188.9 123.8 Z" fill={`url(#${telo})`} />
      <path d="M188.9 123.8 A92 92 0 1 0 117.6 190.3" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M117.6 190.3 Q143 143 188.9 123.8 Q128 146 117.6 190.3 Z" fill="#00305F" fillOpacity="0.3" />
      <path d="M188.9 123.8 Q172 172 117.6 190.3 Q143 143 188.9 123.8 Z" fill={`url(#${ugao})`} stroke="#B8BAC2" strokeWidth="0.7" strokeLinejoin="round" />
    </>
  )
}

function Gradijenti({ telo, ugao }: { telo: string; ugao: string }) {
  return (
    <>
      <linearGradient id={telo} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#2A8EDB" />
        <stop offset="1" stopColor="#19B4F3" />
      </linearGradient>
      <linearGradient id={ugao} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#C9CBD2" />
      </linearGradient>
    </>
  )
}

/** Samo znak (nalepnica sa dve strelice): zaglavlje, 40 px. */
export function Znak({ velicina = 40, naslov = 'SWAPIT' }: { velicina?: number; naslov?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width={velicina} height={velicina} role="img" aria-label={naslov} className="znak">
      <defs>
        <Gradijenti telo={`${id}-t`} ugao={`${id}-u`} />
      </defs>
      <Nalepnica telo={`${id}-t`} ugao={`${id}-u`} />
      <Trake prefiks={id} transformacija="translate(100 104) scale(0.95) translate(-100 -104)" />
    </svg>
  )
}

/** Pun logo sa sloganom u luku. Koristi se samo gde je širi od 120 px (U1, U2, U3, R1–R5). */
export function Logo({ sirina = 160 }: { sirina?: number }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width={sirina} height={sirina} role="img" aria-label="SWAPIT — Don't buy, don't sell... just SWAPIT" data-logo-pun>
      <defs>
        <Gradijenti telo={`${id}-t`} ugao={`${id}-u`} />
        <path id={`${id}-luk`} d="M42.8 133 A66 66 0 1 1 157.2 133" />
      </defs>
      <Nalepnica telo={`${id}-t`} ugao={`${id}-u`} />
      <text fill="#FFFFFF" className="logo-slogan" fontStretch="condensed" fontWeight="400" fontSize="15">
        <textPath href={`#${id}-luk`} startOffset="5" textLength="264" lengthAdjust="spacingAndGlyphs">
          DON&apos;T BUY, DON&apos;T SELL...JUST SWAPIT
        </textPath>
      </text>
      <Trake prefiks={id} transformacija="translate(100 108) scale(0.72) translate(-100 -104)" />
    </svg>
  )
}

/** Jabučica „Iz sopstvene proizvodnje“ (samo na oglasima iz kategorije voće i povrće). */
export function Jabucica({ velicina = 22 }: { velicina?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={velicina} height={velicina} role="img" aria-label="Iz sopstvene proizvodnje">
      <path d="M32 21 C26 14 9 16 9 35 C9 49 19 59 26 59 C29 59 31 57.5 32 57.5 C33 57.5 35 59 38 59 C45 59 55 49 55 35 C55 16 38 14 32 21 Z" fill="#34C759" stroke="#2F9E41" strokeWidth="2" strokeLinejoin="round" />
      <path d="M32 21 C32 15 34 11 38 8" fill="none" stroke="#5B3A1E" strokeWidth="3" strokeLinecap="round" />
      <path d="M37 14 C40 6 48 5 52 8 C49 15 42 17 37 14 Z" fill="#2F9E41" />
      <ellipse cx="20" cy="33" rx="3.5" ry="7" fill="#FFFFFF" opacity="0.35" transform="rotate(15 20 33)" />
    </svg>
  )
}
