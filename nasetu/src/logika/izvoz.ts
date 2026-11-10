// B6 — Izvoz faktura za knjigovođu: CSV od izmišljenih predračuna i uplata. Pravi se u pregledaču, bez mreže.
// Nikad ne sadrži adresu, telefon ni kontakt (ništa iz logika/adresa.ts).
import { mbKupca, nazivAktera, pibKupca } from '../podaci/akteri'
import type { Predracun } from './tipovi'

export const ZAGLAVLJE_CSV = ['Broj', 'Vrsta', 'Kupac', 'PIB', 'MB', 'Iznos (RSD)', 'Kurs', 'Poziv na broj', 'Status']

const VRSTA: Record<Predracun['vrsta'], string> = {
  naknada: 'naknada za rezervaciju',
  'izbor-van-kataloga': 'izbor van kataloga',
  fotografisanje: 'fotografisanje prostora',
}

/** 1579500 → "15795,00" (decimalni zarez, bez separatora hiljada, da Excel na srpskom prepozna broj). */
function iznosCsv(pare: number): string {
  const znak = pare < 0 ? '-' : ''
  const a = Math.abs(pare)
  return `${znak}${Math.floor(a / 100)},${String(a % 100).padStart(2, '0')}`
}

/** Redovi tabele: jedan red po predračunu, a posle otkazivanja vlasnika i poseban red povraćaja sa negativnim iznosom. */
export function redoviZaKnjigovodju(predracuni: Predracun[]): string[][] {
  const redovi: string[][] = []
  for (const p of predracuni) {
    const broj = p.pozivNaBroj.split(' ')[1] ?? p.pozivNaBroj
    const osnova = [broj, VRSTA[p.vrsta], nazivAktera(p.kupacId), tekstSaNulama(pibKupca(p.kupacId)), tekstSaNulama(mbKupca(p.kupacId))]
    redovi.push([...osnova, iznosCsv(p.ukupnoPara), String(p.kurs), p.pozivNaBroj,
      p.uplataPotvrdjena !== null ? 'plaćeno' : 'čeka uplatu'])
    if (p.povracaj) {
      redovi.push([broj, 'povraćaj', nazivAktera(p.kupacId), tekstSaNulama(pibKupca(p.kupacId)), tekstSaNulama(mbKupca(p.kupacId)),
        iznosCsv(-p.povracaj.iznosPara), String(p.kurs), p.pozivNaBroj, 'vraćeno (izmišljeno)'])
    }
  }
  return redovi
}

const JE_BROJ = /^-?\d+(,\d+)?$/

/**
 * PIB i MB počinju nulama, a Excel pri otvaranju CSV-a pretvara "000000000" u 0. Zato se vodeće nule čuvaju kao TEKST uz apostrof ispred
 * ("'000000000"): isto pravilo kao zaštita od formula, nema znaka jednakosti (="000…" je izričito zabranjeno jer je formula).
 * Cena: u ćeliji se vidi apostrof; knjigovođa ga uklanja ili uvozi kolonu kao tekst.
 */
function tekstSaNulama(v: string): string {
  return /^0\d+$/.test(v) ? `'${v}` : v
}

/**
 * Jedno polje CSV-a: navodnici oko polja sa ; " ili prelomom reda, a polje koje počinje sa = + - @ (osim običnog broja)
 * dobija apostrof ispred — zaštita od "formula" u tabeli (sadržaj je izmišljen, ali pravilo košta jedan red koda).
 */
export function poljeCsv(v: string): string {
  let t = v
  if (/^[=+\-@\t\r]/.test(t) && !JE_BROJ.test(t)) t = `'${t}`
  return /[;"\r\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t
}

/** Ceo CSV: UTF-8 sa oznakom BOM (da č, ć, š budu ispravni u Excelu), separator ; i prelomi reda CRLF. */
export function uCsv(redovi: string[][], zaglavlje: string[] = ZAGLAVLJE_CSV): string {
  return '﻿' + [zaglavlje, ...redovi].map((r) => r.map(poljeCsv).join(';')).join('\r\n') + '\r\n'
}
