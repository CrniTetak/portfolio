// Link na drugi ekran u trenutnom (ili datom) uglu. Svi linkovi počinju sa # (nema spoljnih linkova).
import type { ReactNode } from 'react'
import { useEkran } from '../okvir/kontekst'
import { link } from '../pravila/rute'
import type { EkranId, Ugao } from '../prica/tipovi'

export function Veza({ ekran, parametri, upit, ugao, className, children, ariaLabel }: { ekran: EkranId; parametri?: Record<string, string>; upit?: Record<string, string>; ugao?: Ugao; className?: string; children: ReactNode; ariaLabel?: string }) {
  const { ugao: tekuci } = useEkran()
  return (
    <a className={className} href={`#${link(ekran, ugao ?? tekuci, parametri, upit)}`} aria-label={ariaLabel}>
      {children}
    </a>
  )
}

/** Putanja (bez #) za navigate() i `nakon` radnji: ista logika kao Veza. */
export function useLink() {
  const { ugao } = useEkran()
  return (ekran: EkranId, parametri?: Record<string, string>, u?: Ugao) => link(ekran, u ?? ugao, parametri)
}
