// Podnožje na SVAKOM ekranu (UX 0): pravni tekstovi (→ S4), „Kako ređamo oglase“ (→ P10), „Podrška“ (→ S1), „Pravila zajednice“ (→ S2),
// „O ovom demou“ (→ U3) i padajući izbor jezika. Izbor drugog jezika ništa ne menja, samo prikazuje poruku (PLAN B7).
// Svi linkovi počinju sa # (nema spoljnih linkova).
import { Globe } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { link } from '../pravila/rute'
import { JEZICI, PODNOZJE_PRAVNI, PORUKE } from '../tekstovi/okvir'
import { useEkran } from './kontekst'

export function Podnozje() {
  const { ugao } = useEkran()
  const demo = useDemo()
  return (
    <footer className="podnozje" data-podnozje>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <nav aria-label="Pravni tekstovi i pomoć" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {PODNOZJE_PRAVNI.map((p) => (
            <a key={p.tekst} href={`#${link('S4', ugao, { tekst: p.tekst })}`}>
              {p.naziv}
            </a>
          ))}
          <a href={`#${link('P10', ugao)}`}>Kako ređamo oglase</a>
          <a href={`#${link('S1', ugao)}`}>Podrška</a>
          <a href={`#${link('S2', ugao)}`}>Pravila zajednice</a>
          <a href={`#${link('U3', ugao)}`}>O ovom demou</a>
        </nav>
        <label className="ml-auto flex items-center gap-2">
          <Globe size={16} strokeWidth={1.75} aria-hidden />
          <span>Jezik</span>
          {/* kontrolisano polje: ostaje na „Srpski“ bez obzira na izbor, a izbor drugog jezika samo prikaže poruku */}
          <select value={JEZICI[0]} data-jezik onChange={(e) => e.target.value !== JEZICI[0] && demo.obavesti(PORUKE.jezik)}>
            {JEZICI.map((j) => (
              <option key={j} value={j}>
                {j}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2">SWAPIT demo: svi podaci i imena su izmišljeni, ništa se ne šalje ni ne naplaćuje.</p>
    </footer>
  )
}
