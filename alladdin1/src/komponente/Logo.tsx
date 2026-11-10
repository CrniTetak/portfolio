// Logo kao INLINE SVG (BREND.md, dizajn/logo/): natpis koristi spakovani Source Serif 4, a ne font strane.
// Oblik, razmere i raspored su preuzeti iz dizajn/logo/znak-horizontalni.svg i grb.svg bez izmena.
// Boje stoje u temi (index.css, --color-logo-*), pa se menjaju na jednom mestu. Samo na tamnoj pozadini.
// Konačnu profesionalnu vektorizaciju radi čovek; kad stigne, menja se ovaj jedan fajl.
import { useId } from 'react'

const ROTACIJE = [0, 46, -46, 114, 246, 158, 202] // 7 crvenih segmenata (desno izostavljen zbog sprica lampe)

/** Žeton sa lampom (zajednički deo grba i horizontalnog znaka). Koordinate su iz originalnog SVG-a. */
function Zeton({ segId }: { segId: string }) {
  return (
    <>
      <defs>
        <path id={segId} d="M468.8 135.3 A220 220 0 0 1 545.2 135.3 L536.2 186.6 A168 168 0 0 0 477.8 186.6 Z" />
      </defs>
      <circle cx="507" cy="352" r="236" className="logo-telo" />
      <g className="logo-segment">
        {ROTACIJE.map((r) => (
          <use key={r} href={`#${segId}`} transform={r === 0 ? undefined : `rotate(${r} 507 352)`} />
        ))}
      </g>
      <circle cx="507" cy="352" r="230" fill="none" strokeWidth="12" className="logo-zlato-linija" />
      <g fill="none" strokeWidth="6" strokeLinecap="round" className="logo-zlato-linija">
        <path d="M368.4 272 A160 160 0 0 1 645.6 272" />
        <path d="M368.4 432 A160 160 0 0 0 645.6 432" />
      </g>
      <g className="logo-zlato">
        <path d="M478 262 C489 276 492 289 478 301 C464 289 467 276 478 262 Z" />
        <path d="M440 322 C445 308 462 304 478 304 C494 304 511 308 516 322 Z" />
        <rect x="432" y="319" width="92" height="15" rx="7.5" />
        <path d="M400 352 C405 340 440 335 480 335 L640 333 C672 332 698 337 712 342 C690 345 664 352 640 366 C615 380 600 398 575 410 C550 424 520 432 497 434 L458 434 C435 420 415 390 400 352 Z" />
        <path d="M462 432 L495 432 C492 448 490 455 505 462 L530 468 L440 468 L458 458 C468 452 466 442 462 432 Z" />
        <rect x="432" y="466" width="100" height="9" rx="4.5" />
        <rect x="440" y="480" width="84" height="5" rx="2.5" />
      </g>
      <path
        d="M412 350 C385 338 350 308 320 320 C298 330 305 362 335 378 C360 390 378 392 372 410"
        fill="none"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="logo-zlato-linija"
      />
      <path d="M706 347 C665 352 625 372 600 398" fill="none" strokeWidth="4" strokeLinecap="round" className="logo-izrez" />
    </>
  )
}

/** Horizontalni znak (grb + natpis). Najmanje 120 px širine; ispod toga koristiti samo LogoGrb. */
export function LogoZnak({ sirina = 180 }: { sirina?: number }) {
  const segId = 'seg' + useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="0 0 660 200" width={sirina} height={(sirina * 200) / 660} role="img" aria-label="AllAddIn1" focusable="false">
      <g transform="translate(10 10) scale(0.3673) translate(-262 -107)">
        <Zeton segId={segId} />
      </g>
      <text x="215" y="132" fontSize="92" fontWeight="600" textLength="430" className="logo-natpis">
        <tspan className="logo-zlato">All</tspan>
        <tspan className="logo-crveno">Add</tspan>
        <tspan className="logo-zlato">In</tspan>
        <tspan className="logo-crveno">1</tspan>
      </text>
    </svg>
  )
}

/** Samo grb (telefon, S1, S3). Najmanje 40 px. */
export function LogoGrb({ velicina = 44 }: { velicina?: number }) {
  const segId = 'seg' + useId().replace(/[^a-zA-Z0-9]/g, '')
  return (
    <svg viewBox="262 107 490 490" width={velicina} height={velicina} role="img" aria-label="AllAddIn1" focusable="false">
      <Zeton segId={segId} />
    </svg>
  )
}
