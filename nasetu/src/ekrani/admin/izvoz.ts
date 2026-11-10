// Preuzimanje CSV-a za knjigovođu: fajl se pravi u pregledaču (Blob) i nikuda se ne šalje. Nema mreže, nema servera.
import { redoviZaKnjigovodju, uCsv } from '../../logika/izvoz'
import type { Predracun } from '../../logika/tipovi'

export const IME_FAJLA_CSV = 'nasetu-predracuni-primer.csv'

export function izvoz(predracuni: Predracun[]): void {
  const tekst = uCsv(redoviZaKnjigovodju(predracuni))
  const url = URL.createObjectURL(new Blob([tekst], { type: 'text/csv;charset=utf-8' }))
  const veza = document.createElement('a')
  veza.href = url
  veza.download = IME_FAJLA_CSV
  document.body.appendChild(veza)
  veza.click()
  veza.remove()
  // oslobađanje privremenog linka (sa malim zakašnjenjem, da preuzimanje stigne da krene)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
