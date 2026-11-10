// Registar ekrana i ruta (PLAN B2/B6). Jedan podatak: App.tsx pravi rute iz ove liste.
// Linkovi su oblika #/<uloga>/<ekran>. Uloga je u linku; pozicija u priči i režim su u sessionStorage.
import type { EkranId, Uloga } from '../prica/tipovi'

export interface EkranMeta {
  id: EkranId
  uloga: Uloga | null
  /** Putanja bez početne kose crte, npr. "selling/offers". Prazno za C1. */
  putanja: string
  naziv: string
}

const e = (id: EkranId, uloga: Uloga | null, putanja: string, naziv: string): EkranMeta => ({ id, uloga, putanja, naziv })

export const EKRANI: EkranMeta[] = [
  e('C1', null, '', 'Enter demo'),
  e('C3', null, 'about', 'About this demo'),

  e('S1', 'selling', 'selling/dashboard', 'Dashboard'),
  e('S2', 'selling', 'selling/deal', 'Deal overview'),
  e('S3', 'selling', 'selling/offers', 'Offers'),
  e('S4', 'selling', 'selling/personal-terms', 'Personal terms'),
  e('S5', 'selling', 'selling/rules-check', 'Rules check'),
  e('S6', 'selling', 'selling/signing', 'Signing'),
  e('S7', 'selling', 'selling/security', 'Security'),
  e('S8', 'selling', 'selling/registration', 'Registration'),
  e('S9', 'selling', 'selling/payouts', 'Payouts'),
  e('S10', 'selling', 'selling/installments', 'Installments'),
  e('S11', 'selling', 'selling/financing', 'Financing'),
  e('S12', 'selling', 'selling/approvals', 'Approvals'),
  e('S13', 'selling', 'selling/exceptions', 'Exceptions'),
  e('SP', 'selling', 'selling/club-profile', 'Club profile'),

  e('B1', 'buying', 'buying/dashboard', 'Dashboard'),
  e('B2', 'buying', 'buying/deal', 'Deal overview'),
  e('B3', 'buying', 'buying/offers', 'Offers'),
  e('B4', 'buying', 'buying/personal-terms', 'Personal terms'),
  e('B5', 'buying', 'buying/rules-check', 'Rules check'),
  e('B6', 'buying', 'buying/signing', 'Signing'),
  e('B7', 'buying', 'buying/secure-funds', 'Secure funds'),
  e('B8', 'buying', 'buying/registration', 'Registration'),
  e('B9', 'buying', 'buying/payments', 'Payments'),
  e('B10', 'buying', 'buying/approvals', 'Approvals'),
  e('B11', 'buying', 'buying/exceptions', 'Exceptions'),
  e('BP', 'buying', 'buying/club-profile', 'Club profile'),

  e('P1', 'player', 'player/home', 'Home'),
  e('P2', 'player', 'player/contract', 'My contract'),
  e('P3', 'player', 'player/share', 'My share'),
  e('P4', 'player', 'player/medical', 'Medical'),
  e('P5', 'player', 'player/documents', 'Documents'),
  e('P6', 'player', 'player/receipt', 'Payment receipt'),
  e('P7', 'player', 'player/privacy', 'Privacy'),
  e('P8', 'player', 'player/exception', 'Exception'),

  e('A1', 'agent', 'agent/home', 'Home'),
  e('A2', 'agent', 'agent/deal', "Client's deal"),
  e('A3', 'agent', 'agent/personal-terms', 'Personal terms'),
  e('A4', 'agent', 'agent/commission', 'Commission'),
  e('A5', 'agent', 'agent/documents', 'Documents'),
  e('A6', 'agent', 'agent/licence', 'Licence'),
  e('A7', 'agent', 'agent/exception', 'Exception'),

  e('F1', 'financier', 'financier/dashboard', 'Dashboard'),
  e('F2', 'financier', 'financier/receivables', 'Receivables'),
  e('F3', 'financier', 'financier/receivables/main', 'Receivable detail'),
  e('F4', 'financier', 'financier/receivables/main/offer', 'Make an offer'),
  e('F5', 'financier', 'financier/offers', 'My offers'),
  e('F6', 'financier', 'financier/positions', 'Positions'),
  e('F7', 'financier', 'financier/preview', 'Preview and exceptions'),
]

const PO_ID = new Map(EKRANI.map((x) => [x.id, x]))

export function meta(id: EkranId): EkranMeta {
  if (id === 'C2') return { id, uloga: null, putanja: '', naziv: 'Transfer overview' }
  const m = PO_ID.get(id)
  if (!m) throw new Error(`Nepoznat ekran ${id}`)
  return m
}

/** Link (hash ruta) ka ekranu, npr. "/selling/offers". */
export function putZa(id: EkranId): string {
  return '/' + meta(id).putanja
}

/** C2: pregled sporednog transfera, iz ugla uloge. */
export function putSporednog(uloga: 'selling' | 'buying', idTransfera: string): string {
  return `/${uloga}/transfers/${idTransfera}`
}

/** Ekran na osnovu putanje bez početne kose crte; null ako ne postoji. */
export function ekranZaPutanju(putanja: string): EkranMeta | null {
  const p = putanja.replace(/^\/+|\/+$/g, '')
  return EKRANI.find((x) => x.putanja === p) ?? null
}

/** Ekrani jedne uloge. */
export const ekraniUloge = (u: Uloga) => EKRANI.filter((x) => x.uloga === u)

/** Početni ekran (tabla) uloge. */
export const TABLA: Record<Uloga, EkranId> = {
  selling: 'S1',
  buying: 'B1',
  player: 'P1',
  agent: 'A1',
  financier: 'F1',
}

// ---------------------------------------------------------------- navigacija po ulozi (UI.md 6.1)
export interface StavkaNav {
  oznaka: string
  ikona: 'home' | 'swap' | 'wallet' | 'bank' | 'shield' | 'user' | 'doc' | 'file' | 'lock' | 'list' | 'eye' | 'badge'
  cilj: EkranId
  /** Ekrani na kojima je stavka istaknuta (pored cilja). */
  aktivna: EkranId[]
}

export const NAVIGACIJA: Record<Uloga, StavkaNav[]> = {
  selling: [
    { oznaka: 'Dashboard', ikona: 'home', cilj: 'S1', aktivna: ['S1'] },
    { oznaka: 'Transfers', ikona: 'swap', cilj: 'S2', aktivna: ['S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S13', 'C2'] },
    { oznaka: 'Payments', ikona: 'wallet', cilj: 'S9', aktivna: ['S9', 'S10'] },
    { oznaka: 'Financing', ikona: 'bank', cilj: 'S11', aktivna: ['S11'] },
    { oznaka: 'Approvals', ikona: 'shield', cilj: 'S12', aktivna: ['S12'] },
    { oznaka: 'Club profile', ikona: 'user', cilj: 'SP', aktivna: ['SP'] },
  ],
  buying: [
    { oznaka: 'Dashboard', ikona: 'home', cilj: 'B1', aktivna: ['B1'] },
    { oznaka: 'Transfers', ikona: 'swap', cilj: 'B2', aktivna: ['B2', 'B3', 'B4', 'B6', 'B7', 'B8', 'B11', 'C2'] },
    { oznaka: 'Payments', ikona: 'wallet', cilj: 'B9', aktivna: ['B9'] },
    { oznaka: 'Approvals', ikona: 'shield', cilj: 'B10', aktivna: ['B10'] },
    { oznaka: 'Compliance trail', ikona: 'file', cilj: 'B5', aktivna: ['B5'] },
    { oznaka: 'Club profile', ikona: 'user', cilj: 'BP', aktivna: ['BP'] },
  ],
  player: [
    { oznaka: 'Home', ikona: 'home', cilj: 'P1', aktivna: ['P1', 'P8'] },
    { oznaka: 'My contract', ikona: 'doc', cilj: 'P2', aktivna: ['P2', 'P4'] },
    { oznaka: 'My share', ikona: 'wallet', cilj: 'P3', aktivna: ['P3', 'P6'] },
    { oznaka: 'Documents', ikona: 'file', cilj: 'P5', aktivna: ['P5'] },
    { oznaka: 'Privacy', ikona: 'lock', cilj: 'P7', aktivna: ['P7'] },
  ],
  agent: [
    { oznaka: 'Home', ikona: 'home', cilj: 'A1', aktivna: ['A1'] },
    { oznaka: 'Client deal', ikona: 'swap', cilj: 'A2', aktivna: ['A2', 'A3', 'A7'] },
    { oznaka: 'Commission', ikona: 'wallet', cilj: 'A4', aktivna: ['A4'] },
    { oznaka: 'Documents', ikona: 'file', cilj: 'A5', aktivna: ['A5'] },
    { oznaka: 'Licence', ikona: 'badge', cilj: 'A6', aktivna: ['A6'] },
  ],
  financier: [
    { oznaka: 'Dashboard', ikona: 'home', cilj: 'F1', aktivna: ['F1'] },
    { oznaka: 'Receivables', ikona: 'list', cilj: 'F2', aktivna: ['F2', 'F3', 'F4', 'F7'] },
    { oznaka: 'My offers', ikona: 'doc', cilj: 'F5', aktivna: ['F5'] },
    { oznaka: 'Positions', ikona: 'wallet', cilj: 'F6', aktivna: ['F6'] },
  ],
}

/** Donja navigacija na telefonu: prve 4 stavke + "More" (ostalo). Za 4-5 stavki nema "More". */
export function donjaNavigacija(u: Uloga): { glavne: StavkaNav[]; vise: StavkaNav[] } {
  const sve = NAVIGACIJA[u]
  if (sve.length <= 5) return { glavne: sve, vise: [] }
  return { glavne: sve.slice(0, 4), vise: sve.slice(4) }
}

/** Kartice unutar transfera (podnavigacija): sve što pripada glavnom transferu. */
export const TABOVI_TRANSFERA: Partial<Record<Uloga, { oznaka: string; ekran: EkranId }[]>> = {
  selling: [
    { oznaka: 'Overview', ekran: 'S2' },
    { oznaka: 'Offers', ekran: 'S3' },
    { oznaka: 'Personal terms', ekran: 'S4' },
    { oznaka: 'Rules check', ekran: 'S5' },
    { oznaka: 'Signing', ekran: 'S6' },
    { oznaka: 'Security', ekran: 'S7' },
    { oznaka: 'Registration', ekran: 'S8' },
    { oznaka: 'Payouts', ekran: 'S9' },
    { oznaka: 'Installments', ekran: 'S10' },
    { oznaka: 'Exceptions', ekran: 'S13' },
  ],
  buying: [
    { oznaka: 'Overview', ekran: 'B2' },
    { oznaka: 'Offers', ekran: 'B3' },
    { oznaka: 'Personal terms', ekran: 'B4' },
    { oznaka: 'Rules check', ekran: 'B5' },
    { oznaka: 'Signing', ekran: 'B6' },
    { oznaka: 'Secure funds', ekran: 'B7' },
    { oznaka: 'Registration', ekran: 'B8' },
    { oznaka: 'Payments', ekran: 'B9' },
    { oznaka: 'Exceptions', ekran: 'B11' },
  ],
}

/** Šta je ruta: ekran, ili C2 (sporedni transfer) sa idjem transfera. */
export function idEkrana(pathname: string): { ekran: EkranId; transfer?: string; uloga: Uloga | null } | null {
  const p = pathname.replace(/^\/+|\/+$/g, '')
  const m = /^(selling|buying)\/transfers\/([a-z0-9-]+)$/.exec(p)
  if (m) return { ekran: 'C2', transfer: m[2], uloga: m[1] as Uloga }
  const x = EKRANI.find((k) => k.putanja === p)
  return x ? { ekran: x.id, uloga: x.uloga } : null
}

/** Uloga na osnovu prvog dela putanje (ili null). */
export function ulogaIzPutanje(pathname: string): Uloga | null {
  const prvi = pathname.replace(/^\/+/, '').split('/')[0]
  return (['selling', 'buying', 'player', 'agent', 'financier'] as const).find((u) => u === prvi) ?? null
}
