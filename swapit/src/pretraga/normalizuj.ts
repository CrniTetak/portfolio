// Normalizacija teksta za pretragu (PLAN B4.5): mala slova; ćirilica → latinica; č, ć → c; š → s; ž → z; đ i „dj“ → d;
// znakovi interpunkcije postaju razmaci; višak razmaka se skida. Ista funkcija važi za upit i za tekst oglasa.

const CIRILICA: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', ђ: 'dj', е: 'e', ж: 'z', з: 'z', и: 'i', ј: 'j', к: 'k', л: 'l', љ: 'lj', м: 'm',
  н: 'n', њ: 'nj', о: 'o', п: 'p', р: 'r', с: 's', т: 't', ћ: 'c', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'c', џ: 'dz', ш: 's',
}

/** Najveća dužina upita (PLAN B4.5, maxlength polja). */
export const NAJVISE_ZNAKOVA = 40

export function normalizuj(tekst: string): string {
  let s = tekst.slice(0, NAJVISE_ZNAKOVA * 4).toLowerCase()
  s = [...s].map((c) => CIRILICA[c] ?? c).join('')
  s = s.replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'dj')
  // „dj“ i „d“ se ne razlikuju (đorđe = djordje = dordje)
  s = s.replace(/dj/g, 'd')
  s = s.replace(/[^a-z0-9]+/g, ' ').trim()
  return s
}

/** Reči normalizovanog teksta. */
export const reci = (tekst: string): string[] => {
  const n = normalizuj(tekst)
  return n ? n.split(' ') : []
}
