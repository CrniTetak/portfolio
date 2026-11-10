// ILUSTRATIVNA MAPA BEOGRADA (PLAN B6.5): sopstveni SVG koji je nacrtan ručno za demo. Oblici su približni i „po sećanju“:
// nema tuđih geopodataka, ulica ni adresa. Sava i Dunav sa ušćem, Ada Ciganlija, Veliko ratno ostrvo i 11 opština (sa Surčinom).
// Položaji oglasa su u PROCENTIMA (scenario/opstine.ts), pa krugovi ne zavise od podloge. Boje su CSS promenljive u obe teme.
// Dinamičke vrednosti idu kroz SVG atribute (cx, cy, r, viewBox), nikad kroz style, da CSP `style-src 'self'` ostane strog.
import { useEffect, useRef, useState } from 'react'
import { OPSTINE } from '../scenario/opstine'
import { MAPA_OZNAKA } from '../tekstovi/okvir'
import { GUSTO_SREDISTE, NAJMANJE_PX_NATPISA, NATPIS_STRANA, NATPIS_STRANA_UZANO, OSNOVNA_VELIKOST, POMAK_GRUPE_Y, POMAK_NATPISA, UZANA_SKALA } from './mapaMere'

export const MAPA_SIRINA = 1000
export const MAPA_VISINA = 700
/** Približna lokacija: poluprečnik kruga u procentima širine (≈ 500 m, nikad tačna tačka). */
export const POLUPRECNIK_PROCENATA = 2.5

/** Oblici opština: tačke u koordinatama viewBox-a 1000 × 700. Susedne opštine dele ivice. */
const OBLICI: Record<string, string> = {
  pal: '640,0 1000,0 1000,520 820,440 648,377 580,350 520,330 457,256 470,170 559,81',
  zem: '260,0 640,0 559,81 470,170 457,256 430,260 260,250 240,120',
  nbg: '260,250 430,260 457,256 520,330 387,371 270,420 250,330',
  sur: '0,100 240,120 260,250 250,330 270,420 139,485 0,520',
  cuk: '0,532 139,497 270,432 387,383 395,418 420,470 400,560 300,650 160,640 0,640',
  sav: '387,383 520,345 505,380 528,426 500,480 420,470 395,418',
  stg: '520,345 545,345 600,385 592,432 528,426 505,380',
  vra: '528,426 592,432 610,480 580,520 520,515 500,480',
  zvz: '600,385 700,415 790,470 740,545 640,560 610,480 592,432',
  voz: '500,480 520,515 580,520 610,480 640,560 740,545 720,620 560,670 470,640 450,540',
  rak: '420,470 500,480 450,540 470,640 400,670 300,650 400,560',
}

/** Koliko je ekranskih piksela po jedinici viewBox-a (širina prikaza / širina isečka), prati promenu veličine. */
function useSkala(viewBox: string) {
  const ref = useRef<SVGSVGElement>(null)
  const [skala, setSkala] = useState(1)
  const sirinaIsecka = Number(viewBox.split(' ')[2]) || MAPA_SIRINA
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const izmeri = () => el.clientWidth > 0 && setSkala(el.clientWidth / sirinaIsecka)
    izmeri()
    const posmatrac = new ResizeObserver(izmeri)
    posmatrac.observe(el)
    return () => posmatrac.disconnect()
  }, [sirinaIsecka])
  return { ref, skala }
}

const REKE = {
  dunav: 'M 640 0 C 600 60 520 100 470 170 C 430 225 460 290 520 330 C 580 368 700 380 820 440 S 940 505 1000 520',
  sava: 'M 0 520 C 90 520 190 460 270 420 C 350 380 420 360 520 330',
}

/** T4-1: pločica pune podloge iza teksta na mapi. Poseban element (a ne oreol teksta), pa se kontrast meri prema pločici, a ne prema krugu ili ivici koji prolaze ispod slova. */
function Ploca({ x, y, tekst, velicina, sidro = 'middle', klasa, transform, centarY = false }: { x: number; y: number; tekst: string; velicina: number; sidro?: 'middle' | 'start'; klasa: string; transform?: string; centarY?: boolean }) {
  const w = tekst.length * velicina * 0.62 + velicina * 0.7
  const h = velicina * 1.4
  const levo = sidro === 'start' ? x - velicina * 0.35 : x - w / 2
  const gore = centarY ? y - h / 2 : y - velicina * 1.0
  return <rect className={klasa} x={levo} y={gore} width={w} height={h} rx={velicina * 0.3} transform={transform} aria-hidden="true" />
}

/** `grupa` = broj oglasa u području (veći krug sa brojem), inače krug približne lokacije jednog oglasa. */
export type KrugNaMapi = { id: string; x: number; y: number; oznaka: string; izabran?: boolean; grupa?: number }

/** Isečak ilustrativne mape oko tačke (procenti) za male mape: koordinate viewBox-a 1000 × 700. */
export function isecakMape(x: number, y: number): string {
  const sirina = 330
  const visina = 231
  const levo = Math.min(Math.max((x / 100) * MAPA_SIRINA - sirina / 2, 0), MAPA_SIRINA - sirina)
  const gore = Math.min(Math.max((y / 100) * MAPA_VISINA - visina / 2, 0), MAPA_VISINA - visina)
  return `${Math.round(levo)} ${Math.round(gore)} ${sirina} ${visina}`
}

type Props = {
  krugovi?: KrugNaMapi[]
  /** Isečak mape za male mape (O1, A1, A3, X8): „x y širina visina“ u koordinatama viewBox-a. */
  viewBox?: string
  /** Podloga: „svg“ je ova ilustracija; ostavljena mogućnost za statičnu sliku istih procenata. */
  podloga?: 'svg'
  naslov?: string
  onIzbor?: (id: string) => void
  prikaziOznaku?: boolean
  /** Imena opština na mapi; male mape (O1, A1…) ih nemaju jer bi bila nečitljiva. */
  imena?: boolean
}

export function Mapa({ krugovi = [], viewBox = `0 0 ${MAPA_SIRINA} ${MAPA_VISINA}`, podloga = 'svg', naslov = 'Ilustrativna mapa Beograda', onIzbor, prikaziOznaku = true, imena = true }: Props) {
  void podloga
  const { ref, skala } = useSkala(viewBox)
  const velicina = Math.max(OSNOVNA_VELIKOST, NAJMANJE_PX_NATPISA / skala)
  // D2: na uskom ekranu (telefon) natpisi gustog središta ne staju bez preklapanja, pa se ne crtaju; ime izabranog područja ide ispod mape
  const uzano = skala < UZANA_SKALA
  const prikazanNatpis = (id: string) => !uzano || !GUSTO_SREDISTE.includes(id)
  const izabranoSkriveno = uzano ? OPSTINE.find((o) => GUSTO_SREDISTE.includes(o.id) && krugovi.some((k) => k.izabran && k.id === `opstina:${o.id}`)) : undefined
  // T4-1: broj grupe je uvek ≥ 13 px na ekranu, sa oreolom (pune podloge) iza slova, pa ga prsten kruga ne preseca
  const velicinaBroja = Math.max(22, 13 / skala)
  const oreol = (v: number) => Math.round(v * 0.4 * 10) / 10
  const poluprecnik = (k: KrugNaMapi) => (POLUPRECNIK_PROCENATA / 100) * MAPA_SIRINA * (k.grupa !== undefined ? 1.7 : 1)
  const centar = (k: KrugNaMapi) => ({ x: (k.x / 100) * MAPA_SIRINA, y: (k.y / 100) * MAPA_VISINA })
  /** S5: meta dodira je najmanje 44 px (nevidljiv veći krug); u gustom središtu se sužava tako da se mete dva kruga ne preklapaju. */
  const poluprecnikMete = (k: KrugNaMapi) => {
    const c = centar(k)
    let najblize = Infinity
    for (const d of krugovi) if (d !== k) najblize = Math.min(najblize, Math.hypot(c.x - centar(d).x, c.y - centar(d).y) / 2)
    return Math.min(Math.max(poluprecnik(k), 22 / skala), najblize)
  }
  return (
    <figure className="m-0" data-mapa>
      <svg ref={ref} className="mapa-svg" viewBox={viewBox} role="group" aria-label={naslov}>
        <rect className="mapa-pozadina" x="0" y="0" width={MAPA_SIRINA} height={MAPA_VISINA} />
        {OPSTINE.map((o) => (
          <polygon key={o.id} className="mapa-opstina" points={OBLICI[o.id]} data-opstina={o.id} />
        ))}
        <path className="mapa-reka" d={REKE.dunav} strokeWidth="30" data-reka="dunav" />
        <path className="mapa-reka" d={REKE.sava} strokeWidth="22" data-reka="sava" />
        <ellipse className="mapa-ostrvo" cx="590" cy="368" rx="40" ry="11" transform="rotate(14 590 368)" data-ostrvo="veliko-ratno" />
        <ellipse className="mapa-ostrvo" cx="215" cy="452" rx="50" ry="12" transform="rotate(-27 215 452)" data-ostrvo="ada-ciganlija" />
        {krugovi.map((k) => {
          const cx = (k.x / 100) * MAPA_SIRINA
          const cy = (k.y / 100) * MAPA_VISINA
          const r = (POLUPRECNIK_PROCENATA / 100) * MAPA_SIRINA * (k.grupa !== undefined ? 1.7 : 1)
          return (
            <g key={k.id}>
              {k.grupa !== undefined ? (
                <>
                  <circle className={`mapa-grupa${k.izabran ? ' mapa-izabrano' : ''}`} cx={cx} cy={cy} r={r} data-krug={k.id} data-grupa={k.grupa} />
                </>
              ) : (
                <>
                  <circle className="mapa-krug" cx={cx} cy={cy} r={r} strokeWidth={k.izabran ? 6 : 3} data-krug={k.id} />
                  <circle className="mapa-igla" cx={cx} cy={cy} r="5" />
                </>
              )}
              {onIzbor && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={poluprecnikMete(k)}
                  fill="transparent"
                  tabIndex={0}
                  role="button"
                  aria-pressed={!!k.izabran}
                  aria-label={k.oznaka}
                  data-meta={k.id}
                  onClick={() => onIzbor(k.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault() // Space ne sme da skroluje stranicu
                      onIzbor(k.id)
                    }
                  }}
                />
              )}
            </g>
          )
        })}
        {/* natpisi idu POSLE krugova (talas 4): krug ih ne prekriva, a belo slovo ostaje čitljivo preko tamnije popune kruga */}
        {imena &&
          OPSTINE.filter((o) => prikazanNatpis(o.id)).map((o) => {
            const sredinaX = (o.x / 100) * MAPA_SIRINA
            const sredinaKruga = ((o.y + POMAK_GRUPE_Y) / 100) * MAPA_VISINA
            const polupr = POLUPRECNIK_PROCENATA * 10 * 1.7
            const razmak = POMAK_NATPISA + velicina * 0.3 // razmak raste sa slovima, da se na telefonu (veća slova) natpis ne dodirne sa krugom
            const strana = (uzano ? NATPIS_STRANA_UZANO[o.id] : undefined) ?? NATPIS_STRANA[o.id] ?? 'gore'
            const x = strana === 'desno' ? sredinaX + polupr + razmak : sredinaX
            const y = strana === 'dole' ? sredinaKruga + polupr + POMAK_NATPISA * 0.75 + velicina * 0.9 : strana === 'desno' ? sredinaKruga + velicina * 0.3 : sredinaKruga - polupr - razmak
            return (
              <g key={o.id}>
                <Ploca x={x} y={y} tekst={o.naziv} velicina={velicina} sidro={strana === 'desno' ? 'start' : 'middle'} klasa="mapa-ploca" />
              <text className="mapa-natpis" x={x} y={y} fontSize={velicina} strokeWidth={oreol(velicina)} data-natpis={o.id} data-strana={strana}>
                {o.naziv}
              </text>
              </g>
            )
          })}
        {imena && (
          <>
            <Ploca x={105} y={496} tekst="Sava" velicina={velicina} klasa="mapa-ploca mapa-ploca-voda" transform="rotate(-8 105 496)" />
            <text className="mapa-natpis-voda" x="105" y="496" fontSize={velicina} strokeWidth={oreol(velicina)} transform="rotate(-8 105 496)">
              Sava
            </text>
            <Ploca x={545} y={105} tekst="Dunav" velicina={velicina} klasa="mapa-ploca mapa-ploca-voda" transform="rotate(-45 545 105)" />
            <text className="mapa-natpis-voda" x="545" y="105" fontSize={velicina} strokeWidth={oreol(velicina)} transform="rotate(-45 545 105)">
              Dunav
            </text>
          </>
        )}
        {/* brojevi grupa idu na sam vrh, iznad krugova stvari iz priče */}
        {krugovi
          .filter((k) => k.grupa !== undefined)
          .map((k) => (
            <g key={`broj-${k.id}`}>
            <Ploca x={(k.x / 100) * MAPA_SIRINA} y={(k.y / 100) * MAPA_VISINA} tekst={String(k.grupa)} velicina={velicinaBroja} klasa="mapa-ploca mapa-ploca-broj" centarY />
            <text className="mapa-grupa-broj" x={(k.x / 100) * MAPA_SIRINA} y={(k.y / 100) * MAPA_VISINA} fontSize={velicinaBroja} strokeWidth={oreol(velicinaBroja)}>
              {k.grupa}
            </text>
            </g>
          ))}
      </svg>
      {izabranoSkriveno && (
        <p className="mapa-oznaka" data-mapa-izabrano-ime>
          Izabrano područje: <b>{izabranoSkriveno.naziv}</b>
        </p>
      )}
      {prikaziOznaku && (
        <figcaption className="mapa-oznaka" data-mapa-oznaka>
          {MAPA_OZNAKA}
        </figcaption>
      )}
    </figure>
  )
}
