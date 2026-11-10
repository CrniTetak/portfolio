// Osnovni gradivni elementi izgleda (UI.md odeljak 4): dugmad, kartica, oznake statusa,
// prazna stanja, polja obrasca, prozor za potvrdu, prekidač. Boje i zaobljenja su u index.css.
import {
  CircleCheckBig, CircleDot, CircleX, Clock, Ellipsis, Lock, TriangleAlert, Wallet, X,
  type LucideIcon,
} from 'lucide-react'
import { cloneElement, isValidElement, useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { useStanje } from '../stanje/StanjeProvider'
import { RAZLOG_VAN_PRICE } from '../tekstovi/prica'

// ---------------------------------------------------------------- dugmad

type Varijanta = 'primarno' | 'sekundarno' | 'opasno' | 'link' | 'svetlo'

const BAZA =
  'inline-flex items-center justify-center gap-2 h-12 max-md:h-11 px-5 rounded-dugme font-semibold text-base border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:cursor-not-allowed'

const VARIJANTE: Record<Varijanta, string> = {
  primarno: 'bg-akcent text-white border-transparent hover:bg-akcent-t',
  sekundarno: 'bg-white text-mastilo border-mastilo hover:bg-traka',
  opasno: 'bg-white text-opasno border-opasno hover:bg-[#FDECEC]',
  link: 'border-transparent text-akcent hover:underline px-1 h-auto max-md:h-auto min-h-11',
  // za tamnu pozadinu (hero)
  svetlo: 'bg-transparent text-white border-white hover:bg-white/10',
}

export const klasaDugmeta = (v: Varijanta = 'primarno', siroko = false) =>
  `${BAZA} ${VARIJANTE[v]} ${siroko ? 'w-full sm:w-auto' : ''}`

interface DugmeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varijanta?: Varijanta
  ikona?: LucideIcon
  /** kad je dugme onemogućeno, ovde stoji obavezna rečenica ZAŠTO (UI 4.14) */
  zasto?: string | null
  /** radnja koja menja stanje, a nije deo vođene priče: u vođenom režimu je vidljiva, ali ugašena („Probajte u slobodnom režimu") */
  vanPrice?: boolean
}

export function Dugme({ varijanta = 'primarno', ikona: Ikona, zasto, children, className = '', disabled, vanPrice = false, onClick, type = 'button', ...ostalo }: DugmeProps) {
  const { vodjeno } = useStanje()
  if (vanPrice && vodjeno) {
    // ugašeno, ali vidljivo uz razlog; ne menja stanje (aria-disabled, ne pravo „disabled", da se razlog može pročitati i tastaturom)
    return (
      <span className="inline-flex flex-col gap-1">
        <button type="button" aria-disabled="true" data-van-price="da" onClick={(e) => e.preventDefault()} className={`${klasaDugmeta(varijanta)} ${className}`} {...ostalo}>
          {Ikona && <Ikona size={18} aria-hidden />}
          {children}
        </button>
        <span className="text-sm text-sek" role="note">{RAZLOG_VAN_PRICE}</span>
      </span>
    )
  }
  const dugme = (
    <button type={type} disabled={disabled} onClick={onClick} className={`${klasaDugmeta(varijanta)} ${className}`} {...ostalo}>
      {Ikona && <Ikona size={18} aria-hidden />}
      {children}
    </button>
  )
  if (!disabled || !zasto) return dugme
  return (
    <span className="inline-flex flex-col gap-1">
      {dugme}
      <span className="text-sm text-sek" role="note">{zasto}</span>
    </span>
  )
}

export function DugmeLink({
  varijanta = 'primarno', ikona: Ikona, children, className = '', ...ostalo
}: LinkProps & { varijanta?: Varijanta; ikona?: LucideIcon }) {
  return (
    <Link className={`${klasaDugmeta(varijanta)} ${className}`} {...ostalo}>
      {Ikona && <Ikona size={18} aria-hidden />}
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------- kartica i raspored

export function Kartica({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-linija rounded-kartica ${className}`}>
      {children}
    </div>
  )
}

/** Okvir jednog ekrana: širina do 1152 px, razmaci iz UI.md. */
export function Stranica({ children, uzak = false }: { children: ReactNode; uzak?: boolean }) {
  return <div className={`mx-auto w-full px-4 py-8 md:py-12 ${uzak ? 'max-w-3xl' : 'max-w-6xl'}`}>{children}</div>
}

export function Naslov({ children, podnaslov, desno }: { children: ReactNode; podnaslov?: ReactNode; desno?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[26px] md:text-[32px] leading-tight">{children}</h1>
        {podnaslov && <p className="mt-2 text-sek max-w-2xl">{podnaslov}</p>}
      </div>
      {desno}
    </div>
  )
}

/** Mali naslov grupe: velika slova, razmaknuto, prigušeno. */
export function Natpis({ children }: { children: ReactNode }) {
  return <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-prig">{children}</h2>
}

export function Podnaslov({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 text-xl md:text-[22px] font-bold">{children}</h2>
}

// ---------------------------------------------------------------- oznake statusa (ikonica + tekst, nikad samo boja)

export type VrstaOznake =
  | 'aktivna' | 'osporena' | 'istekla' | 'ceka-uplatu' | 'ceka-vlasnika' | 'placeno' | 'zakljucano' | 'odbijeno' | 'neutralna'

const OZNAKE: Record<VrstaOznake, { klasa: string; Ikona: LucideIcon }> = {
  aktivna: { klasa: 'bg-[#E7F5EC] text-[#17603A]', Ikona: CircleDot },
  osporena: { klasa: 'bg-[#FDECEC] text-[#9B1C1C]', Ikona: TriangleAlert },
  istekla: { klasa: 'bg-[#F0EEEC] text-[#55504C]', Ikona: Clock },
  'ceka-uplatu': { klasa: 'bg-prototip-s text-prototip-tekst', Ikona: Wallet },
  'ceka-vlasnika': { klasa: 'bg-[#E8F0FE] text-[#1E40AF]', Ikona: Ellipsis },
  // jedina puna (tamna) oznaka: trenutak kojim se priča završava
  placeno: { klasa: 'bg-uspeh text-white', Ikona: CircleCheckBig },
  zakljucano: { klasa: 'bg-[#EBE8E5] text-[#403B37]', Ikona: Lock },
  odbijeno: { klasa: 'bg-white text-opasno border border-opasno', Ikona: CircleX },
  neutralna: { klasa: 'bg-traka text-sek border border-linija', Ikona: CircleDot },
}

export function Oznaka({ vrsta, children, velika = false }: { vrsta: VrstaOznake; children: ReactNode; velika?: boolean }) {
  const { klasa, Ikona } = OZNAKE[vrsta]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 font-semibold whitespace-nowrap ${velika ? 'h-9 text-sm' : 'h-7 text-[13px]'} ${klasa}`}>
      <Ikona size={velika ? 18 : 14} aria-hidden />
      {children}
    </span>
  )
}

/** Mala bela pilula (tip prostora, stil, tehnika). */
export function Pilula({ children, ikona: Ikona }: { children: ReactNode; ikona?: LucideIcon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0EEEC] px-2.5 py-0.5 text-[13px] font-semibold text-sek">
      {Ikona && <Ikona size={12} aria-hidden />}
      {children}
    </span>
  )
}

// ---------------------------------------------------------------- prazno stanje

export function PraznoStanje({ ikona: Ikona, naslov, tekst, children }: { ikona: LucideIcon; naslov: string; tekst: string; children?: ReactNode }) {
  return (
    <Kartica className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Ikona size={48} strokeWidth={1.25} className="text-linija-j" aria-hidden />
      <h3 className="text-lg font-semibold">{naslov}</h3>
      <p className="max-w-md text-sek">{tekst}</p>
      {children}
    </Kartica>
  )
}

// ---------------------------------------------------------------- obrasci

/**
 * Polje obrasca. Sa htmlFor: labela + polje; greška i pomoć su povezane (aria-describedby) i polje dobija aria-invalid.
 * Bez htmlFor (grupa kvačica, prekidač): fieldset sa legend, da čitač ekrana pročita naziv grupe.
 */
export function Polje({
  naziv, obavezno, pomoc, greska, children, htmlFor,
}: { naziv: string; obavezno?: boolean; pomoc?: string; greska?: string | null; children: ReactNode; htmlFor?: string }) {
  const idOpisa = htmlFor ? `${htmlFor}-opis` : undefined
  const dete = htmlFor && isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        'aria-invalid': greska ? true : undefined,
        'aria-describedby': greska || pomoc ? idOpisa : undefined,
      })
    : children
  const poruke = (
    <>
      {pomoc && !greska && <p id={idOpisa} className="text-sm text-sek">{pomoc}</p>}
      {greska && (
        <p id={idOpisa} className="flex items-center gap-1 text-sm font-semibold text-opasno" role="alert">
          <TriangleAlert size={14} aria-hidden /> {greska}
        </p>
      )}
    </>
  )
  const natpis = <>{naziv} {obavezno && <span className="font-normal text-prig">(obavezno)</span>}</>
  if (!htmlFor) {
    return (
      <fieldset className="flex min-w-0 flex-col gap-1.5">
        <legend className="mb-1.5 text-sm font-semibold">{natpis}</legend>
        {dete}{poruke}
      </fieldset>
    )
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">{natpis}</label>
      {dete}{poruke}
    </div>
  )
}

/** Fokus na prvo polje sa greškom (poziva se posle neuspelog slanja, kad se greške iscrtaju). */
export function fokusirajGresku() {
  setTimeout(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 50)
}

export const KLASA_POLJA =
  'h-12 w-full rounded-dugme border border-linija-j bg-white px-3 text-base focus:border-mastilo focus:outline-2 focus:outline-akcent'

/** Izbor jedne od više vrednosti (segmentirano dugme): za veličinu ekipe, pravno/fizičko lice… */
export function Prekidac<T extends string | number>({
  vrednosti, izabrano, onChange, oznaka,
}: { vrednosti: { id: T; naziv: string }[]; izabrano: T; onChange: (v: T) => void; oznaka: string }) {
  return (
    <div role="group" aria-label={oznaka} className="inline-flex flex-wrap gap-1 rounded-full border border-linija-j bg-white p-1">
      {vrednosti.map((v) => (
        <button
          key={v.id}
          type="button"
          aria-pressed={izabrano === v.id}
          onClick={() => onChange(v.id)}
          className={`min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold ${izabrano === v.id ? 'bg-mastilo text-white' : 'text-mastilo hover:bg-traka'}`}
        >
          {v.naziv}
        </button>
      ))}
    </div>
  )
}

/** Kvačice za višestruki izbor (tipovi, stilovi, uslovi). */
export function Kvacice<T extends string>({
  vrednosti, izabrano, onChange, legenda,
}: { vrednosti: { id: T; naziv: string }[]; izabrano: T[]; onChange: (v: T[]) => void; legenda?: string }) {
  return (
    <fieldset className="flex min-w-0 flex-wrap gap-2">
      {legenda && <legend className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-prig">{legenda}</legend>}
      {vrednosti.map((v) => {
        const ukljuceno = izabrano.includes(v.id)
        return (
          <label key={v.id} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-dugme border px-3 text-sm ${ukljuceno ? 'border-akcent bg-akcent-s font-semibold' : 'border-linija-j bg-white hover:bg-traka'}`}>
            <input
              type="checkbox"
              className="h-5 w-5 accent-[#C8401E]"
              checked={ukljuceno}
              onChange={() => onChange(ukljuceno ? izabrano.filter((x) => x !== v.id) : [...izabrano, v.id])}
            />
            {v.naziv}
          </label>
        )
      })}
    </fieldset>
  )
}

// ---------------------------------------------------------------- prozor za potvrdu

/** Prozor za potvrdu kao pravi <dialog>: zarobljen fokus, Escape zatvara, fokus se vraća na dugme koje ga je otvorilo. */
export function ProzorPotvrde({
  naslov, tekst, potvrdi, odustani, onPotvrdi, onOdustani,
}: { naslov: string; tekst: string; potvrdi: string; odustani: string; onPotvrdi: () => void; onOdustani: () => void }) {
  const id = useId()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => { if (d?.open) d.close() } // close() vraća fokus na prethodni element
  }, [])
  return (
    <dialog
      ref={ref} aria-labelledby={id}
      onCancel={(e) => { e.preventDefault(); onOdustani() }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-kartica bg-white p-6 text-mastilo shadow-plutajuce backdrop:bg-mastilo/60"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id={id} className="text-xl font-bold">{naslov}</h2>
        <button type="button" aria-label="Zatvori" onClick={onOdustani} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-traka"><X size={20} /></button>
      </div>
      <p className="mt-3 text-sek">{tekst}</p>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" autoFocus className={klasaDugmeta('sekundarno')} onClick={onOdustani}>{odustani}</button>
        <button type="button" className={klasaDugmeta('opasno')} onClick={onPotvrdi}>{potvrdi}</button>
      </div>
    </dialog>
  )
}

/** Obavezna napomena uz obrasce i ekrane „poslato": u prototipu se ništa ne šalje. */
export function NapomenaNeSalje() {
  return (
    <p className="rounded-dugme border border-prototip-ivica bg-prototip-s px-3 py-2 text-sm font-semibold text-prototip-tekst" role="note">
      U prototipu se ništa ne šalje — ne unosite prava imena ni podatke.
    </p>
  )
}
