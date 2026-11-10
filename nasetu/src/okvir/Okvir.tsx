// Zajednički okvir svih ekrana: zaglavlje (jedan tamni blok), sadržaj, podnožje i JEDAN sloj pri dnu (traka priče).
// Ovde su i zaštita ruta po ulozi, naslov stranice, fokus, poruke (toast), potvrde i panel/meni telefona.
// Dorada 3: traka uloga, pojas i dugme „Demo" su zamenjeni trakom priče (prica/, TrakaPrice, TrakaTelefon).
import { Info } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { Dugme, DugmeLink, Kartica, ProzorPotvrde, Stranica } from '../komponente/osnovno'
import { akterUloge, AKTERI, NAZIV_ULOGE } from '../podaci/akteri'
import { useStanje } from '../stanje/StanjeProvider'
import type { Uloga } from '../stanje/tipovi'
import { PORUKA_UVOD_SLOBODNO, uOvomKoraku } from '../tekstovi/prica'
import { DockProvider } from './DockKontekst'
import { DonjaNavigacija, Meni } from './Navigacija'
import { POLAZNA, smeNaLink, ulogeZaLink } from './pristup'
import { TrakaPrice } from './TrakaPrice'
import { PanelOdDole, TrakaTelefon } from './TrakaTelefon'
import { Zaglavlje } from './Zaglavlje'

// ---------------------------------------------------------------- podnožje

function Podnozje() {
  return (
    <footer className="mt-12 bg-traka">
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-8 text-sm text-prig">
        <p><Link to="/pravno" className="inline-flex min-h-11 items-center font-semibold text-akcent underline">Pravne strane (nacrt)</Link> <span className="text-prig">· opšti uslovi, privatnost i kolačići, ugovori o posredovanju (v0.1, izmišljeno)</span></p>
        <p className="mt-2">
          Nasetu je prototip sa izmišljenim podacima (firme, osobe, adrese, cene, kurs i računi). Ništa se ne plaća, ne šalje i ne pamti van ove kartice pregledača.
          Ne koristi kolačiće ni analitiku.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-block rounded-full border border-linija-j px-3 py-0.5 text-[13px] font-bold uppercase tracking-[0.12em]">Prototip — nije pravi servis</span>
          <Link to="/" className="inline-flex min-h-11 items-center font-semibold text-akcent underline">Početni ekran (izbor uloge i načina)</Link>
        </p>
      </div>
    </footer>
  )
}

// ---------------------------------------------------------------- zaštita rute po ulozi

/** Prikazuje se umesto ekrana koji pripada drugoj ulozi (npr. posle dugmeta „Nazad"). */
function TudjiEkran({ vlasnici }: { vlasnici: Uloga[] }) {
  const { stanje, salji, vodjeno, udjiUAdmina } = useStanje()
  const u = vlasnici[0]
  // Admin u vođenom režimu: poruka i prelazak u slobodni režim (plan dorade 3, D9)
  if (u === 'admin' && vodjeno) {
    return (
      <Stranica uzak>
        <Kartica className="flex flex-col items-start gap-4 p-6 md:p-8">
          <h1 className="text-[26px] md:text-[32px]">Admin je dostupan u slobodnom režimu</h1>
          <p className="text-sek">U vođenoj priči se vide samo Produkcija, Vlasnik i Partner. Admin (Nasetu tim) se otvara kad pređete u slobodno istraživanje.</p>
          <div className="flex flex-wrap gap-3">
            <Dugme onClick={udjiUAdmina}>Pređi u slobodni režim</Dugme>
            <DugmeLink to={POLAZNA[stanje.uloga]} varijanta="sekundarno">Nazad</DugmeLink>
          </div>
        </Kartica>
      </Stranica>
    )
  }
  return (
    <Stranica uzak>
      <Kartica className="flex flex-col items-start gap-4 p-6 md:p-8">
        <h1 className="text-[26px] md:text-[32px]">Ovaj ekran vidi {NAZIV_ULOGE[u]}</h1>
        <p className="text-sek">Trenutno gledate kao drugu ulogu, pa ovde nema ništa da se prikaže. Podaci (npr. adresa) se ne prikazuju ulozi koja na njih nema pravo.</p>
        <div className="flex flex-wrap gap-3">
          <Dugme onClick={() => salji({ tip: 'PROMENI_ULOGU', uloga: u })}>Gledaj kao {NAZIV_ULOGE[u]}</Dugme>
          <DugmeLink to={POLAZNA[stanje.uloga]} varijanta="sekundarno">Na početnu</DugmeLink>
        </div>
      </Kartica>
    </Stranica>
  )
}

// ---------------------------------------------------------------- poruke i prozori

/** Tiha poruka iznad trake; sadržaj je i u regionu za čitače ekrana. Apsolutno postavljena u donjem bloku (nije poseban fiksni sloj). */
function Toast() {
  const { poruka } = useStanje()
  return (
    <div role="status" aria-live="polite" data-toast-region>
      {poruka && (
        <div className="pointer-events-none absolute inset-x-0 bottom-full mb-3 flex justify-center px-3" data-toast>
          <div className="pr-toast">
            <Info size={16} aria-hidden className="shrink-0" />
            <span>{poruka.glavna}{poruka.dodatak ? ` · ${poruka.dodatak}` : ''}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function PotvrdaProzor() {
  const { potvrda, zatvoriPotvrdu } = useStanje()
  if (!potvrda) return null
  return (
    <ProzorPotvrde
      naslov={potvrda.naslov} tekst={potvrda.tekst} potvrdi={potvrda.potvrdi} odustani="Odustani"
      onPotvrdi={() => { const radi = potvrda.onPotvrdi; zatvoriPotvrdu(); radi() }} onOdustani={zatvoriPotvrdu}
    />
  )
}

/** Jednokratni uvod pri prvom ulasku u slobodni režim (D22). Stoji na vrhu sadržaja (nije fiksan), da traka ostane iste visine kao u GoalToCart-u. */
function UvodSlobodno() {
  const { stanje, odbaciUvod } = useStanje()
  if (stanje.prica.rezim !== 'slobodno' || stanje.prica.vidjenUvodSlobodno) return null
  return (
    <div className="mx-auto mt-4 flex max-w-6xl items-start gap-3 rounded-dugme bg-prototip-s px-4 py-2 text-sm text-prototip-tekst" role="note" data-uvod-slobodno>
      <p className="flex-1">{PORUKA_UVOD_SLOBODNO}</p>
      <button type="button" onClick={odbaciUvod} className="min-h-11 shrink-0 cursor-pointer rounded-dugme border border-prototip-tekst px-3 font-semibold">Razumem</button>
    </div>
  )
}

// ---------------------------------------------------------------- ceo okvir

function OkvirSadrzaj() {
  const { stanje, vodjeno, telefon, naEkranuPrice, poz, sakrijTraku } = useStanje()
  const { pathname } = useLocation()
  const glavni = useRef<HTMLElement>(null)
  const donji = useRef<HTMLDivElement>(null)
  const prviPut = useRef(true)
  const dozvoljeno = smeNaLink(pathname, stanje.uloga)
  const akter = AKTERI[akterUloge(stanje.uloga, stanje.prikazVlasnika)]
  const skrivena = !telefon && stanje.demoSakriven

  // Visina donjeg bloka kao CSS promenljiva: sadržaj dobija razmak, pa ništa ne ostaje ispod trake
  useLayoutEffect(() => {
    const el = donji.current
    const postavi = (v: number) => document.documentElement.style.setProperty('--bar-h', `${v}px`)
    if (!el) { postavi(0); return }
    postavi(el.offsetHeight)
    const ro = new ResizeObserver(() => postavi(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [telefon, vodjeno, skrivena])

  // Na svakom novom ekranu: na vrh, naslov stranice, fokus na h1 (čitač ekrana saopšti gde je korisnik)
  useEffect(() => {
    window.scrollTo(0, 0)
    const t = setTimeout(() => {
      const h1 = glavni.current?.querySelector('h1')
      document.title = `${h1?.textContent?.trim() || 'Nasetu'} — Nasetu (prototip)`
      if (h1 && !prviPut.current) { h1.tabIndex = -1; h1.focus({ preventScroll: true }) }
      prviPut.current = false
    }, 0)
    return () => clearTimeout(t)
  }, [pathname])

  // Prečica Shift + D sakriva/prikazuje traku (kad se deli ekran); samo računar
  useEffect(() => {
    if (telefon) return
    const k = (e: KeyboardEvent) => {
      const meta = e.target as HTMLElement
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(meta?.tagName)) return
      if (e.shiftKey && e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey && !e.altKey) sakrijTraku(!stanje.demoSakriven)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [sakrijTraku, stanje.demoSakriven, telefon])

  // Napomene na vrhu sadržaja (nisu fiksne): ekrani sa novcem i dokumentima, i „u ovom koraku…" za ulogu koja nema šta da radi
  let dodatak: string | null = null
  // „Uplata je simulirana" samo kad uplata stvarno postoji (potvrđena u prototipu)
  const imaUplate = stanje.predracuni.some((p) => p.uplataPotvrdjena !== null)
  if (imaUplate && /predracun|rezervacija|^\/vlasnik\/zahtev|^\/admin/.test(pathname)) dodatak = 'Uplata je simulirana.'
  if (/^\/(primeri|pravno)/.test(pathname)) dodatak = 'PRIMER — nije pravni dokument.'
  const uloga = stanje.uloga === 'admin' ? null : stanje.uloga
  const tekstKoraka = vodjeno && uloga && naEkranuPrice ? uOvomKoraku(poz, uloga) : null

  return (
    <div className="flex min-h-screen flex-col" style={{ paddingBottom: 'var(--bar-h, 0px)' }} data-rezim={stanje.prica.rezim} data-telefon={telefon ? 'da' : 'ne'}>
      {/* hash ruter: skip link ne sme da menja hash, pa fokus postavljamo ručno */}
      <a
        href="#sadrzaj"
        onClick={(e) => { e.preventDefault(); glavni.current?.focus() }}
        className="sr-only z-[80] rounded-dugme bg-white px-4 py-2 font-semibold text-akcent focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
      >Preskoči na sadržaj</a>
      <Zaglavlje />
      {/* najava promene uloge za čitače ekrana */}
      <div className="sr-only" role="status" aria-live="polite">Gledate kao: {akter.naziv}</div>
      <main id="sadrzaj" ref={glavni} tabIndex={-1} className="flex-1 outline-none">
        <UvodSlobodno />
        {(dodatak || tekstKoraka) && dozvoljeno && (
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-4">
            {tekstKoraka && <p className="rounded-dugme bg-akcent-s px-4 py-3 text-sm" role="note" data-u-ovom-koraku>{tekstKoraka}</p>}
            {dodatak && <p className="rounded-dugme bg-prototip-s px-4 py-2 text-sm font-bold text-prototip-tekst" role="note" data-dodatak>{dodatak}</p>}
          </div>
        )}
        {dozvoljeno ? <Outlet /> : <TudjiEkran vlasnici={ulogeZaLink(pathname)} />}
      </main>
      <Podnozje />

      {/* JEDAN fiksni sloj pri dnu */}
      {!skrivena && (
        <div ref={donji} className="fixed inset-x-0 bottom-0 z-50 text-[14px] leading-[1.5]" data-donji>
          <Toast />
          {telefon ? (vodjeno ? <TrakaTelefon /> : <DonjaNavigacija />) : <TrakaPrice />}
        </div>
      )}
      {skrivena && (
        <div className="pointer-events-none fixed inset-x-0 bottom-16 z-50"><div className="relative"><Toast /></div></div>
      )}
      {skrivena && (
        <button
          type="button" onClick={() => sakrijTraku(false)} data-prikazi-traku
          className="fixed bottom-3 right-3 z-50 min-h-11 cursor-pointer rounded-dugme bg-mastilo px-4 text-sm font-semibold text-white shadow-plutajuce"
        >Prikaži traku</button>
      )}
      <PanelOdDole />
      <Meni />
      <PotvrdaProzor />
    </div>
  )
}

export function Okvir() {
  return (
    <DockProvider>
      <OkvirSadrzaj />
    </DockProvider>
  )
}
