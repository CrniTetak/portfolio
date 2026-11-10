// Podnožje sa 18+ i "Play responsibly" na SVAKOM ekranu (UI 7.10, B5). Tekst je iz UI.md.
// Svi linkovi počinju sa # (nema spoljnih linkova); ekrani S6 stižu u talasu 1.
import { useIdi } from './kontekst'
import { link } from '../pravila/rute'
import { useEkran } from './kontekst'
import { PODNOZJE_TEKST } from '../tekstovi/kartice'

const LINKOVI = [
  ['terms', 'Terms'],
  ['privacy', 'Privacy'],
  ['responsible', 'Responsible play'],
  ['contact', 'Contact'],
] as const

export function Podnozje() {
  const idi = useIdi()
  const { uloga } = useEkran()
  return (
    <footer className="podnozje" data-podnozje>
      <div className="wrap flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
        <span className="zeton18" aria-label="18 plus">
          18+
        </span>
        <p className="podnozje-tekst md:flex-1">
          <b>Play responsibly.</b> {PODNOZJE_TEKST}
        </p>
        <nav className="podnozje-linkovi flex flex-wrap gap-x-4 gap-y-1" aria-label="Legal">
          {LINKOVI.map(([k, naziv]) => (
            <a
              key={k}
              href={`#${link('S6', uloga, k)}`}
              onClick={(e) => {
                e.preventDefault()
                idi('S6', uloga, k)
              }}
            >
              {naziv}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
