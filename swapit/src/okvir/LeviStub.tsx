// Levi stub kategorija (UI 5.2, UX 2.1): veliko „+“ (→ O2), prekidač „‹ Roba ›“ (Roba · Usluge · Ideje) i lista 31 kategorije (→ P7).
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useDemo, type VrstaStuba } from '../demo/DemoProvider'
import { KATEGORIJE } from '../scenario/kategorije'
import { link, RUTA_PO_ID } from '../pravila/rute'
import { useEkran } from './kontekst'

const VRSTE: { id: VrstaStuba; naziv: string }[] = [
  { id: 'roba', naziv: 'Roba' },
  { id: 'usluge', naziv: 'Usluge' },
  { id: 'ideje', naziv: 'Ideje' },
]

/**
 * T2-stub: na ekranima ugla Prodavnica (F*, A4–A6, Moji oglasi) i Moderacija (V*) umesto kategorija stoji meni tog ugla.
 * Na javnim ekranima (P1, O1, A1…) stub kategorija ostaje.
 */
export const MENI_UGLA: Record<'prodavnica' | 'moderacija', { naziv: string; stavke: { ekran: string; naziv: string; ekrani: string[] }[]; ekrani: RegExp }> = {
  prodavnica: {
    naziv: 'Meni prodavnice',
    ekrani: /^(F[1-6]|F[89]|A[4-6]|O6)$/,
    stavke: [
      { ekran: 'F3', naziv: 'Pregled', ekrani: ['F3'] },
      { ekran: 'O6', naziv: 'Moji oglasi', ekrani: ['O6'] },
      { ekran: 'F4', naziv: 'Profil firme', ekrani: ['F4', 'F5'] },
      { ekran: 'F6', naziv: 'Rezultati', ekrani: ['F6'] },
      { ekran: 'A4', naziv: 'Akcije', ekrani: ['A4', 'A5', 'A6'] },
      { ekran: 'F9', naziv: 'Reklame', ekrani: ['F9'] },
      { ekran: 'F8', naziv: 'Pretplata', ekrani: ['F1', 'F2', 'F8'] },
    ],
  },
  moderacija: {
    naziv: 'Meni moderacije',
    ekrani: /^V[1-4]$/,
    stavke: [
      { ekran: 'V1', naziv: 'Prijave', ekrani: ['V1', 'V2'] },
      { ekran: 'V3', naziv: 'Odluke', ekrani: ['V3', 'V4'] },
      { ekran: 'S2', naziv: 'Pravila', ekrani: ['S2'] },
    ],
  },
}

/** Da li ekran u ovom uglu ima meni ugla umesto stuba kategorija. */
export const imaMeniUgla = (id: string, ugao: string): boolean => (ugao === 'prodavnica' || ugao === 'moderacija') && MENI_UGLA[ugao].ekrani.test(id)

function MeniUgla({ id, ugao }: { id: string; ugao: 'prodavnica' | 'moderacija' }) {
  const m = MENI_UGLA[ugao]
  return (
    <aside className="stub" aria-label={m.naziv} data-stub data-meni-ugla={ugao}>
      <ul>
        {m.stavke.map((s) => (
          <li key={s.ekran}>
            <a href={`#${link(s.ekran, ugao)}`} aria-current={s.ekrani.includes(id) ? 'page' : undefined}>
              {s.naziv}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export function LeviStub() {
  const { id, ugao, parametri } = useEkran()
  const demo = useDemo()
  const i = VRSTE.findIndex((v) => v.id === demo.vrstaStuba)
  const korak = (d: number) => demo.postaviVrstuStuba(VRSTE[(i + d + VRSTE.length) % VRSTE.length].id)
  const mozeNovi = RUTA_PO_ID['O2'].uglovi.includes(ugao)
  if ((ugao === 'prodavnica' || ugao === 'moderacija') && imaMeniUgla(id, ugao)) return <MeniUgla id={id} ugao={ugao} />
  return (
    <aside className="stub" aria-label="Kategorije" data-stub>
      {mozeNovi && (
        <a className="plus-dugme" href={`#${link('O2', ugao)}`} aria-label="Objavi oglas">
          <Plus size={28} strokeWidth={1.75} aria-hidden />
        </a>
      )}
      <div className="prekidac-vrste" role="group" aria-label="Vrsta oglasa">
        <button type="button" aria-label="Prethodna vrsta" onClick={() => korak(-1)}>
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden />
        </button>
        <span data-vrsta-stuba>{VRSTE[i].naziv}</span>
        <button type="button" aria-label="Sledeća vrsta" onClick={() => korak(1)}>
          <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
      <ul>
        {KATEGORIJE.map((k) => (
          <li key={k.id}>
            <a href={`#${link('P7', ugao, { kat: k.id })}`} aria-current={id === 'P7' && parametri.kat === k.id ? 'page' : undefined}>
              {k.naziv}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
