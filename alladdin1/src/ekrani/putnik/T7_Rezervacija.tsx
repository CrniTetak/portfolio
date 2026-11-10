// T7 Booking detail (individual): krstarenje, Monte Karlo, konsijerž, transport i zahtevi iz kataloga; svaki je poseban red (izvor: tokovi/zahtevi.ts).
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, PraznoStanje, RedOrganizatora, TrakaPartnera18, TrakaTacaka } from '../../komponente/Kartica'
import { Strana } from '../../komponente/Strana'
import { TokDugme } from '../../komponente/TokDugme'
import { link } from '../../pravila/rute'
import { useIdi } from '../../okvir/kontekst'
import { BEZ_FAJLA } from '../../tekstovi/tokovi'
import { napreduj, odbij } from '../../tokovi/tokovi'
import { sviZahtevi, TEKST_BEZ_PONUDE } from '../../tokovi/zahtevi'

export function T7Rezervacija() {
  const demo = useDemo()
  const idi = useIdi()
  const lista = sviZahtevi(demo.tokovi)
  const [izabrana, setIzabrana] = useState<string | null>(null)
  if (lista.length === 0)
    return (
      <Strana naslov="Booking detail" stanje="prazno">
        <PraznoStanje naslov="Nothing here yet">Cruise bookings and requests for Monte Carlo, concierge and transport appear here.</PraznoStanje>
      </Strana>
    )
  const r = lista.find((x) => x.id === izabrana) ?? lista[lista.length - 1]
  const bezPonude = r.id.startsWith('kat-')
  const imaPonudu = r.status === 'Quoted'
  return (
    <Strana naslov={r.naziv} stanje={`${r.id}-${r.faza}${r.odbijeno ? '-odbijeno' : ''}`} podnaslov={`Ref ${r.ref} · ${r.tip}`}>
      {lista.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Bookings">
          {lista.map((x) => (
            <Dugme key={x.id} varijanta={x.id === r.id ? 'primary' : 'secondary'} mala onClick={() => setIzabrana(x.id)}>
              <span className="block max-w-56 truncate">{x.naziv.split(' · ')[0]}</span>
            </Dugme>
          ))}
        </div>
      )}
      <Kartica>
        <TrakaTacaka nazivi={r.faze} tekuca={r.faza} />
      </Kartica>
      <Kartica naslov="Overview">
        <p className="text-ink-2">{r.opis}</p>
        {bezPonude && <p className="mt-2 text-gold-400">{TEKST_BEZ_PONUDE}</p>}
        {r.iznos && (
          <p className="mt-2">
            Amount <span className="num text-gold-400">{r.iznos}</span>
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-start gap-3">
          {imaPonudu && r.id === 'monteKarlo' && (
            <>
              <Dugme onClick={() => idi('M5')}>Accept quote</Dugme>
              <TokDugme varijanta="danger" primeni={(x) => odbij(x, 'monteKarlo')} nakon={(u) => link('T7', u)}>
                Decline
              </TokDugme>
            </>
          )}
          {imaPonudu && r.id === 'konsijerz' && (
            <>
              <TokDugme primeni={(x) => napreduj(x, 'konsijerz', 'prihvaceno')} nakon={(u) => link('Q5', u)}>
                Accept offer
              </TokDugme>
              <TokDugme varijanta="danger" primeni={(x) => odbij(x, 'konsijerz')} nakon={(u) => link('T7', u)}>
                Decline
              </TokDugme>
            </>
          )}
          {imaPonudu && r.id === 'transport' && (
            <>
              <TokDugme primeni={(x) => napreduj(x, 'transport', 'prihvaceno')} nakon={(u) => link('T7', u)}>
                Accept quote
              </TokDugme>
              <TokDugme varijanta="danger" primeni={(x) => odbij(x, 'transport')} nakon={(u) => link('T7', u)}>
                Decline
              </TokDugme>
            </>
          )}
          <Dugme varijanta="secondary" onClick={() => demo.otvoriPoruku(true)}>
            Message advisor
          </Dugme>
          {!bezPonude && !r.odbijeno && (
            <Dugme varijanta="secondary" onClick={() => demo.obavesti(BEZ_FAJLA)}>
              Download confirmation
            </Dugme>
          )}
        </div>
        {(r.tip === 'Event' || r.tip === 'Monte Carlo') && <TrakaPartnera18>Casino offers, where included, come from the partner casino under its own licence and terms. 18+.</TrakaPartnera18>}
        <RedOrganizatora />
      </Kartica>
    </Strana>
  )
}
