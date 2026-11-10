// Ulazni ekran (kao C1 u GoalToCart-u): lažna prijava bez lozinke. Izbor uloge (tri kartice) i načina rada, pa „Uđi u demo".
// Admina nema na ulazu: do njega se stiže samo u slobodnom režimu (Gledaj kao).
import { Building2, Check, Clapperboard, FlaskConical, Handshake, type LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ProzorPotvrde } from '../../komponente/osnovno'
import { KLASA_SIMBOL_ZAGLAVLJE, Simbol } from '../../komponente/Simbol'
import { BOJA_ULOGE, NAZIV_ULOGE } from '../../podaci/akteri'
import { ULOGE_PRICE, type Rezim, type UlogaPrice } from '../../prica/tipovi'
import { useStanje } from '../../stanje/StanjeProvider'
import { OZNAKA_PROTOTIP, ULAZ } from '../../tekstovi/prica'

const IKONA_ULOGE: Record<UlogaPrice, LucideIcon> = { produkcija: Clapperboard, vlasnik: Building2, partner: Handshake }

export default function Ulaz() {
  const { ulaz, rezim: sacuvan, stanje } = useStanje()
  const [pita, setPita] = useState(false)
  // ako već postoji napredak (ili izmene van priče), „Uđi u demo" traži potvrdu: kreće se od koraka 1
  const imaNapredak = stanje.prica.korak > 1 || stanje.prica.odradjeno > 0 || stanje.prica.odstupljeno
  const [uloga, setUloga] = useState<UlogaPrice>('produkcija')
  const [rezim, setRezim] = useState<Rezim>(sacuvan)

  useEffect(() => { document.title = 'Dobro došli — Nasetu (prototip)' }, [])

  return (
    <div className="flex min-h-screen flex-col" data-ekran="ulaz">
      <header className="bg-white shadow-pilula">
        <div className="mx-auto flex min-h-14 max-w-4xl items-center gap-3 px-4 lg:min-h-[72px]">
          <span className="inline-flex items-center gap-2 text-[22px] font-extrabold tracking-[-0.02em] text-mastilo sm:text-2xl"><Simbol className={KLASA_SIMBOL_ZAGLAVLJE} />Nasetu</span>
          <span data-oznaka-prototip="da" role="note" className="inline-flex min-h-7 items-center gap-1.5 rounded-full border border-prototip-ivica bg-prototip-s px-2.5 text-[13px] font-bold tracking-[0.04em] text-prototip-tekst">
            <FlaskConical size={14} aria-hidden /><span className="sm:hidden">PROTOTIP</span><span className="hidden sm:inline">{OZNAKA_PROTOTIP}</span>
          </span>
        </div>
      </header>
      <main id="sadrzaj" className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 md:py-12">
        <div>
          <h1 className="hero-naslov text-[32px] leading-[1.1] md:text-5xl">{ULAZ.naslov}</h1>
          <p className="mt-2 max-w-2xl text-lg text-sek">{ULAZ.uvod}</p>
        </div>

        <section aria-labelledby="uloge-h">
          <h2 id="uloge-h" className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-prig">{ULAZ.izaberiUlogu}</h2>
          <div className="grid gap-4 sm:grid-cols-3" role="group" aria-label="Uloga">
            {ULOGE_PRICE.map((u) => {
              const izabrana = u === uloga
              const Ikona = IKONA_ULOGE[u]
              return (
                <button
                  key={u} type="button" aria-pressed={izabrana} data-uloga={u} onClick={() => setUloga(u)}
                  className={`relative flex min-h-11 cursor-pointer flex-col items-start gap-1 rounded-kartica border-2 p-5 text-left transition hover:-translate-y-0.5 hover:shadow-hover ${izabrana ? 'border-akcent bg-akcent-s' : 'border-linija bg-white'}`}
                >
                  <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ background: BOJA_ULOGE[u] }} aria-hidden><Ikona size={26} /></span>
                  {izabrana && <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-akcent text-white"><Check size={14} aria-hidden /></span>}
                  <b className="text-xl">{NAZIV_ULOGE[u]}</b>
                  <span className="text-sm text-sek">{ULAZ.uloge[u]}</span>
                </button>
              )
            })}
          </div>
        </section>

        {/* telefon: uloga, pa režim (cela širina, dva jednaka dela), pa „Uđi u demo" (cela širina); od sm: u redu, dugme levo */}
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          <div role="group" aria-label="Način rada" className="flex flex-col gap-2 sm:order-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <span className="text-sek">{ULAZ.rezim}</span>
            <div className="grid grid-cols-2 gap-1 rounded-2xl border border-linija-j bg-white p-1 sm:inline-flex sm:rounded-full">
              {([['vodjeno', ULAZ.vodjeno], ['slobodno', ULAZ.slobodno]] as const).map(([id, naziv]) => (
                <button
                  key={id} type="button" aria-pressed={rezim === id} onClick={() => setRezim(id)}
                  className={`min-h-11 cursor-pointer rounded-xl px-3 text-center text-sm font-semibold sm:rounded-full sm:px-4 ${rezim === id ? 'bg-mastilo text-white' : 'text-mastilo hover:bg-traka'}`}
                >{naziv}</button>
              ))}
            </div>
          </div>
          <button
            type="button" data-udji-u-demo onClick={() => (imaNapredak ? setPita(true) : ulaz(uloga, rezim))}
            className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-dugme border border-transparent bg-akcent px-8 text-base font-semibold text-white hover:bg-akcent-t sm:order-1 sm:w-auto"
          >{ULAZ.udji}</button>
        </div>

        <p className="text-sek">{ULAZ.napomena}</p>

        <footer className="mt-auto border-t border-linija pt-4 text-sm text-prig">
          <p>{ULAZ.prototip}</p>
          <p className="mt-2"><Link to="/pravno" className="inline-flex min-h-11 items-center font-semibold text-akcent underline">Pravne strane (nacrt)</Link></p>
        </footer>
      </main>
      {pita && (
        <ProzorPotvrde
          naslov="Krenuti od koraka 1?" tekst="Već ste negde u priči. Ulaz u demo kreće ispočetka i briše izmene van priče."
          potvrdi="Da, kreni od koraka 1" odustani="Odustani"
          onPotvrdi={() => { setPita(false); ulaz(uloga, rezim) }} onOdustani={() => setPita(false)}
        />
      )}
    </div>
  )
}
