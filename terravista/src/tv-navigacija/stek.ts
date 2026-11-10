// STEK „NAZAD“ televizora (PLAN B4.2, B5.2): čiste funkcije nad nizom putanja; React/ruter ih samo koriste.
// Putanje su putanje televizora (#/tv/…) bez upita (stanje telefona u upitu se ne vraća unazad).

export const NAJVISE_U_STEKU = 50

/** Dodaje putanju na vrh; iste putanje uzastopno se ne dupliraju; stek je ograničen. */
export function stavi(stek: readonly string[], putanja: string): string[] {
  if (stek[stek.length - 1] === putanja) return [...stek]
  const novi = [...stek, putanja]
  return novi.length > NAJVISE_U_STEKU ? novi.slice(novi.length - NAJVISE_U_STEKU) : novi
}

/** Skida vrh steka; vraća [novi stek, putanja ili null ako je prazan]. */
export function skini(stek: readonly string[]): [string[], string | null] {
  if (stek.length === 0) return [[], null]
  return [stek.slice(0, -1), stek[stek.length - 1]]
}

/** Prihvata samo ispravan zapis (niz tekstova koji počinju sa /tv/ ili su tačno /tv); sve ostalo odbacuje. */
export function ocisti(sirovo: unknown): string[] {
  if (!Array.isArray(sirovo)) return []
  return sirovo.filter((x): x is string => typeof x === 'string' && /^\/tv(\/|$)/.test(x)).slice(-NAJVISE_U_STEKU)
}
