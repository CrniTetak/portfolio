// Crtanje ikonica po nazivu (Lucide, debljina 1,75; UI 7). Pojedinačni uvoz, bez cele biblioteke.
import { Headphones, Map as MapIkona, Mail, Package, ShoppingBag, Star, Truck, User } from 'lucide-react'
import type { IkonaNaziv } from './stavke'

export function Ikona({ naziv, velicina = 22 }: { naziv: IkonaNaziv; velicina?: number }) {
  const zajednicko = { size: velicina, strokeWidth: 1.75, 'aria-hidden': true as const }
  switch (naziv) {
    case 'star':
      return <Star {...zajednicko} />
    case 'package':
      return <Package {...zajednicko} />
    case 'mail':
      return <Mail {...zajednicko} />
    case 'truck':
      return <Truck {...zajednicko} />
    case 'map':
      return <MapIkona {...zajednicko} />
    case 'headphones':
      return <Headphones {...zajednicko} />
    case 'shopping-bag':
      return <ShoppingBag {...zajednicko} />
    case 'user':
      return <User {...zajednicko} />
  }
}
