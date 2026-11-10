// REGISTAR SVIH 65 EKRANA (UX.md 5): ruta, ko sme da ga vidi, da li je "kazino" ekran (traka partnera 18+), da li ima cenu (red organizatora).
// Link ima oblik #/<uloga>/<putanja> (uloga je u linku); S1, S6 i S7 su bez uloge. Pozicija priče NIJE u linku (sessionStorage).
import type { EkranId, Uloga } from '../prica/tipovi'

export const ULOGE: Uloga[] = ['organizer', 'traveler', 'advisor', 'guest']
export const NAZIV_ULOGE: Record<Uloga, string> = { organizer: 'Group organizer', traveler: 'Traveler', advisor: 'Advisor', guest: 'Guest' }
const SVE: Uloga[] = ULOGE
const ORG: Uloga[] = ['organizer']
const TRV: Uloga[] = ['traveler']
const ADV: Uloga[] = ['advisor']

export type Ruta = {
  id: EkranId
  /** Putanja posle uloge (npr. "account/passengers"). Za S1/S6/S7 ceo link. */
  put: string
  naslov: string
  uloge: Uloga[]
  kazino: boolean
  cena: boolean
  /** Naslov odeljka za telefon (malim slovima u zaglavlju). */
  odeljak: string
  /** Izgrađen u ovom talasu; ostalo prikazuje "Coming in the next build". */
  izgradjen: boolean
}

const e = (id: string, put: string, naslov: string, uloge: Uloga[], odeljak: string, o: { kazino?: boolean; cena?: boolean; gotov?: boolean } = {}): Ruta => ({
  id,
  put,
  naslov,
  uloge,
  odeljak,
  kazino: !!o.kazino,
  cena: !!o.cena,
  izgradjen: !!o.gotov,
})

export const RUTE: Ruta[] = [
  // zajednički (8)
  e('S1', '', 'Enter demo', SVE, 'Demo', { gotov: true }),
  e('S2', 'home', 'Home', SVE, 'Home', { gotov: true, kazino: true }),
  e('S3', 'login', 'Log in', SVE, 'Log in', { gotov: true }),
  e('S4', 'register', 'Register', SVE, 'Register', { gotov: true }),
  e('S5', 'packages', 'All packages', SVE, 'Packages', { cena: true, kazino: true, gotov: true }),
  e('S6', 'legal', 'Legal & responsible play', SVE, 'Legal', { gotov: true }),
  e('S7', 'about', 'About this demo', SVE, 'About', { gotov: true }),
  e('S8', 'package-preview', 'Package preview', SVE, 'Packages', { cena: true, kazino: true, gotov: true }),
  // grupni čarter i nalog organizatora (17)
  e('G1', 'charter/inquiry', 'Group Charter inquiry', SVE, 'Air charter', { gotov: true, kazino: true }),
  e('G2', 'charter/package', 'The Macau VIP Express', SVE, 'Air charter', { gotov: true, kazino: true, cena: true }),
  e('G3', 'charter/sent', 'Quote request sent', ORG, 'Air charter', { gotov: true }),
  e('G4', 'charter/quote', 'Quote & versions', ORG, 'Air charter', { gotov: true, kazino: true, cena: true }),
  e('G5', 'charter/reserve', 'Reserve & group deposit', ORG, 'Air charter', { gotov: true, cena: true }),
  e('G6', 'account/overview', 'Booking Overview', ORG, 'Booking overview', { gotov: true }),
  e('G7', 'account/group', 'Group detail', ORG, 'Group', { gotov: true }),
  e('G8', 'account/passengers', 'Passenger Management', ORG, 'Passengers', { gotov: true, kazino: true }),
  e('G9', 'account/passengers/import', 'Import passengers', ORG, 'Passengers', { gotov: true }),
  e('G10', 'account/passengers/add', 'Add passenger', ORG, 'Passengers', { gotov: true }),
  e('G11', 'account/passengers/link', 'Self-entry link', ORG, 'Passengers', { gotov: true }),
  e('G12', 'account/passengers/record', 'Passenger record', ORG, 'Passengers', { gotov: true, kazino: true }),
  e('G13', 'account/finances', 'Financial Overview', ORG, 'Finances', { gotov: true, kazino: true }),
  e('G14', 'account/finances/statement', 'Group statement', ORG, 'Finances', { gotov: true, kazino: true }),
  e('G15', 'account/deadline', 'Fill deadline', ORG, 'Fill deadline', { gotov: true, kazino: true }),
  e('G16', 'account/trip-pack', 'Trip pack', ORG, 'Trip pack', { gotov: true }),
  e('G17', 'account/advisor', 'Advisor & support', ORG, 'Advisor', { gotov: true, kazino: true }),
  // putnik (9)
  e('T1', 'join/details', 'Join group', TRV, 'Join group', { gotov: true }),
  e('T2', 'join/consents', 'Consents', TRV, 'Join group', { gotov: true }),
  e('T3', 'join/payment', 'Payment plan & pay', TRV, 'Payments', { gotov: true, cena: true }),
  e('T4', 'join/enrolled', "You're enrolled", TRV, 'Join group', { gotov: true }),
  e('T5', 'trips', 'My trips', TRV, 'My trips', { gotov: true }),
  e('T6', 'trips/group', 'Group seat', TRV, 'My trips', { gotov: true, kazino: true }),
  e('T7', 'trips/booking', 'Booking detail', TRV, 'My trips', { gotov: true }),
  e('T8', 'messages', 'Messages', TRV, 'Messages', { gotov: true }),
  e('T9', 'trips/documents', 'Trip documents', TRV, 'My trips', { gotov: true, kazino: true }),
  // savetnik (5)
  e('V1', 'desk', 'Advisor desk', ADV, 'Advisor desk', { gotov: true }),
  e('V2', 'desk/inquiry', 'Inquiry & quote builder', ADV, 'Advisor desk', { gotov: true, kazino: true, cena: true }),
  e('V3', 'desk/groups', 'Group tracker', ADV, 'Advisor desk', { gotov: true, kazino: true }),
  e('V4', 'desk/confirm', 'Confirm block / options', ADV, 'Advisor desk', { gotov: true, kazino: true }),
  e('V5', 'desk/requests', 'Individual requests', ADV, 'Advisor desk', { gotov: true }),
  // kazino krstarenje (6)
  e('K1', 'cruises', 'Cruises', SVE, 'Cruises', { kazino: true, gotov: true }),
  e('K2', 'cruises/search', 'Cruise search', SVE, 'Cruises', { gotov: true }),
  e('K3', 'cruises/results', 'Cruise results', SVE, 'Cruises', { kazino: true, cena: true, gotov: true }),
  e('K4', 'cruises/package', 'Cruise package', SVE, 'Cruises', { kazino: true, cena: true, gotov: true }),
  e('K5', 'cruises/order', 'Order & demo payment', SVE, 'Cruises', { cena: true, gotov: true }),
  e('K6', 'cruises/confirmed', 'Booking confirmed', SVE, 'Cruises', { gotov: true }),
  // Monte Karlo (8)
  e('M1', 'monte-carlo', 'Monte Carlo experiences', SVE, 'Monte Carlo', { cena: true, gotov: true }),
  e('M2', 'monte-carlo/detail', 'Experience detail', SVE, 'Monte Carlo', { kazino: true, cena: true, gotov: true }),
  e('M3', 'monte-carlo/request', 'Request a quote', SVE, 'Monte Carlo', { gotov: true }),
  e('M4', 'monte-carlo/received', 'Request received', SVE, 'Monte Carlo', { gotov: true }),
  e('M5', 'monte-carlo/quote', 'Quote received', SVE, 'Monte Carlo', { cena: true, gotov: true }),
  e('M6', 'monte-carlo/deposit', 'Deposit', SVE, 'Monte Carlo', { cena: true, gotov: true }),
  e('M7', 'monte-carlo/confirmed', 'Reservation confirmed', SVE, 'Monte Carlo', { gotov: true }),
  e('M8', 'monte-carlo/events', 'Events & Tournaments', SVE, 'Monte Carlo', { kazino: true, gotov: true }),
  // konsijerž (6)
  e('Q1', 'concierge', 'Meet our advisors', SVE, 'VIP Concierge', { gotov: true }),
  e('Q2', 'concierge/advisor', 'Advisor profile', SVE, 'VIP Concierge', { gotov: true }),
  e('Q3', 'concierge/request', 'Service request', SVE, 'VIP Concierge', { gotov: true }),
  e('Q4', 'concierge/offer', "Advisor's offer", SVE, 'VIP Concierge', { cena: true, gotov: true }),
  e('Q5', 'concierge/payment', 'Finalize payment', SVE, 'VIP Concierge', { cena: true, gotov: true }),
  e('Q6', 'concierge/confirmed', 'Reservation confirmed', SVE, 'VIP Concierge', { gotov: true }),
  // transport (4)
  e('L1', 'transport', 'Luxury Transport', SVE, 'Luxury Transport', { gotov: true }),
  e('L2', 'transport/explore', 'Explore Luxury Transport', SVE, 'Luxury Transport', { gotov: true }),
  e('L3', 'transport/request', 'Transfer request', SVE, 'Luxury Transport', { gotov: true }),
  e('L4', 'transport/sent', 'Request sent', SVE, 'Luxury Transport', { gotov: true }),
  // članstvo (2)
  e('B1', 'all-in', 'All-In membership', SVE, 'All-In', { gotov: true }),
  e('B2', 'all-in/status', 'My All-In status', TRV, 'All-In', { gotov: true }),
]

export const RUTA_PO_ID: Record<string, Ruta> = Object.fromEntries(RUTE.map((r) => [r.id, r]))

/** Kuća uloge posle ulaza. */
export const KUCA: Record<Uloga, EkranId> = { organizer: 'G6', traveler: 'T5', advisor: 'V1', guest: 'S2' }

/** Link za ekran u datoj ulozi (S1/S6/S7 bez uloge). */
export function link(id: EkranId, uloga: Uloga, sekcija?: string): string {
  const r = RUTA_PO_ID[id]
  if (id === 'S1') return '/'
  if (id === 'S7') return '/about'
  if (id === 'S6') return `/legal/${sekcija ?? 'terms'}`
  return `/${uloga}/${r.put}`
}

/** Iz linka (bez #) izvlači ekran i ulogu; null ako ruta ne postoji. */
export function razresi(putanja: string): { id: EkranId; uloga: Uloga | null; sekcija?: string } | null {
  const p = putanja.replace(/^\/+|\/+$/g, '')
  if (p === '') return { id: 'S1', uloga: null }
  if (p === 'about') return { id: 'S7', uloga: null }
  if (p === 'legal' || p.startsWith('legal/')) return { id: 'S6', uloga: null, sekcija: p.split('/')[1] }
  const [uloga, ...ostalo] = p.split('/')
  if (!ULOGE.includes(uloga as Uloga)) return null
  const put = ostalo.join('/')
  const r = RUTE.find((x) => x.put === put && x.id !== 'S1' && x.id !== 'S6' && x.id !== 'S7')
  return r ? { id: r.id, uloga: uloga as Uloga } : null
}
