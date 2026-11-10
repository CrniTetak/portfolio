// Zaglavlje (UI 5.1, UX 2.1): znak (→ početna), polje pretrage sa „više detalja“, zvezda, paket sa značkom, koverat, poeni, tema, profil.
// Telefon: znak, lupa (→ P4), pločica koraka (slobodni režim) i ≡ (meni). Sve ikonice su Lucide, debljina 1,75.
import { Menu, Moon, Search, Sun, User } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useDemo } from '../demo/DemoProvider'
import { Znak } from '../komponente/Logo'
import { PoljePretrage } from '../komponente/PoljePretrage'
import { KUCA, RUTA_PO_ID, link } from '../pravila/rute'
import { NAZIV_UGLA, UGLOVI, type Ugao } from '../prica/tipovi'
import { poeni as poeniTekst } from '../scenario/format'
import { korisnikUgla, svet } from '../scenario/svet'
import { Ikona } from './Ikone'
import { MENI_PROFILA, ZAGLAVLJE_IKONE } from './stavke'
import { PanelPricePilula } from './TrakaTelefon'
import { useEkran, useIdi, usePromenaUgla } from './kontekst'
import { useTelefon } from './useMedia'

const smeUgao = (ekran: string, ugao: Ugao): boolean => !!RUTA_PO_ID[ekran]?.uglovi.includes(ugao)

/** Dugme za promenu teme (svetla / tamna): menja izgled celog demoa i preživljava osvežavanje. */
export function PrekidacTeme() {
  const demo = useDemo()
  const tamna = demo.tema === 'tamna'
  return (
    <button type="button" className="ikona-dugme" aria-pressed={tamna} aria-label={tamna ? 'Prebaci na svetlu temu' : 'Prebaci na tamnu temu'} data-prekidac-teme onClick={() => demo.postaviTemu(tamna ? 'svetla' : 'tamna')}>
      {tamna ? <Sun size={22} strokeWidth={1.75} aria-hidden /> : <Moon size={22} strokeWidth={1.75} aria-hidden />}
    </button>
  )
}

export function Zaglavlje() {
  const { ugao } = useEkran()
  const idi = useIdi()
  const demo = useDemo()
  const telefon = useTelefon()
  const promeniUgao = usePromenaUgla()
  const [otvoreno, setOtvoreno] = useState(false)
  const korenRef = useRef<HTMLDivElement>(null)

  // meni profila: Esc zatvara i vraća fokus, klik van menija zatvara
  useEffect(() => {
    if (!otvoreno) return
    const tipka = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOtvoreno(false)
      korenRef.current?.querySelector<HTMLElement>('[aria-expanded=true]')?.focus()
    }
    const klik = (e: Event) => {
      if (!(e.target as Element).closest('[data-meni-profila]')) setOtvoreno(false)
    }
    document.addEventListener('keydown', tipka)
    document.addEventListener('mousedown', klik)
    document.addEventListener('focusin', klik)
    return () => {
      document.removeEventListener('keydown', tipka)
      document.removeEventListener('mousedown', klik)
      document.removeEventListener('focusin', klik)
    }
  }, [otvoreno])

  const s = svet(demo.poz, demo.tokovi)
  const korisnik = korisnikUgla(s, ugao)
  const znacka = ugao === 'ana' ? s.znackaPaketa.ana : ugao === 'marko' ? s.znackaPaketa.marko : 0
  const prodavnica = ugao === 'prodavnica'
  const moderacija = ugao === 'moderacija'
  const idiNa = (ekran: string) => {
    setOtvoreno(false)
    idi(ekran)
  }

  const profil = (
    <div className="relative" data-meni-profila ref={korenRef}>
      <button type="button" className="ikona-dugme" aria-expanded={otvoreno} aria-haspopup="true" aria-label="Moj nalog" data-moj-nalog onClick={() => setOtvoreno(!otvoreno)}>
        <User size={22} strokeWidth={1.75} aria-hidden />
      </button>
      {otvoreno && (
        <div className="padajuce">
          {MENI_PROFILA.filter((m) => smeUgao(m.ekran, ugao)).map((m) => (
            <a key={m.ekran} href={`#${link(m.ekran, ugao)}`} onClick={() => setOtvoreno(false)}>
              {m.naziv}
              {m.ekran === 'W1' && <span className="pomocni-tekst" data-model-u-meniju> · model u proveri</span>}
            </a>
          ))}
          <div className="naslov-grupe">Gledaj kao</div>
          {UGLOVI.map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={u === ugao}
              onClick={() => {
                setOtvoreno(false)
                promeniUgao(u)
              }}
            >
              {NAZIV_UGLA[u]}
              {u === ugao && <span className="sr-only"> (izabrano)</span>}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setOtvoreno(false)
              demo.otvoriRestart(true)
            }}
          >
            Restart demo
          </button>
          <button type="button" onClick={() => idiNa('R1')}>
            Odjavi se
          </button>
        </div>
      )}
    </div>
  )

  if (telefon)
    return (
      <header className="zaglavlje" data-zaglavlje>
        <a href={`#${link(KUCA[ugao], ugao)}`} aria-label="SWAPIT — početna" className="flex min-h-11 min-w-11 items-center justify-center">
          <Znak />
        </a>
        <div className="flex-1" />
        {demo.rezim === 'slobodno' && <PanelPricePilula />}
        <a className="ikona-dugme" href={`#${link('P4', ugao)}`} aria-label="Pretraga">
          <Search size={22} strokeWidth={1.75} aria-hidden />
        </a>
        <PrekidacTeme />
        <button type="button" className="ikona-dugme" aria-label="Meni" aria-haspopup="dialog" data-meni-dugme onClick={() => demo.otvoriMeni(true)}>
          <Menu size={22} strokeWidth={1.75} aria-hidden />
        </button>
      </header>
    )

  return (
    <header className="zaglavlje" data-zaglavlje>
      <a href={`#${link(KUCA[ugao], ugao)}`} aria-label="SWAPIT — početna" className="flex min-h-11 min-w-11 items-center justify-center">
        <Znak />
      </a>
      {moderacija ? <div className="flex-1" /> : <PoljePretrage />}
      <nav className="flex items-center gap-1" aria-label="Glavni meni">
        {!moderacija &&
          ZAGLAVLJE_IKONE.filter((i) => smeUgao(i.ekran, ugao)).map((i) => (
            <a key={i.ekran} className="ikona-dugme" href={`#${link(i.ekran, ugao)}`} aria-label={i.ekran === 'X12' && znacka > 0 ? `${i.naziv}, čeka radnju: ${znacka}` : i.naziv}>
              <Ikona naziv={i.ikona} />
              {i.ekran === 'X12' && znacka > 0 && (
                <span className="broj-znacka" data-znacka-paketa>
                  {znacka}
                </span>
              )}
            </a>
          ))}
        {korisnik && (
          <a className="poeni-pilula" href={`#${link('W1', ugao)}`} data-poeni-pilula title="Poeni — model u proveri" aria-label={`Moji poeni: ${poeniTekst(korisnik.poeni)}, model u proveri`}>
            {poeniTekst(korisnik.poeni)}
          </a>
        )}
        {prodavnica && (
          <a className="poeni-pilula" href={`#${link('F3', ugao)}`}>
            Poslovni nalog
          </a>
        )}
        {moderacija && (
          <a className="poeni-pilula" href={`#${link('V1', ugao)}`}>
            Moderacija
          </a>
        )}
        <PrekidacTeme />
        {profil}
      </nav>
    </header>
  )
}
