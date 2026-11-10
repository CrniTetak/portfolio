// Kontrole koje samo menjaju prikaz (PLAN B7): kvačica, pilule za izbor, padajući izbor sa zadatim vrednostima, prekidač.
// Nemaju atribute name ni autocomplete; nigde nema polja za kucanje (za tekst: PrikaznoPolje).
import { Check } from 'lucide-react'
import { useId, type ReactNode } from 'react'

/** Kvačica. Obavezna je označena rečju „obavezno“ i NIJE unapred štiklirana (PLAN B5.11). */
export function Kvacica({ oznaka, checked, onChange, obavezna = false, disabled = false, dataKljuc }: { oznaka: ReactNode; checked: boolean; onChange: (v: boolean) => void; obavezna?: boolean; disabled?: boolean; dataKljuc?: string }) {
  const id = useId()
  return (
    <label htmlFor={id} className="kvacica">
      <span className="kvacica-polje">
        <input id={id} type="checkbox" checked={checked} disabled={disabled} data-saglasnost={dataKljuc} data-obavezna={obavezna ? '1' : undefined} aria-required={obavezna || undefined} onChange={(e) => onChange(e.target.checked)} />
        {checked && <Check size={16} strokeWidth={3} aria-hidden />}
      </span>
      <span>
        {oznaka}
        {obavezna && <span className="obavezno"> (obavezno)</span>}
      </span>
    </label>
  )
}

/** Pilule za izbor jedne vrednosti (UI 5.7). */
export function Pilule<T extends string>({ opcije, vrednost, onChange, oznaka, onemoguceno = [] }: { opcije: { v: T; naziv: string }[]; vrednost: T; onChange: (v: T) => void; oznaka: string; /** Opcije koje su prikazane, ali zaključane (npr. mala pošiljka za bicikl). */ onemoguceno?: T[] }) {
  return (
    <div role="group" aria-label={oznaka} className="pilule">
      {opcije.map((o) => (
        <button key={o.v} type="button" className="pilula" aria-pressed={o.v === vrednost} disabled={onemoguceno.includes(o.v)} onClick={() => onChange(o.v)}>
          {o.v === vrednost && <Check size={16} strokeWidth={2.5} aria-hidden />}
          {o.naziv}
        </button>
      ))}
    </div>
  )
}

/** Padajući izbor sa zadatim vrednostima (samo menja prikaz). */
export function Padajuce({ oznaka, opcije, vrednost, onChange, grupe }: { oznaka: string; opcije: string[]; vrednost: string; onChange?: (v: string) => void; grupe?: { naziv: string; opcije: string[] }[] }) {
  const id = useId()
  return (
    <div className="grupa-polja">
      <label htmlFor={id} className="polje-oznaka">
        {oznaka}
      </label>
      <select id={id} className="polje-select" value={vrednost} onChange={(e) => onChange?.(e.target.value)}>
        {opcije.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        {grupe?.map((g) => (
          <optgroup key={g.naziv} label={g.naziv}>
            {g.opcije.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}

/** Prekidač (obaveštenja, tema). */
/** `prikaziStanje` (S9): uz stalan naziv piše i „uključeno“ / „isključeno“, pa se naziv ne menja kad se prekidač prebaci. */
export function Prekidac({ oznaka, ukljucen, onChange, prikaziStanje = false }: { oznaka: string; ukljucen: boolean; onChange: (v: boolean) => void; prikaziStanje?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <button type="button" role="switch" className="prekidac" aria-checked={ukljucen} aria-label={oznaka} onClick={() => onChange(!ukljucen)} />
      <span>
        {oznaka}
        {prikaziStanje && <>: {ukljucen ? 'uključeno' : 'isključeno'}</>}
      </span>
    </div>
  )
}
