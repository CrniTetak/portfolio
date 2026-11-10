// P3 (B) / J5 — Pogled primaoca linka (bez naloga). Vidi samo opštinu i zonu; glasa i komentariše.
import { Clock, Send, ThumbsDown, ThumbsUp } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { NedostajeObjekat } from '../../komponente/KorakNijePoceo'
import { NaslovnaSlika } from '../../komponente/Slika'
import { Dugme, Kartica, KLASA_POLJA, NapomenaNeSalje, Naslov, Oznaka, Polje, Stranica } from '../../komponente/osnovno'
import { eurKratko } from '../../logika/novac'
import { istekao, preostaloSati } from '../../logika/vreme'
import { cenaOd, nadjiLokaciju } from '../../podaci/lokacije'
import { adresaZaPrimaoca } from '../../stanje/izvedeno'
import { GLAS_KOMENTAR } from '../../stanje/scenario'
import { useStanje } from '../../stanje/StanjeProvider'

export default function PrimalacIzbora() {
  const { id = '' } = useParams()
  const { stanje, salji, vodjeno } = useStanje()
  const [ime, setIme] = useState('Marko')
  const [komentari, setKomentari] = useState<Record<string, string>>({})
  const [pokusao, setPokusao] = useState(false)
  const izbor = stanje.izbori.find((i) => i.id === id)
  if (!izbor) return <NedostajeObjekat korak={3} ka="/pocetna" />

  const rok = izbor.linkOd + izbor.trajanje
  const posiljalac = izbor.uloga === 'partner' ? 'Location menadžer Mila K. (izmišljeno)' : 'Produkcija Delta (izmišljeno)'

  if (istekao(rok, stanje.sati)) {
    return (
      <Stranica uzak>
        <Kartica className="flex flex-col items-start gap-3 p-6 md:p-8">
          <Oznaka vrsta="istekla" velika>Link je istekao</Oznaka>
          <h1 className="text-[26px] md:text-[32px]">Ovaj link je istekao.</h1>
          <p className="text-sek">Zatražite novi od pošiljaoca.</p>
        </Kartica>
      </Stranica>
    )
  }

  // Nacrt komentara se vezuje za IME i lokaciju: komentar jednog imena se nikad ne prenosi na drugo ime.
  const kljuc = (lokacijaId: string) => `${ime.trim().toLowerCase()}|${lokacijaId}`
  const nacrt = (lokacijaId: string, sacuvan?: string) =>
    komentari[kljuc(lokacijaId)] ?? sacuvan ?? (vodjeno && lokacijaId === 'industrijski-loft' ? GLAS_KOMENTAR : '')

  const glasaj = (lokacijaId: string, sud: 'da' | 'ne', sacuvan?: string) => {
    setPokusao(true)
    if (!ime.trim()) return
    salji({ tip: 'GLASAJ', izborId: izbor.id, lokacijaId, ime, sud, komentar: nacrt(lokacijaId, sacuvan) })
  }
  const posaljiKomentar = (lokacijaId: string) => {
    setPokusao(true)
    if (!ime.trim()) return
    salji({ tip: 'KOMENTARISI', izborId: izbor.id, lokacijaId, ime, komentar: nacrt(lokacijaId) })
  }

  return (
    <Stranica>
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-dugme bg-akcent-s px-4 py-3 text-sm">
        <Clock size={16} aria-hidden /> Izbor lokacija — podelila <b>{posiljalac}</b>. Link ističe za <b className="cifre">{preostaloSati(rok, stanje.sati)} h</b> (simulirano vreme).
      </div>
      <Naslov podnaslov="Glasate i komentarišete bez naloga. Adrese se ne prikazuju.">{izbor.naziv}</Naslov>
      <div className="mb-4 max-w-xl"><NapomenaNeSalje /></div>
      {vodjeno && <p className="mb-4 max-w-xl rounded-dugme bg-akcent-s px-4 py-3 text-sm" role="note" data-samo-citanje>Marko glasa za Industrijski loft. U slobodnom režimu možete menjati ime, glas i komentar.</p>}
      <div className="mb-6 max-w-sm">
        <Polje naziv="Vaše ime" obavezno htmlFor="ime" greska={pokusao && !ime.trim() ? 'Unesite vaše ime' : null} pomoc="Izmišljeno ime, služi samo za glasanje.">
          <input id="ime" autoComplete="off" readOnly={vodjeno} className={KLASA_POLJA} value={ime} onChange={(e) => setIme(e.target.value)} />
        </Polje>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {izbor.lokacijaIds.map(nadjiLokaciju).filter((l) => !!l).map((l) => {
          const moj = stanje.glasovi.find((g) => g.izborId === izbor.id && g.lokacijaId === l.id && g.ime.toLowerCase() === ime.trim().toLowerCase())
          return (
            <Kartica key={l.id} className="overflow-hidden">
              <div className="aspect-[4/3]"><NaslovnaSlika lokacija={l} /></div>
              <div className="flex flex-col gap-3 p-4">
                <div>
                  <h2 className="text-[17px] font-semibold">{l.naziv}</h2>
                  <p className="text-sm text-sek">{adresaZaPrimaoca(stanje, l.id).zona}</p>
                  <p className="cifre mt-1 font-bold">od {eurKratko(cenaOd(l))} <span className="text-sm font-normal text-prig">/ dan</span></p>
                </div>
                <div className="flex gap-2">
                  {l.id === 'industrijski-loft'
                    ? <DugmeRadnje id="glas" primarno varijanta={moj?.sud === 'da' ? 'primarno' : 'sekundarno'} ikona={ThumbsUp} slobodno={() => glasaj(l.id, 'da', moj?.komentar)}>Sviđa mi se</DugmeRadnje>
                    : <Dugme vanPrice varijanta={moj?.sud === 'da' ? 'primarno' : 'sekundarno'} ikona={ThumbsUp} aria-pressed={moj?.sud === 'da'} onClick={() => glasaj(l.id, 'da', moj?.komentar)}>Sviđa mi se</Dugme>}
                  <Dugme vanPrice varijanta={moj?.sud === 'ne' ? 'primarno' : 'sekundarno'} ikona={ThumbsDown} aria-pressed={moj?.sud === 'ne'} onClick={() => glasaj(l.id, 'ne', moj?.komentar)}>Ne sviđa mi se</Dugme>
                </div>
                <Polje naziv="Komentar" htmlFor={`k-${l.id}`}>
                  <textarea id={`k-${l.id}`} autoComplete="off" rows={2} readOnly={vodjeno} className={`${KLASA_POLJA} h-auto py-2`} value={nacrt(l.id, moj?.komentar)} onChange={(e) => setKomentari({ ...komentari, [kljuc(l.id)]: e.target.value })} />
                </Polje>
                <div><Dugme vanPrice varijanta="sekundarno" ikona={Send} onClick={() => posaljiKomentar(l.id)} disabled={!nacrt(l.id).trim()}>Pošalji komentar</Dugme></div>
                {moj && <p className="text-sm font-semibold text-uspeh" role="status">{moj.sud ? `Glas je zabeležen: ${moj.sud === 'da' ? 'Sviđa mi se' : 'Ne sviđa mi se'}.` : 'Komentar je zabeležen (bez glasa).'}</p>}
              </div>
            </Kartica>
          )
        })}
      </div>
      <p className="mt-8 text-sm"><Link to="/" className="text-akcent hover:underline">Nasetu — prototip</Link></p>
    </Stranica>
  )
}
