import type { ReactNode } from 'react'

export type VrstaZnacke = 'besplatno' | 'cena' | 'u-toku' | 'reklama' | 'pretplacen' | 'nije'

/** Značka (UI 6): uvek ima reč, ne samo boju. */
export function Znacka({ vrsta, children }: { vrsta: VrstaZnacke; children: ReactNode }) {
  return <span className={`znacka znacka--${vrsta}`}>{children}</span>
}
