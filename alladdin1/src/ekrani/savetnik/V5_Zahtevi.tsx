// V5 Individual requests & quotes: tri unapred pripremljena reda + zahtevi koje je gledalac napravio u slobodnim tokovima (izvor: tokovi/zahtevi.ts, ista referenca kao kod putnika).
// Savetnik šalje ponudu ("Send quote" / "Send offer") i time pomera tok; zahtevi bez punog toka ostaju "Quote requested".
import { useState } from 'react'
import { useDemo } from '../../demo/DemoProvider'
import { Dugme } from '../../komponente/Dugme'
import { Kartica, OznakaStanja, RedOrganizatora } from '../../komponente/Kartica'
import { Dve, Strana } from '../../komponente/Strana'
import { Tabela } from '../../komponente/Tabela'
import { TokDugme } from '../../komponente/TokDugme'
import { LJUDI, REF_TOKOVI } from '../../scenario/strane'
import { V5_PRIPREMLJENI } from '../../tekstovi/tokovi'
import { napreduj } from '../../tokovi/tokovi'
import { sviZahtevi, TEKST_BEZ_PONUDE, type TipReda, type Zahtev } from '../../tokovi/zahtevi'

type Red = { ref: string; tip: TipReda; opis: string; status: Zahtev['status']; iznos: string | null; akcija?: Zahtev['akcija']; moj: boolean; napomena?: string }

export function V5Zahtevi() {
  const demo = useDemo()
  const t = demo.tokovi
  const [izabran, setIzabran] = useState<string | null>(null)
  const moji: Red[] = sviZahtevi(t)
    .filter((z) => z.id !== 'krstarenje')
    .map((z) => ({ ref: z.ref, tip: z.tip, opis: z.naziv, status: z.status, iznos: z.iznos, akcija: z.akcija, moj: true, napomena: z.id.startsWith('kat-') ? TEKST_BEZ_PONUDE : undefined }))
  const pripremljeni: Red[] = [
    { ref: REF_TOKOVI.v5a, tip: 'Monte Carlo', opis: V5_PRIPREMLJENI.mk, status: 'Quoted', iznos: null, moj: false },
    { ref: REF_TOKOVI.v5b, tip: 'Concierge', opis: V5_PRIPREMLJENI.konsijerz, status: 'Accepted', iznos: null, moj: false },
    { ref: REF_TOKOVI.v5c, tip: 'Transport', opis: V5_PRIPREMLJENI.transport, status: 'New', iznos: null, moj: false },
  ]
  const redovi = [...moji, ...pripremljeni]
  const sel = redovi.find((r) => r.ref === izabran) ?? redovi[0]
  const vrstaOznake = (s: Red['status']) => (s === 'New' ? 'warn' : s === 'Quoted' ? 'info' : s === 'Declined' ? 'err' : 'ok')
  return (
    <Strana naslov="Individual requests & quotes" stanje={`zahtevi-${moji.length}`}>
      <Dve
        levo={
          <Kartica>
            <Tabela
              naslov="Requests"
              kljuc={(r) => r.ref}
              redovi={redovi}
              kolone={[
                { naslov: 'Ref', glavna: true, celija: (r) => <span className="whitespace-nowrap">{r.ref}</span> },
                { naslov: 'Type', celija: (r) => <span className="whitespace-nowrap">{r.tip}</span> },
                { naslov: 'Traveler', celija: (r) => (r.moj ? (t.podnosilac === 'organizer' ? LJUDI.organizator.ime : LJUDI.putnik.ime) : 'Guest traveler') },
                { naslov: 'Status', celija: (r) => <OznakaStanja vrsta={vrstaOznake(r.status)}>{r.status}</OznakaStanja> },
                {
                  naslov: 'Action',
                  celija: (r) => (
                    <span className="flex flex-wrap gap-2">
                      <Dugme varijanta="text" mala onClick={() => setIzabran(r.ref)}>
                        Open
                      </Dugme>
                      {r.akcija && (
                        <TokDugme mala uloge={['advisor']} primeni={(x) => napreduj(x, r.akcija!, 'ponuda')}>
                          {r.akcija === 'konsijerz' ? 'Send offer' : 'Send quote'}
                        </TokDugme>
                      )}
                    </span>
                  ),
                },
              ]}
            />
          </Kartica>
        }
        desno={
          <Kartica naslov={`Request ${sel.ref}`}>
            <ul className="flex flex-col gap-2 text-ink-2">
              <li>Type: {sel.tip}</li>
              <li>Request: {sel.opis}</li>
              <li>Status: {sel.status}</li>
              {sel.napomena && <li>{sel.napomena}</li>}
              {sel.iznos && <li>Draft quote total: {sel.iznos}</li>}
            </ul>
            <div className="mt-4">
              <RedOrganizatora />
            </div>
          </Kartica>
        }
      />
    </Strana>
  )
}
