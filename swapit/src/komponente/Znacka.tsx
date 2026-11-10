// Značke (UI 2.3, 5.10): uvek ikona + reč, svetle pilule sa tamnim tekstom u obe teme. Plaćene značke nikad nisu prozirne.
import { BadgeCheck, Building2, Coins, Gavel, Gift, Info, Megaphone, ShieldCheck, Star, User } from 'lucide-react'

export type VrstaZnacke = 'gradjanin' | 'firma' | 'istaknuto' | 'sponzorisano' | 'poklon' | 'poeni' | 'verifikovan' | 'model' | 'ilustrativno' | 'provereno' | 'aukcija'

const IKONA = { size: 14, strokeWidth: 1.75, 'aria-hidden': true } as const

export function Znacka({ vrsta, vrednost }: { vrsta: VrstaZnacke; vrednost?: number }) {
  switch (vrsta) {
    case 'gradjanin':
      return (
        <span className="znacka znacka-gradjanin" title="Građanin: privatno lice, nije trgovac">
          <User {...IKONA} /> Građanin
        </span>
      )
    case 'firma':
      return (
        <span className="znacka znacka-firma" title="Firma: registrovan trgovac ili zanatlija">
          <Building2 {...IKONA} /> Firma
        </span>
      )
    case 'istaknuto':
      return (
        <span className="znacka znacka-istaknuto">
          <Star {...IKONA} fill="currentColor" /> <span aria-hidden="true">Istaknuto · plaćeno</span>
          <span className="sr-only">Istaknuto, plaćeno</span>
        </span>
      )
    case 'sponzorisano':
      return (
        <span className="znacka znacka-sponzorisano">
          <Megaphone {...IKONA} /> Sponzorisano
        </span>
      )
    case 'poklon':
      return (
        <span className="znacka znacka-poklon">
          <Gift {...IKONA} /> Poklanjam
        </span>
      )
    case 'poeni':
      return (
        <span className="znacka znacka-poeni">
          <Coins {...IKONA} /> <span aria-hidden="true">Za poene · {vrednost}</span>
          <span className="sr-only">Za poene, {vrednost} poena</span>
        </span>
      )
    case 'verifikovan':
      return (
        <span className="znacka znacka-verifikovan" title="Broj telefona je potvrđen">
          <ShieldCheck {...IKONA} /> Verifikovan
        </span>
      )
    case 'model':
      return (
        <span className="znacka znacka-model">
          <Info {...IKONA} /> model u proveri
        </span>
      )
    case 'ilustrativno':
      return (
        <span className="znacka znacka-ilustrativno">
          <Info {...IKONA} /> ilustrativno, nije cenovnik
        </span>
      )
    case 'aukcija':
      return (
        <span className="znacka znacka-aukcija">
          <Gavel {...IKONA} /> <span aria-hidden="true">Javna aukcija · plaćeno</span>
          <span className="sr-only">Javna aukcija, plaćeno</span>
        </span>
      )
    case 'provereno':
      return (
        <span className="znacka znacka-provereno">
          <BadgeCheck {...IKONA} /> proverena razmena
        </span>
      )
  }
}
