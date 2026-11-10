// Kontrole koje samo menjaju prikaz (B7): kvačica, segmentirani izbor, padajući izbor sa zadatim vrednostima.
// Nemaju atribute name ni autocomplete; nigde nema polja za kucanje (za tekst: PrikaznoPolje).
import { useId, type ReactNode } from 'react'
import { Check } from 'lucide-react'

export function Kvacica({ oznaka, checked, onChange, obavezna = false, disabled = false }: { oznaka: ReactNode; checked: boolean; onChange: (v: boolean) => void; obavezna?: boolean; disabled?: boolean }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[14.5px] leading-6 text-ink-2">
      <span className="relative mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[5px] border border-gold-600 bg-bg-2 text-gold-400 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-gold-400">
        <input id={id} type="checkbox" className="absolute inset-0 m-0 cursor-pointer opacity-0" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        {checked && <Check size={16} strokeWidth={2.5} aria-hidden="true" />}
      </span>
      <span>
        {oznaka}
        {obavezna && <span className="sr-only"> (required)</span>}
      </span>
    </label>
  )
}

/** Segmentirani izbor (izabrano = zlatna puna pozadina sa tamnim tekstom). */
export function Izbor<T extends string>({ opcije, vrednost, onChange, oznaka, mala = false }: { opcije: { v: T; naziv: string }[]; vrednost: T; onChange: (v: T) => void; oznaka: string; mala?: boolean }) {
  return (
    <div role="group" aria-label={oznaka} className="inline-flex overflow-hidden rounded-btn border border-gold-600">
      {opcije.map((o) => {
        const izabrano = o.v === vrednost
        return (
          <button
            key={o.v}
            type="button"
            aria-pressed={izabrano}
            onClick={() => onChange(o.v)}
            className={`px-3 font-semibold ${mala ? 'min-h-9 text-[12.5px]' : 'min-h-11 text-[13.5px]'} ${izabrano ? 'bg-gold-500 text-on-gold' : 'bg-transparent text-gold-500 hover:bg-gold-500/10'}`}
          >
            {o.naziv}
          </button>
        )
      })}
    </div>
  )
}

/** Padajući izbor sa unapred zadatim vrednostima (samo menja prikaz; bez name i autocomplete). */
export function Padajuce({ oznaka, opcije, vrednost, onChange }: { oznaka: string; opcije: string[]; vrednost: string; onChange?: (v: string) => void }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="polje-oznaka">
        {oznaka}
      </label>
      <select id={id} className="polje w-full" value={vrednost} onChange={(e) => onChange?.(e.target.value)}>
        {opcije.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
