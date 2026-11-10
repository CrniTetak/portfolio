// Linijske ikonice (lucide, debljina 2). Uvozi se samo ono što se koristi (UI.md 4).
import {
  ArrowLeftRight, ArrowRight, BadgeCheck, Banknote, Building2, Check, ChevronLeft, ChevronRight, Clock, Download,
  Ellipsis, Eye, FileText, Hourglass, House, Info, Landmark, List, Lock, Menu, PenLine, RotateCcw, Send,
  ShieldCheck, TriangleAlert, Undo2, User, Wallet, X, ListChecks, Scale, FileCheck, CircleDot,
} from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'

const IKONE = {
  check: Check, warn: TriangleAlert, x: X, clock: Clock, lock: Lock, shield: ShieldCheck, home: House,
  swap: ArrowLeftRight, wallet: Wallet, bank: Landmark, user: User, doc: FileText, file: FileText, info: Info,
  left: ChevronLeft, right: ChevronRight, more: Ellipsis, reload: RotateCcw, pen: PenLine, menu: Menu, list: List,
  eye: Eye, badge: BadgeCheck, arrow: ArrowRight, download: Download, undo: Undo2, hourglass: Hourglass,
  building: Building2, checks: ListChecks, send: Send, scale: Scale, filecheck: FileCheck, dot: CircleDot, money: Banknote,
} as const

export type ImeIkone = keyof typeof IKONE

interface Props extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
  ime: ImeIkone
  sm?: boolean
}

export function Ikona({ ime, sm, className, ...rest }: Props) {
  const C = IKONE[ime] as ComponentType<SVGProps<SVGSVGElement>>
  return <C className={`i${sm ? ' sm' : ''}${className ? ' ' + className : ''}`} aria-hidden="true" focusable="false" strokeWidth={2} {...rest} />
}
