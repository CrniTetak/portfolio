// Traka priče pri dnu ekrana za računar i tablet (plan dorade 3, odeljak 7.1). Mere su 1:1 iz GoalToCart-a (src/traka.css).
//  - VOĐENO: dva reda. Red 1: korak + šta se dešava + „Prikaži mi". Red 2: Nazad, krugovi 1-9, Dalje, Gledaj kao, režim, Kreni ispočetka.
//  - SLOBODNO: jedan red, uz „Alati".
// Isti sastavni delovi (prekidači, Alati) koristi i telefonski panel (TrakaTelefon.tsx).
import { ChevronLeft, ChevronRight, ChevronUp, RotateCcw, TriangleAlert, Undo2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatVreme } from '../logika/vreme'
import { ciljNext, stanjeTacke } from '../prica/navigacija'
import { BROJ_KORAKA, KORAK_RACVE, ULOGE_PRICE } from '../prica/tipovi'
import { NAZIV_ULOGE } from '../podaci/akteri'
import { useStanje } from '../stanje/StanjeProvider'
import type { Uloga } from '../stanje/tipovi'
import { nazivKoraka, opisKoraka, poUloziZa } from '../tekstovi/prica'

/** Segmentirani prekidač (tamna pozadina). */
export function Seg<T extends string>({
  vrednosti, izabrano, onChange, oznaka,
}: { vrednosti: { id: T; naziv: string }[]; izabrano: T; onChange: (v: T) => void; oznaka: string }) {
  return (
    <div role="group" aria-label={oznaka} className="pr-seg">
      {vrednosti.map((v) => (
        <button key={v.id} type="button" aria-pressed={izabrano === v.id} onClick={() => izabrano !== v.id && onChange(v.id)}>{v.naziv}</button>
      ))}
    </div>
  )
}

/** Gledaj kao: Produkcija / Vlasnik / Partner (Admin samo u slobodnom režimu). */
export function PrekidacUloge() {
  const { stanje, promeniUlogu, vodjeno } = useStanje()
  const uloge: Uloga[] = vodjeno ? [...ULOGE_PRICE] : [...ULOGE_PRICE, 'admin']
  return <Seg<Uloga> oznaka="Gledaj kao" izabrano={stanje.uloga} onChange={promeniUlogu} vrednosti={uloge.map((u) => ({ id: u, naziv: NAZIV_ULOGE[u] }))} />
}

export function PrekidacRezima() {
  const { rezim, setRezim } = useStanje()
  return (
    <Seg<'vodjeno' | 'slobodno'>
      oznaka="Način rada" izabrano={rezim} onChange={setRezim}
      vrednosti={[{ id: 'vodjeno', naziv: 'Vođeno' }, { id: 'slobodno', naziv: 'Slobodno' }]}
    />
  )
}

/** Račva na koraku 9: „Rezervacija važi / Vlasnik otkaže". */
export function PrekidacRacve() {
  const { poz, setGrana } = useStanje()
  if (poz.korak !== KORAK_RACVE) return null
  return (
    <div className="pr-grp" data-racva>
      <span>Šta ako</span>
      <Seg<'vazi' | 'otkaz'>
        oznaka="Ishod posle uplate" izabrano={poz.grana} onChange={setGrana}
        vrednosti={[{ id: 'vazi', naziv: 'Važi' }, { id: 'otkaz', naziv: 'Otkaže' }]}
      />
    </div>
  )
}

/** „Napustili ste ekran priče" + „Nazad u priču". */
export function OznakaEkrana() {
  const { naEkranuPrice, prikaziMi, stanje } = useStanje()
  if (naEkranuPrice || stanje.uloga === 'admin') return null
  return (
    <>
      <span className="pr-lost" role="status" data-lostchip><TriangleAlert size={16} aria-hidden /> Napustili ste ekran priče</span>
      <button type="button" className="pr-btn pr-btn-line" onClick={prikaziMi}><Undo2 size={16} aria-hidden /> Nazad u priču</button>
    </>
  )
}

/** Oznaka odstupanja (slobodni režim) + „Vrati na korak N". */
export function OznakaOdstupanja() {
  const { stanje, vratiNaKorak, poz } = useStanje()
  if (!stanje.prica.odstupljeno) return null
  return (
    <>
      <span className="pr-lost" role="status" data-odstupanje><TriangleAlert size={16} aria-hidden /> Izmenili ste stanje van priče</span>
      <button type="button" className="pr-btn pr-btn-line" onClick={vratiNaKorak}><Undo2 size={16} aria-hidden /> Vrati na korak {poz.korak}</button>
    </>
  )
}

/** Nazad, krugovi 1-9 (skok na početak koraka; korak 9 nosi oznaku račve), Dalje. */
export function Dots() {
  const { poz, skoci, dalje, nazad } = useStanje()
  const poceo = poz.korak === 1 && poz.odradjeno === 0
  const kraj = ciljNext(poz) === null
  return (
    <div className="pr-dots" role="group" aria-label="Koraci priče">
      <button type="button" className="pr-nav" onClick={nazad} disabled={poceo} aria-label="Nazad"><ChevronLeft size={16} aria-hidden /> Nazad</button>
      {Array.from({ length: BROJ_KORAKA }, (_, i) => i + 1).map((k) => {
        const st = stanjeTacke(poz, k)
        const naziv = nazivKoraka(k, poz.grana)
        return (
          <button
            key={k} type="button" onClick={() => skoci(k)} title={naziv} data-korak={k}
            className={`pr-d${st === 'gotovo' ? ' done' : st === 'sada' ? ' now' : ''}${k === KORAK_RACVE ? ' fork' : ''}`}
            aria-current={st === 'sada' ? 'step' : undefined}
            aria-label={`Korak ${k}, ${st === 'gotovo' ? 'odrađen' : st === 'sada' ? 'tekući' : 'sledi'}: ${naziv}${k === KORAK_RACVE ? ' (ima granu Šta ako)' : ''}`}
          >{k}</button>
        )
      })}
      <button
        type="button" className="pr-nav" data-dalje onClick={dalje} disabled={kraj} aria-label={kraj ? 'Dalje (kraj priče)' : 'Dalje'}
        title={kraj ? 'Kraj priče — kreni ispočetka ili istražuj' : undefined}
      >Dalje <ChevronRight size={16} aria-hidden /></button>
    </div>
  )
}

/** Alati (samo slobodni režim): vreme, predračun sa uslugama, sakrij traku. `tamno` = unutar panela odozdo. */
export function AlatiSadrzaj({ sakrij = true, tamno = false }: { sakrij?: boolean; tamno?: boolean }) {
  const { stanje, premotaj, predracunSaUslugama, sakrijTraku } = useStanje()
  if (tamno) {
    return (
      <div>
        <p className="pr-tag" style={{ margin: '0 0 8px' }} data-vreme>Vreme u prototipu: {formatVreme(stanje.sati)} (simulirano)</p>
        <div className="pr-row" style={{ marginTop: 0 }}>
          {[24, 48, 72].map((h) => <button key={h} type="button" className="pr-btn pr-btn-line" onClick={() => premotaj(h)}>+{h} h</button>)}
        </div>
        <div className="pr-row">
          <button type="button" className="pr-btn pr-btn-line" onClick={predracunSaUslugama}>Predračun sa uslugama</button>
        </div>
      </div>
    )
  }
  const dugme = 'min-h-11 cursor-pointer rounded-dugme border border-akcent bg-white px-3 text-left text-sm font-semibold text-akcent hover:bg-akcent-s'
  return (
    <div className="flex flex-col gap-3 text-mastilo">
      <div>
        <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-prig">Vreme u prototipu</h3>
        <p className="cifre mb-2 text-sm" data-vreme>{formatVreme(stanje.sati)} <span className="text-prig">(simulirano)</span></p>
        <div className="grid grid-cols-3 gap-1.5">
          {[24, 48, 72].map((h) => <button key={h} type="button" className={`${dugme} text-center`} onClick={() => premotaj(h)}>+{h} h</button>)}
        </div>
      </div>
      <div>
        <h3 className="mb-1 text-[13px] font-semibold uppercase tracking-[0.06em] text-prig">Van priče</h3>
        <button type="button" className={`${dugme} w-full`} onClick={predracunSaUslugama}>Predračun sa uslugama</button>
      </div>
      {sakrij && <button type="button" className={`${dugme} w-full`} onClick={() => sakrijTraku(true)}>Sakrij traku (Shift + D vraća)</button>}
    </div>
  )
}

/** „Alati ▴": iskačući prozor iznad trake (računar, slobodni režim). */
function AlatiDugme() {
  const [otvoreno, setOtvoreno] = useState(false)
  const okidac = useRef<HTMLButtonElement>(null)
  const kutija = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!otvoreno) return
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOtvoreno(false); okidac.current?.focus() } }
    const klik = (e: MouseEvent) => { if (!kutija.current?.contains(e.target as Node) && !okidac.current?.contains(e.target as Node)) setOtvoreno(false) }
    window.addEventListener('keydown', k)
    window.addEventListener('mousedown', klik)
    return () => { window.removeEventListener('keydown', k); window.removeEventListener('mousedown', klik) }
  }, [otvoreno])
  return (
    <div style={{ position: 'relative' }}>
      <button ref={okidac} type="button" aria-expanded={otvoreno} aria-controls="alati-panel" onClick={() => setOtvoreno(!otvoreno)} className="pr-btn pr-btn-line">
        Alati <ChevronUp size={16} aria-hidden className={otvoreno ? 'rotate-180' : ''} />
      </button>
      {otvoreno && (
        <div id="alati-panel" ref={kutija} onClick={() => setOtvoreno(false)} role="region" aria-label="Alati" className="absolute bottom-full right-0 mb-2 w-72 rounded-kartica border border-linija bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.25)]">
          <AlatiSadrzaj />
        </div>
      )}
    </div>
  )
}

export function TrakaPrice() {
  const { poz, stanje, vodjeno, prikaziMi, kreniIspocetka } = useStanje()
  const uloga = stanje.uloga === 'admin' ? 'produkcija' : stanje.uloga
  const kraj = ciljNext(poz) === null
  const naslov = `Korak ${poz.korak} od ${BROJ_KORAKA} · ${nazivKoraka(poz.korak, poz.grana)}`

  return (
    <div className="pr-bar tamno" role="region" aria-label="Traka priče" data-traka="racunar" data-rezim={stanje.prica.rezim}>
      {vodjeno && (
        <div className="pr-story">
          <div className="pr-bar-h" data-naslov-koraka>{naslov}</div>
          <p>
            {opisKoraka(poz)} {poUloziZa(poz, uloga)}
          </p>
          <div className="pr-acts">
            <PrekidacRacve />
            <OznakaEkrana />
            <button type="button" className="pr-btn pr-btn-light" onClick={prikaziMi}>Prikaži mi <ChevronRight size={16} aria-hidden /></button>
          </div>
        </div>
      )}
      <div className="pr-ctl">
        {!vodjeno && (
          <div className="pr-free">
            <span data-naslov-koraka><b>{naslov}</b></span>
            <OznakaOdstupanja />
            <PrekidacRacve />
            <OznakaEkrana />
          </div>
        )}
        <Dots />
        <div className="pr-grp"><span>Gledaj kao</span><PrekidacUloge /></div>
        <div className="pr-push">
          {kraj && <span className="pr-demodate" data-kraj-price>Kraj priče</span>}
          {!vodjeno && <AlatiDugme />}
          <PrekidacRezima />
          <button type="button" className="pr-btn pr-btn-line" onClick={kreniIspocetka}><RotateCcw size={16} aria-hidden /> Kreni ispočetka</button>
        </div>
      </div>
    </div>
  )
}
