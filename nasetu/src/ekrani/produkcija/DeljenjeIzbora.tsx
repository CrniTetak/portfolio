// P3 (A) — Podešavanje deljenja izbora. Isti ekran koristi i Partner (T2).
import { Copy, Eye, ThumbsDown, ThumbsUp, X } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { NedostajeObjekat } from '../../komponente/KorakNijePoceo'
import { Odbrojavanje } from '../../komponente/Odbrojavanje'
import { Dugme, DugmeLink, Kartica, KLASA_POLJA, Naslov, Natpis, Polje, Prekidac, PraznoStanje, Stranica, NapomenaNeSalje } from '../../komponente/osnovno'
import { Layers } from 'lucide-react'
import { formatVreme } from '../../logika/vreme'
import { eurKratko } from '../../logika/novac'
import { cenaOd, nadjiLokaciju } from '../../podaci/lokacije'
import { useStanje } from '../../stanje/StanjeProvider'
import type { TrajanjeLinka } from '../../stanje/tipovi'

export default function DeljenjeIzbora() {
  const { id = '' } = useParams()
  const { stanje, salji, vodjeno } = useStanje()
  const [kopirano, setKopirano] = useState(false)
  const izbor = stanje.izbori.find((i) => i.id === id)
  if (!izbor) return <NedostajeObjekat korak={3} ka={stanje.uloga === 'partner' ? '/partner' : '/produkcija'} />

  const link = `nasetu-prototip.example/#/izbor/${izbor.id}/primalac`
  const lokacije = izbor.lokacijaIds.map(nadjiLokaciju).filter((l) => !!l)

  return (
    <Stranica>
      <Naslov podnaslov="Primalac ne vidi adrese. Glasa i komentariše bez naloga.">Podeli izbor</Naslov>
      <div className="mb-6 max-w-xl"><NapomenaNeSalje /></div>
      {vodjeno && <p className="mb-6 max-w-xl rounded-dugme bg-akcent-s px-4 py-3 text-sm" role="note" data-samo-citanje>Podešavanja izbora su samo za čitanje. U slobodnom režimu možete da ih menjate.</p>}
      <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-5">
          <Kartica className="flex flex-col gap-4 p-5">
            <Polje naziv="Naziv izbora" htmlFor="naziv">
              <input id="naziv" autoComplete="off" readOnly={vodjeno} className={KLASA_POLJA} value={izbor.naziv} onChange={(e) => salji({ tip: 'AZURIRAJ_IZBOR', izborId: izbor.id, naziv: e.target.value })} />
            </Polje>
            <Polje naziv="Za koga" htmlFor="zako" pomoc="Npr. agencija ili klijent.">
              <input id="zako" autoComplete="off" readOnly={vodjeno} className={KLASA_POLJA} value={izbor.zaKoga} onChange={(e) => salji({ tip: 'AZURIRAJ_IZBOR', izborId: izbor.id, zaKoga: e.target.value })} />
            </Polje>
            <Polje naziv="Rok isteka linka">
              <Prekidac<TrajanjeLinka> oznaka="Rok isteka linka" izabrano={izbor.trajanje} onChange={(t) => !vodjeno && salji({ tip: 'AZURIRAJ_IZBOR', izborId: izbor.id, trajanje: t })}
                vrednosti={[{ id: 24, naziv: '24 h' }, { id: 48, naziv: '48 h' }, { id: 168, naziv: '7 dana' }]} />
            </Polje>
            <Odbrojavanje rok={izbor.linkOd + izbor.trajanje} sada={stanje.sati} ukupno={izbor.trajanje} prefiks="Link ističe za" istekloTekst="Link je istekao" />
            <p className="text-sm text-sek">Link ističe: {formatVreme(izbor.linkOd + izbor.trajanje)} (simulirano vreme)</p>
          </Kartica>

          <Kartica className="p-5">
            <Natpis>Link za deljenje</Natpis>
            <p className="cifre break-all rounded-dugme bg-traka p-3 text-sm">{link}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Dugme varijanta="sekundarno" ikona={Copy} onClick={() => setKopirano(true)}>Kopiraj</Dugme>
              <DugmeLink to={`/izbor/${izbor.id}/primalac`} ikona={Eye}>Pogledaj kao primalac</DugmeLink>
            </div>
            {kopirano && <p className="mt-2 text-sm font-semibold text-uspeh" role="status">Kopirano (u prototipu link ne vodi nigde).</p>}
          </Kartica>
        </div>

        <div>
          <Natpis>Lokacije u izboru</Natpis>
          {lokacije.length === 0 ? (
            <PraznoStanje ikona={Layers} naslov="Izbor je prazan" tekst="Dodajte lokacije iz kataloga dugmetom „Dodaj u izbor“.">
              <DugmeLink to="/lokacije">Otvori katalog</DugmeLink>
            </PraznoStanje>
          ) : (
            <ul className="flex flex-col gap-3">
              {lokacije.map((l) => {
                const glasovi = stanje.glasovi.filter((g) => g.izborId === izbor.id && g.lokacijaId === l.id)
                const da = glasovi.filter((g) => g.sud === 'da').length
                const ne = glasovi.filter((g) => g.sud === 'ne').length
                return (
                  <li key={l.id}>
                    <Kartica className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link to={`/lokacije/${l.id}`} className="font-semibold hover:underline">{l.naziv}</Link>
                          <p className="text-sm text-sek">{l.opstina}, {l.zona} · od {eurKratko(cenaOd(l))} / dan</p>
                        </div>
                        <button type="button" aria-label={`Ukloni iz izbora: ${l.naziv}`} aria-disabled={vodjeno ? true : undefined} title={vodjeno ? 'Probajte u slobodnom režimu' : undefined} onClick={() => !vodjeno && salji({ tip: 'UKLONI_IZ_IZBORA', izborId: izbor.id, lokacijaId: l.id })} className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded hover:bg-traka aria-disabled:cursor-not-allowed aria-disabled:opacity-40"><X size={18} /></button>
                      </div>
                      <p className="mt-2 flex items-center gap-4 text-sm" aria-label="Rezultati glasanja">
                        <span className="flex items-center gap-1"><ThumbsUp size={14} aria-hidden /> Sviđa mi se: <b>{da}</b></span>
                        <span className="flex items-center gap-1"><ThumbsDown size={14} aria-hidden /> Ne sviđa mi se: <b>{ne}</b></span>
                      </p>
                      {glasovi.filter((g) => g.komentar).map((g) => (
                        <p key={g.ime + g.vreme} className="mt-1 rounded bg-traka px-3 py-1.5 text-sm"><b>{g.ime} (izmišljeno):</b> {g.komentar}</p>
                      ))}
                    </Kartica>
                  </li>
                )
              })}
            </ul>
          )}
          <p className="mt-3 text-sm"><Link to="/lokacije" className="font-semibold text-akcent hover:underline">+ Dodaj još lokacija iz kataloga</Link></p>
        </div>
      </div>
    </Stranica>
  )
}
