// S1 Enter demo (UX 1.2): lažna prijava bez lozinke; izbor uloge i režima; jedina potvrda 18+ u demou.
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Check } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kvacica, Izbor } from '../../komponente/Kontrole'
import { LogoGrb } from '../../komponente/Logo'
import { KUCA, link, razresi } from '../../pravila/rute'
import type { Rezim, Uloga } from '../../prica/tipovi'
import { PORUKE } from '../../tekstovi/kartice'
import { Strana } from '../../komponente/Strana'

const ULOGE: { v: Exclude<Uloga, 'guest'>; naziv: string; opis: string }[] = [
  { v: 'organizer', naziv: 'Group organizer', opis: "Book a block for your club or incentive group and track every traveler's payment." },
  { v: 'traveler', naziv: 'Traveler', opis: 'Join a group with one link, accept the terms, pay in installments.' },
  { v: 'advisor', naziv: 'Advisor', opis: 'Quote, adjust and confirm the group block with our partners.' },
]

export function S1Ulaz() {
  const demo = useDemo()
  const navigate = useNavigate()
  const lokacija = useLocation()
  const povratak = (lokacija.state as { povratak?: string } | null)?.povratak
  const [uloga, setUloga] = useState<Exclude<Uloga, 'guest'>>('organizer')
  const [rezim, setRezim] = useState<Rezim>(demo.rezim)
  const [punoletan, setPunoletan] = useState(false)

  const udji = (u: Uloga) => {
    demo.potvrdi18()
    demo.postaviRezim(rezim)
    // posle potvrde se vraća na ekran na koji je gledalac pokušao da uđe, ako je u istoj ulozi
    const r = povratak ? razresi(povratak) : null
    if (r && r.uloga === u) navigate(povratak!)
    else navigate(link(KUCA[u], u))
    window.scrollTo(0, 0)
  }

  return (
    <Strana stanje="ulaz">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 text-center">
        <LogoGrb velicina={72} />
        <div className="flex flex-col gap-2">
          <h1>Welcome to the AllAddIn1 demo</h1>
          <p className="text-[18px] text-ink-2">Follow one group booking from first inquiry to confirmation — or click around freely.</p>
        </div>
        {povratak && !demo.potvrda18 && (
          <p className="text-warn" role="status">
            {PORUKE.nemaPotvrde18}
          </p>
        )}
        <div role="radiogroup" aria-label="Choose a role" className="grid w-full gap-4 md:grid-cols-3">
          {ULOGE.map((u) => {
            const izabrano = u.v === uloga
            return (
              <button
                key={u.v}
                type="button"
                role="radio"
                aria-checked={izabrano}
                onClick={() => setUloga(u.v)}
                className={`card relative flex min-h-44 flex-col gap-2 text-left ${izabrano ? 'border-2! border-gold-400!' : ''}`}
                data-uloga-kartica={u.v}
              >
                {izabrano && (
                  <span className="absolute top-3 right-3 grid h-6 w-6 place-items-center rounded-full bg-gold-500 text-on-gold">
                    <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                  </span>
                )}
                <span className="font-display text-[24px] leading-7 font-semibold">{u.naziv}</span>
                <span className="text-ink-2">{u.opis}</span>
              </button>
            )
          })}
        </div>
        <button type="button" className="btn btn-text" onClick={() => punoletan && udji('guest')} disabled={!punoletan}>
          Just browse the site as a guest
        </button>
        <div className="flex flex-col items-center gap-4">
          <Dugme onClick={() => udji(uloga)} disabled={!punoletan}>
            Enter demo
          </Dugme>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="polje-oznaka">Mode</span>
            <Izbor<Rezim>
              oznaka="Mode"
              vrednost={rezim}
              onChange={setRezim}
              opcije={[
                { v: 'guided', naziv: 'Guided story (recommended)' },
                { v: 'free', naziv: 'Free exploration' },
              ]}
            />
          </div>
          <Kvacica oznaka="I confirm that I am 18 or over" checked={punoletan} onChange={setPunoletan} obavezna />
          {!punoletan && <p className="polje-pomoc">{PORUKE.nemaPotvrde18}</p>}
          <p className="text-[13.5px] text-ink-3">No password needed. All data is fictional. Nothing is sent. Your progress stays in this browser tab only.</p>
        </div>
      </div>
    </Strana>
  )
}
