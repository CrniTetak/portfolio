// Zaglavlje (Dorada 4: BELO, lepljivo, linija boje uloge 3 px; plan dorade 3, D10 ostaje: navigacija je HORIZONTALNO NA VRHU): Nasetu, pločica PROTOTIP (UVEK vidljiva), navigacija uloge (računar),
// „Izbor (N)", uloga + akter i linija boje uloge. Telefon: druga sitna linija sa ulogom; „≡" (vođeno) ili pločica „Korak N/9" (slobodno).
import { FlaskConical, Menu, MoreVertical } from 'lucide-react'
import { Link, NavLink } from 'react-router'
import { KLASA_SIMBOL_ZAGLAVLJE, Simbol } from '../komponente/Simbol'
import { akterUloge, AKTERI, BOJA_ULOGE, NAZIV_ULOGE } from '../podaci/akteri'
import { useStanje } from '../stanje/StanjeProvider'
import { OZNAKA_PROTOTIP } from '../tekstovi/prica'
import { IzborStavka, NAVIGACIJA } from './Navigacija'
import { POLAZNA } from './pristup'

export function Zaglavlje() {
  const { stanje, vodjeno, telefon, setMeni, meni, setPanel, poz } = useStanje()
  const akter = AKTERI[akterUloge(stanje.uloga, stanje.prikazVlasnika)]
  const boja = BOJA_ULOGE[stanje.uloga]
  return (
    // na telefonu položeno (niska visina) zaglavlje se ne lepi, da ne zauzima pola ekrana
    <header className="sticky top-0 z-40 bg-white text-sm text-sek shadow-pilula [@media(max-height:500px)]:static" style={{ borderBottom: `3px solid ${boja}` }}>
      <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-x-2 px-3 min-[360px]:px-4 min-[400px]:gap-x-3 sm:gap-x-5 lg:min-h-[69px]">
        <Link to={POLAZNA[stanje.uloga]} className="inline-flex min-h-11 items-center gap-2 text-[22px] font-extrabold tracking-[-0.02em] text-mastilo no-underline sm:text-2xl"><Simbol className={KLASA_SIMBOL_ZAGLAVLJE} />Nasetu</Link>
        <span
          data-oznaka-prototip="da" role="note"
          className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-prototip-ivica bg-prototip-s px-2 text-[13px] min-[400px]:px-2.5 font-bold tracking-[0.04em] max-[359px]:tracking-normal text-prototip-tekst"
        >
          <FlaskConical size={14} aria-hidden className="hidden shrink-0 min-[360px]:block" />
          <span className="lg:hidden">PROTOTIP</span>
          <span className="hidden whitespace-nowrap lg:inline">{OZNAKA_PROTOTIP}</span>
        </span>
        {!telefon && (
          <nav aria-label="Glavna navigacija" className="ml-1 flex flex-wrap items-center gap-x-3 lg:gap-x-4">
            {NAVIGACIJA[stanje.uloga].map((n) => (
              <NavLink
                key={n.do} to={n.do} end={n.tacno}
                className={({ isActive }) => `flex min-h-11 items-center text-[15px] ${isActive ? 'font-semibold text-mastilo underline decoration-2 decoration-akcent underline-offset-8' : 'font-semibold text-sek hover:text-mastilo'}`}
              >{n.naziv}</NavLink>
            ))}
            <IzborStavka />
          </nav>
        )}
        <span className="flex-1" aria-hidden />
        {!telefon && (
          <div className="whitespace-nowrap text-right leading-tight">
            <b className="flex items-center justify-end gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-mastilo" data-uloga-zaglavlje><span className="h-2.5 w-2.5 rounded-full" style={{ background: boja }} aria-hidden />{NAZIV_ULOGE[stanje.uloga]}</b>
            <span className="hidden text-[13px] lg:block">{akter.naziv}</span>
          </div>
        )}
        {telefon && !vodjeno && (
          <button
            type="button" onClick={() => setPanel(true)} aria-haspopup="dialog"
            aria-label={`Korak ${poz.korak}/9 – otvori panel priče${stanje.prica.odstupljeno ? ', izmenjeno van priče' : ''}`}
            className="flex min-h-11 cursor-pointer items-center gap-1 whitespace-nowrap rounded-dugme border border-linija-j px-2 font-semibold text-mastilo min-[400px]:px-3"
          >Korak {poz.korak}/9{stanje.prica.odstupljeno && <span className="h-2.5 w-2.5 rounded-full bg-zlato" data-odstupanje-tacka aria-hidden />}<MoreVertical size={16} aria-hidden className="hidden min-[400px]:block" /></button>
        )}
        {telefon && vodjeno && (
          <button
            type="button" aria-label="Meni" aria-expanded={meni} aria-haspopup="dialog" onClick={() => setMeni(!meni)}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-dugme border border-linija-j text-mastilo"
          ><Menu size={22} aria-hidden /></button>
        )}
      </div>
      {telefon && (
        <p className="mx-auto max-w-6xl truncate px-4 pb-1.5 text-[13px] leading-tight" data-uloga-zaglavlje>
          <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: boja }} aria-hidden /><b className="text-mastilo">{NAZIV_ULOGE[stanje.uloga]}</b> · {akter.naziv}
        </p>
      )}
    </header>
  )
}
