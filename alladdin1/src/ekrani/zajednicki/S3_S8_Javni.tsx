// S3 Log in, S4 Register (bez lozinke i bez pravih polja), S5 All packages, S8 Package preview + Request a quote (za "slepe" kartice).
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, RedOrganizatora, TrakaPartnera18 } from '../../komponente/Kartica'
import { Izbor, Kvacica } from '../../komponente/Kontrole'
import { LogoGrb } from '../../komponente/Logo'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Strana } from '../../komponente/Strana'
import { TokDugme } from '../../komponente/TokDugme'
import { useIdi } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { noci } from '../../scenario/format'
import { cenaOdTekst, KATALOG, paket } from '../../scenario/ponude'
import { LJUDI } from '../../scenario/strane'
import { podaciUloge } from '../../okvir/korisnik'
import { useEkran } from '../../okvir/kontekst'
import { dodajZahtev, napreduj } from '../../tokovi/tokovi'

const TACKICE = '••••••••'

export function S3Prijava() {
  const demo = useDemo()
  const idi = useIdi()
  const [zapamti, setZapamti] = useState(false)
  return (
    <Strana stanje="prijava" popunjeno>
      <Kartica className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center gap-4">
          <LogoGrb velicina={64} />
          <h1 className="naslov-ekrana">Log in</h1>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <PrikaznoPolje oznaka="Username / E-mail" vrednost={LJUDI.organizator.email} />
          <PrikaznoPolje oznaka="Password" vrednost={TACKICE} />
          <Kvacica oznaka="Remember me" checked={zapamti} onChange={setZapamti} />
          <div className="flex flex-col items-start gap-1">
            <Dugme varijanta="text" disabled>
              Forgot password?
            </Dugme>
            <span className="polje-pomoc">Not available in demo</span>
          </div>
          <Dugme siroko onClick={() => demo.otvoriUlaz({ cekaRadnja: null })}>
            Log in
          </Dugme>
          <p className="text-ink-2">
            New to AllAddIn1?{' '}
            <button type="button" className="btn-link-mini" onClick={() => idi('S4')}>
              Register
            </button>
          </p>
        </div>
      </Kartica>
    </Strana>
  )
}

export function S4Registracija() {
  const idi = useIdi()
  const demo = useDemo()
  const { uloga } = useEkran()
  const ja = podaciUloge(uloga)
  const [uslovi, setUslovi] = useState(false)
  const [ponude, setPonude] = useState(false)
  const [punoletan, setPunoletan] = useState(false)
  return (
    <Strana naslov="Become an All-In member" stanje="registracija" popunjeno>
      <Kartica className="mx-auto w-full max-w-xl">
        <div className="flex flex-col gap-4">
          <PrikaznoPolje oznaka="E-mail address" vrednost={ja.email} />
          <PrikaznoPolje oznaka="Username" vrednost={ja.ime} />
          <PrikaznoPolje oznaka="Password" vrednost={TACKICE} />
          <PrikaznoPolje oznaka="Confirm password" vrednost={TACKICE} />
          <Kvacica oznaka="I agree to the Terms & Conditions and Privacy Policy" checked={uslovi} onChange={setUslovi} obavezna />
          <Kvacica oznaka="I want to receive information about offers and events" checked={ponude} onChange={setPonude} />
          <Kvacica oznaka="I confirm that I am 18 or over" checked={punoletan} onChange={setPunoletan} obavezna />
          {uloga === 'guest' ? (
            <TokDugme primeni={(t) => napreduj(t, 'clanstvo', 'prijavljeno')} blokirano={!uslovi || !punoletan ? 'Tick the required confirmations to continue' : undefined}>
              Create account
            </TokDugme>
          ) : (
            <Dugme onClick={() => demo.obavesti(`You are already signed in as ${ja.ime}`)}>Create account</Dugme>
          )}
          <p className="text-ink-2">
            Already an All-In member?{' '}
            <button type="button" className="btn-link-mini" onClick={() => idi('S3')}>
              Log in
            </button>
          </p>
        </div>
      </Kartica>
    </Strana>
  )
}

const VRSTE = ['All', 'Group charter', 'Cruises', 'Monte Carlo'] as const
type Vrsta = (typeof VRSTE)[number]
// Paketi sa svojim ekranom; ostali otvaraju S8 (pregled + zahtev za ponudu).
const EKRAN_PAKETA: Record<string, string> = { macau: 'G2', iberian: 'K4', royal: 'M2' }
const PAKETI_S5 = KATALOG.filter((p) => p.vrsta !== 'Events')

export function S5Paketi() {
  const idi = useIdi()
  const demo = useDemo()
  const [vrsta, setVrsta] = useState<Vrsta>('All')
  const lista = PAKETI_S5.filter((k) => vrsta === 'All' || k.vrsta === vrsta)
  return (
    <Strana naslov="All packages" stanje="paketi">
      <div className="flex flex-wrap items-center gap-3">
        <span className="polje-oznaka">Type</span>
        <Izbor<Vrsta> oznaka="Type" vrednost={vrsta} onChange={setVrsta} opcije={VRSTE.map((v) => ({ v, naziv: v }))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lista.map((k) => (
          <Kartica key={k.kljuc}>
            <p className="font-display text-[24px] leading-7 font-semibold">{k.naziv}</p>
            <p className="mt-1 text-ink-2">{noci(k.noci)}</p>
            <p className="my-3 text-gold-400">{cenaOdTekst(k)}</p>
            <Dugme
              varijanta="secondary"
              onClick={() => {
                const ekran = EKRAN_PAKETA[k.kljuc] ?? 'S8'
                if (ekran === 'S8') demo.promeniTokove((t) => ({ ...t, s8Kljuc: k.kljuc }))
                idi(ekran)
              }}
            >
              View details
            </Dugme>
          </Kartica>
        ))}
      </div>
      <p className="text-[13px] text-ink-3">Group packages are on request. Prices are indicative.</p>
      <TrakaPartnera18 />
      <RedOrganizatora />
    </Strana>
  )
}

// S8: pregled paketa bez fotografije (jedna slika ne sme da stoji uz različite pakete); zahtev postaje poseban red u T5/T7/V5.
export function S8Pregled() {
  const demo = useDemo()
  const idi = useIdi()
  const p = paket(demo.tokovi.s8Kljuc ?? PAKETI_S5[0].kljuc)
  return (
    <Strana naslov={p.naziv} stanje="pregled" podnaslov={`${noci(p.noci)} · ${cenaOdTekst(p)}`}>
      <p className="rounded-btn border border-gold-800 bg-bg-1 px-4 py-3 text-ink-2" data-pregled>
        Preview — this package is not detailed in the demo.
      </p>
      <Kartica naslov="What's included">
        <ul className="flex flex-col gap-2 text-ink-2">
          <li>Travel arrangements planned by your advisor</li>
          <li>Accommodation as described in the quote</li>
          <li>Transfers and a point of contact on the trip</li>
        </ul>
      </Kartica>
      <TrakaPartnera18>Partner benefits, where offered, come from the partner casino under its own licence and terms. 18+.</TrakaPartnera18>
      <div className="flex flex-wrap items-start gap-3">
        {p.tip === 'Group' ? (
          <Dugme onClick={() => idi('G1')}>Group inquiry</Dugme>
        ) : (
          <TokDugme primeni={(t) => dodajZahtev(t, p.kljuc)} nakon={(u) => link('M4', u)}>
            Request a quote
          </TokDugme>
        )}
        <Dugme varijanta="secondary" onClick={() => idi('S5')}>
          Back
        </Dugme>
      </div>
      <RedOrganizatora />
    </Strana>
  )
}
