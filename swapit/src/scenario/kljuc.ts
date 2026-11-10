// JEDNA funkcija za proveru ključa u tabeli (V4): ključ koji dolazi iz linka ili iz zapisa NIKAD ne sme da pogodi nasleđeno
// svojstvo objekta (`constructor`, `toString`, `__proto__`…). Zato se ne koristi `in` ni golo `tabela[k]` za spoljni ključ.
// Brava u pravila/brave.test.ts hvata `in` nad tabelama u izvornom kodu.

/** Da li tabela IMA sopstveni ključ `k` (a ne nasleđeno svojstvo). */
export const imaKljuc = (tabela: object, k: unknown): k is string => typeof k === 'string' && Object.hasOwn(tabela, k)

/** Vrednost iz tabele ili undefined; spoljni ključ (iz linka, zapisa) se čita samo ovuda. */
export function uzmi<T>(tabela: Record<string, T>, k: unknown): T | undefined {
  return imaKljuc(tabela, k) ? tabela[k] : undefined
}
