// Tekstovi za prikaz termina (jedno mesto, da svi ekrani pišu datume isto).
import { daniTermina } from './termini'
import type { Termin } from './tipovi'
import { formatDanKratko } from './vreme'

/** "uto 17. 11." ili "pon 16. 11. – uto 17. 11." */
export function terminTekst(t: Termin): string {
  const d = daniTermina(t)
  if (d.length === 0) return '—'
  return d.length === 1 ? formatDanKratko(d[0]) : `${formatDanKratko(d[0])} – ${formatDanKratko(d[d.length - 1])}`
}

/** "1 snimajući dan + 1 dan pripreme" */
export function opisTermina(t: Termin): string {
  const s = t.snimanje.length
  const p = t.priprema.length
  const snimajuci = s === 1 ? 'snimajući dan' : 'snimajuća dana'
  const sn = `${s} ${s >= 5 ? 'snimajućih dana' : snimajuci}`
  if (p === 0) return sn
  return `${sn} + ${p} ${p === 1 ? 'dan pripreme' : p < 5 ? 'dana pripreme' : 'dana pripreme'}`
}
