// L1–L4 Luksuzni transport (slobodni tok na upit): landing → istraživanje usluga → zahtev → poslato; ponuda i potvrda žive u T7.
// Izabrana usluga (chauffeur / helikopter / jahta) prenosi se u L3, L4, T7, V5 i B2, sa svojom cenom i rutom iz scenario/ponude.ts.
import { Check } from 'lucide-react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, PraznoStanje, RedOrganizatora } from '../../komponente/Kartica'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { PozadinaBezSlike } from '../../komponente/Slika'
import { Potvrda, Strana } from '../../komponente/Strana'
import { TokDugme } from '../../komponente/TokDugme'
import { useIdi } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { MONTE_KARLO_OD } from '../../scenario/datumi'
import { datum } from '../../scenario/format'
import { TRANSPORT, TRANSPORT_USLUGE } from '../../scenario/ponude'
import { REF } from '../../scenario/strane'
import { napreduj } from '../../tokovi/tokovi'

export function L1Landing() {
  const idi = useIdi()
  return (
    <Strana stanje="landing">
      <section className="card relative overflow-hidden p-0!">
        <PozadinaBezSlike hero />
        <div className="slika-tekst">
          <h1 className="naslov-ekrana">Luxury Transport — arrive in style</h1>
        </div>
      </section>
      <p className="max-w-3xl text-ink-2">Chauffeur, helicopter or yacht: tell us where you are going, and a partner operator quotes the transfer.</p>
      <div className="flex flex-wrap gap-3">
        <Dugme onClick={() => idi('L2')}>Explore luxury transport</Dugme>
        <Dugme varijanta="secondary" onClick={() => idi('L3')}>
          Request a transfer
        </Dugme>
      </div>
    </Strana>
  )
}

export function L2Istrazi() {
  const idi = useIdi()
  const demo = useDemo()
  return (
    <Strana naslov="Explore Luxury Transport" stanje="usluge">
      <div className="grid gap-4 md:grid-cols-3">
        {TRANSPORT_USLUGE.map((u, i) => (
          <Kartica key={u.id}>
            <p className="font-display text-[24px] leading-7 font-semibold">{u.naziv}</p>
            <p className="my-3 text-ink-2">{u.opis}</p>
            <Dugme
              varijanta="secondary"
              onClick={() => {
                demo.promeniTokove((t) => ({ ...t, usluga: i }))
                idi('L3')
              }}
            >
              Request a quote
            </Dugme>
          </Kartica>
        ))}
      </div>
      <Kartica naslov="Why AllAddIn1 Transport?" tiha>
        <ul className="flex flex-col gap-2 text-ink-2">
          <li>Partner operators</li>
          <li>One advisor from request to arrival</li>
          <li>Advisor support during your journey</li>
        </ul>
      </Kartica>
    </Strana>
  )
}

export function L3Zahtev() {
  const demo = useDemo()
  const u = TRANSPORT_USLUGE[demo.tokovi.usluga]
  return (
    <Strana naslov="Transfer request" stanje="zahtev" popunjeno>
      <Kartica>
        <div className="grid gap-4 md:grid-cols-2">
          <PrikaznoPolje oznaka="Service" vrednost={u.naziv} />
          <PrikaznoPolje oznaka="Pick-up" vrednost={u.polazak} />
          <PrikaznoPolje oznaka="Destination" vrednost={u.odrediste} />
          <PrikaznoPolje oznaka="Date & time" vrednost={`${datum(MONTE_KARLO_OD)}, ${TRANSPORT.vreme}`} />
          <PrikaznoPolje oznaka="Passengers" vrednost={String(TRANSPORT.putnika)} />
          <PrikaznoPolje oznaka="Notes" vrednost="Luggage for two" />
        </div>
        <div className="mt-5">
          <TokDugme primeni={(t) => napreduj(t, 'transport', 'zatrazeno')} nakon={(x) => link('L4', x)}>
            Send request
          </TokDugme>
        </div>
        <p className="mt-3 text-[13px] text-ink-3">On request, quoted by our partner operators.</p>
      </Kartica>
    </Strana>
  )
}

export function L4Poslato() {
  const demo = useDemo()
  const idi = useIdi()
  const t = demo.tokovi
  const u = TRANSPORT_USLUGE[t.usluga]
  if (t.transport === 'none')
    return (
      <Strana naslov="Request sent" stanje="nije-poceo">
        <PraznoStanje>Send a transfer request first.</PraznoStanje>
      </Strana>
    )
  return (
    <Strana stanje={t.transport}>
      <Kartica className="mx-auto w-full max-w-2xl">
        <Potvrda naslov={`Request sent — ref ${REF.zahtev2}`} ikona={<Check size={36} strokeWidth={2} className="text-ok" aria-hidden="true" />}>
          <p className="text-ink-2">
            {u.naziv} · {u.polazak} → {u.odrediste}
          </p>
          <p>You will receive a quote from your advisor.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            <Dugme onClick={() => idi('T7', 'traveler')}>Go to my trips</Dugme>
            {t.transport === 'zatrazeno' && (
              <TokDugme varijanta="secondary" primeni={(x) => napreduj(x, 'transport', 'ponuda')} nakon={() => link('T7', 'traveler')}>
                Demo shortcut: advisor replies now
              </TokDugme>
            )}
          </div>
          <RedOrganizatora />
        </Potvrda>
      </Kartica>
    </Strana>
  )
}
