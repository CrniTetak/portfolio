// Zaglavlje (UI 7.1): logo, jedinstven meni (UX 2.1), nalog po ulozi; na telefonu logo + hamburger + nalog.
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Menu as MenuIkona, User, X } from 'lucide-react'
import { useDemo } from '../demo/DemoProvider'
import { LogoGrb, LogoZnak } from '../komponente/Logo'
import { GLAVNI_MENI, EKRANI_NALOGA, TRAKA_NALOGA } from '../pravila/meni'
import { KUCA, RUTA_PO_ID } from '../pravila/rute'
import { LJUDI } from '../scenario/strane'
import { PanelPricePill } from './TrakaTelefon'
import { useEkran, useIdi } from './kontekst'
import { useMedia, useTelefon } from './useMedia'


const IME_NALOGA = { organizer: LJUDI.organizator.ime, traveler: LJUDI.putnik.ime, advisor: LJUDI.savetnik.ime, guest: '' } as const

export function Zaglavlje() {
  const { id, uloga } = useEkran()
  const idi = useIdi()
  const demo = useDemo()
  const telefon = useTelefon()
  // tablet (ispod 1024 px): meni u hamburgeru, kao na telefonu (UI 4)
  const kompakt = useMedia('(max-width: 1023px)')
  const [otvoren, setOtvoren] = useState<string | null>(null)
  const [hamburger, setHamburger] = useState(false)
  const zaglavljeRef = useRef<HTMLElement>(null)
  const tabovi = useRef<HTMLElement>(null)
  // telefon: aktivni tab naloga se sam dovodi u vidno polje (bez vertikalnog skrola stranice)
  useEffect(() => {
    const tab = tabovi.current?.querySelector<HTMLElement>('[aria-current=page]')
    if (tab && tabovi.current) tabovi.current.scrollTo({ left: tab.offsetLeft - tabovi.current.clientWidth / 2 + tab.clientWidth / 2 })
  }, [id, telefon])
  // otvoreni meni: Esc zatvara i vraća fokus na dugme koje ga je otvorilo; klik van menija zatvara
  useEffect(() => {
    if (!otvoren && !hamburger) return
    const tipka = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      const dugme = zaglavljeRef.current?.querySelector<HTMLElement>('[aria-expanded=true]')
      setOtvoren(null)
      setHamburger(false)
      dugme?.focus()
    }
    const klik = (e: MouseEvent) => {
      const meta = e.target as Element
      if (meta.closest('[data-meni], [data-hamburger], [data-hamburger-dugme]')) return
      setOtvoren(null)
      setHamburger(false)
    }
    document.addEventListener('keydown', tipka)
    document.addEventListener('mousedown', klik)
    document.addEventListener('focusin', klik as unknown as EventListener) // fokus izašao iz menija: zatvara se
    return () => {
      document.removeEventListener('keydown', tipka)
      document.removeEventListener('mousedown', klik)
      document.removeEventListener('focusin', klik as unknown as EventListener)
    }
  }, [otvoren, hamburger])
  const idiNa = (ekran: string) => {
    setOtvoren(null)
    setHamburger(false)
    idi(ekran)
  }
  const aktivna = (ekran?: string) => ekran === id
  const trakaNaloga = TRAKA_NALOGA[uloga]
  const uNalogu = EKRANI_NALOGA[uloga]?.includes(id) ?? false
  const ruta = RUTA_PO_ID[id]

  const nalog = (
    <div className="relative" data-meni>
      {uloga === 'guest' ? (
        <button type="button" className="btn btn-secondary" onClick={() => idiNa('S3')}>
          Log in / Register
        </button>
      ) : (
        <>
          <button
            type="button"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-2 text-gold-500"
            aria-expanded={otvoren === 'nalog'}
            data-nalog-dugme
            onClick={() => setOtvoren(otvoren === 'nalog' ? null : 'nalog')}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border border-gold-600">
              <User size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="hidden text-[15px] md:inline">{IME_NALOGA[uloga]}</span>
            <ChevronDown size={16} strokeWidth={1.75} aria-hidden="true" className="hidden md:block" />
            <span className="sr-only md:hidden">Account menu</span>
          </button>
          {otvoren === 'nalog' && (
            <ul data-meni-lista className="absolute right-0 z-70 mt-2 w-56 rounded-card border border-gold-700 bg-bg-1 p-2 shadow-xl">
              {[
                { n: 'My account', f: () => idiNa(KUCA[uloga]) },
                { n: 'Switch role', f: () => (setOtvoren(null), demo.otvoriUlaz({ cekaRadnja: null })) },
                { n: 'About this demo', f: () => idiNa('S7') },
                { n: 'Restart demo', f: () => (setOtvoren(null), demo.otvoriRestart(true)) },
                { n: 'Log out', f: () => idiNa('S1') },
              ].map((s) => (
                <li key={s.n}>
                  <button type="button" className="min-h-11 w-full rounded-btn px-3 text-left text-[15px] hover:bg-bg-3" onClick={s.f}>
                    {s.n}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )

  return (
    <>
      <header className="hdr relative z-50" data-zaglavlje ref={zaglavljeRef}>
        <button type="button" onClick={() => idiNa('S2')} aria-label="AllAddIn1 — home" className="flex items-center">
          {telefon ? <LogoGrb velicina={44} /> : <LogoZnak sirina={190} />}
        </button>
        {!kompakt && (
          <nav aria-label="Main" className="mx-auto flex items-center gap-6">
            {GLAVNI_MENI.map((s) =>
              s.podmeni ? (
                <div key={s.naziv} className="relative" data-meni>
                  <button
                    type="button"
                    className={`nav-stavka flex items-center gap-1 ${s.podmeni.some((p) => aktivna(p.ekran)) ? 'nav-aktivna' : ''}`}
                    aria-expanded={otvoren === s.naziv}
                    onClick={() => setOtvoren(otvoren === s.naziv ? null : s.naziv)}
                  >
                    {s.naziv}
                    <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  {otvoren === s.naziv && (
                    <ul data-meni-lista className="absolute left-0 z-70 mt-2 w-52 rounded-card border border-gold-700 bg-bg-1 p-2 shadow-xl">
                      {s.podmeni.map((p) => (
                        <li key={p.ekran}>
                          <button type="button" className="min-h-11 w-full rounded-btn px-3 text-left text-[14px] hover:bg-bg-3" aria-current={aktivna(p.ekran) ? 'page' : undefined} onClick={() => idiNa(p.ekran)}>
                            {p.naziv}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <button key={s.naziv} type="button" className={`nav-stavka ${aktivna(s.ekran) ? 'nav-aktivna' : ''}`} aria-current={aktivna(s.ekran) ? 'page' : undefined} onClick={() => idiNa(s.ekran!)}>
                  {s.naziv}
                </button>
              ),
            )}
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {telefon && demo.rezim === 'free' && uloga !== 'guest' && <PanelPricePill />}
          {nalog}
          {kompakt && (
            <button type="button" className="grid h-11 w-11 shrink-0 place-items-center text-gold-500" aria-expanded={hamburger} data-hamburger-dugme aria-label={hamburger ? 'Close menu' : 'Open menu'} onClick={() => setHamburger(!hamburger)}>
              {hamburger ? <X size={22} strokeWidth={1.75} /> : <MenuIkona size={22} strokeWidth={1.75} />}
            </button>
          )}
        </div>
        {kompakt && hamburger && (
          <nav aria-label="Main" className="absolute inset-x-0 top-full z-50 max-h-[75vh] overflow-y-auto border-b border-gold-700 bg-bg-0 px-4 py-4" data-hamburger>
            {GLAVNI_MENI.map((s) => (
              <div key={s.naziv} className="border-b border-gold-800 py-2">
                {s.podmeni ? (
                  <>
                    <p className="px-1 pt-2 pb-1 text-[12px] font-semibold tracking-[.14em] text-gold-500 uppercase">{s.naziv}</p>
                    {s.podmeni.map((p) => (
                      <button key={p.ekran} type="button" className="block min-h-11 w-full px-1 text-left text-[16px]" aria-current={aktivna(p.ekran) ? 'page' : undefined} onClick={() => idiNa(p.ekran)}>
                        {p.naziv}
                      </button>
                    ))}
                  </>
                ) : (
                  <button type="button" className="block min-h-11 w-full px-1 text-left text-[16px]" aria-current={aktivna(s.ekran) ? 'page' : undefined} onClick={() => idiNa(s.ekran!)}>
                    {s.naziv}
                  </button>
                )}
              </div>
            ))}
            {trakaNaloga && (
              <div className="py-2">
                <p className="px-1 pt-2 pb-1 text-[12px] font-semibold tracking-[.14em] text-gold-500 uppercase">My account</p>
                {trakaNaloga.map((s) => (
                  <button key={s.ekran} type="button" className="block min-h-11 w-full px-1 text-left text-[16px]" aria-current={aktivna(s.ekran) ? 'page' : undefined} onClick={() => idiNa(s.ekran)}>
                    {s.naziv}
                  </button>
                ))}
              </div>
            )}
          </nav>
        )}
      </header>

      {telefon && ruta && !hamburger && !uNalogu && (
        <div className="border-b border-gold-800 px-4 py-2 text-[12px] font-semibold tracking-[.14em] text-gold-500 uppercase" data-odeljak>
          {ruta.odeljak}
        </div>
      )}
      {!telefon && uNalogu && trakaNaloga && (
        <nav aria-label="Account" className="border-b border-gold-800 bg-bg-0">
          <div className="wrap flex gap-6 overflow-x-auto">
            {trakaNaloga.map((s) => (
              <button key={s.ekran} type="button" className={`nav-stavka nav-mala ${aktivna(s.ekran) ? 'nav-aktivna' : ''}`} aria-current={aktivna(s.ekran) ? 'page' : undefined} onClick={() => idiNa(s.ekran)}>
                {s.naziv}
              </button>
            ))}
          </div>
        </nav>
      )}
      {telefon && uNalogu && trakaNaloga && (
        <nav aria-label="Account" className="traka-tabova flex gap-4 overflow-x-auto border-b border-gold-800 px-4" ref={tabovi}>
          {trakaNaloga.map((s) => (
            <button key={s.ekran} type="button" className={`nav-stavka nav-mala shrink-0 ${aktivna(s.ekran) ? 'nav-aktivna' : ''}`} aria-current={aktivna(s.ekran) ? 'page' : undefined} onClick={() => idiNa(s.ekran)}>
              {s.naziv}
            </button>
          ))}
        </nav>
      )}
    </>
  )
}
