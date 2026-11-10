// P5 — Zahtev za rezervaciju (obrazac). Status posle slanja prikazuje ekran Rezervacija (P7).
import { Send } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { Iznos } from '../../komponente/Iznos'
import { ObracunVlasniku } from '../../komponente/ObracunVlasniku'
import { Dugme, Kartica, KLASA_POLJA, Naslov, Natpis, Polje, Stranica } from '../../komponente/osnovno'
import { osnovicaZaTermin } from '../../logika/cenovnik'
import { DOMACIN_PO_DANU_CENTI, SATI_ZAHTEV_VLASNIKA } from '../../logika/konstante'
import { OTKAZIVANJE_REDOVI } from '../../logika/dokumenti'
import { eur, NAZIV_RAZREDA } from '../../logika/novac'
import { jeZiva } from '../../logika/opcije'
import { opisTermina, terminTekst } from '../../logika/prikaz'
import { stanjeZahteva } from '../../logika/rezervacije'
import { preklapaju } from '../../logika/termini'
import { pibMbTekst, TIP_VLASNIKA } from '../../podaci/akteri'
import { dostupniRazredi, nadjiLokaciju } from '../../podaci/lokacije'
import { briefDelte, opcijeDelte, proveriTerminZaDeltu, sveLokacije, zahteviDelte, zauzetiDani } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'

export default function ZahtevRezervacije() {
  const { lokacijaId = '' } = useParams()
  const { stanje, probaj, vodjeno } = useStanje()
  const [greska, setGreska] = useState<string | null>(null)
  const navigate = useNavigate()
  const l = nadjiLokaciju(lokacijaId)
  const [domacin, setDomacin] = useState(false)
  const brief = briefDelte(stanje)
  const [prekovremeni, setPrekovremeni] = useState('0')
  if (!l) return <Navigate to="/produkcija" replace />

  if (!brief) {
    return (
      <Stranica uzak>
        <Naslov>Zahtev za rezervaciju — {l.naziv}</Naslov>
        <Kartica className="p-6"><p>Prvo pošaljite zahtev (brief), pa tek onda rezervaciju.</p>
          <p className="mt-3"><Link to="/brief" className="font-semibold text-akcent hover:underline">Pošalji zahtev (brief) →</Link></p></Kartica>
      </Stranica>
    )
  }

  // Termin: onaj iz žive opcije na ovoj lokaciji, a inače iz briefa
  const opcija = opcijeDelte(stanje).find((o) => o.lokacijaId === l.id && jeZiva(o, stanje.sati))
  const termin = opcija?.termin ?? brief.termin
  const razred = brief.razred
  const sati = Math.max(0, Math.floor(Number(prekovremeni)) || 0)
  const osnovica = osnovicaZaTermin(l, termin, razred, sati)
  const provera = proveriTerminZaDeltu(stanje, l.id, termin, zauzetiDani(stanje, l))
  const postojeci = zahteviDelte(stanje).find((z) => z.lokacijaId === l.id && stanjeZahteva(z, stanje.sati) === 'ceka' && preklapaju(z.termin, termin))

  let zasto: string | null = null
  if (osnovica === null) zasto = `Lokacija ne prima ekipu: ${NAZIV_RAZREDA[razred]}. Dostupno: ${dostupniRazredi(l).map((r) => NAZIV_RAZREDA[r]).join(', ')}.`
  else if (!provera.slobodan) zasto = provera.razlog
  else if (postojeci) zasto = 'Zahtev za ovaj termin je već poslat.'

  const posalji = () => {
    const novo = probaj({ tip: 'POSALJI_ZAHTEV', lokacijaId: l.id, termin, razred, prekovremeniSati: sati, domacin })
    const z = novo?.zahtevi.at(-1)
    if (!novo || !z) { setGreska('Zahtev nije poslat: termin je zauzet, lokacija ne prima tu ekipu ili je zahtev već poslat.'); return }
    navigate(`/produkcija/rezervacija/${z.id}`)
  }

  return (
    <Stranica uzak>
      <Naslov>Zahtev za rezervaciju — {l.naziv}</Naslov>
      <Kartica className="flex flex-col gap-4 p-5 md:p-6">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-sek">Termin</dt><dd className="font-medium">{terminTekst(termin)} ({opisTermina(termin)})</dd>
          <dt className="text-sek">Ekipa</dt><dd className="font-medium">{NAZIV_RAZREDA[razred]}</dd>
          <dt className="text-sek">Podnosilac</dt><dd className="font-medium">Produkcija Delta (izmišljeno), producent Ana P.<span className="block text-sm font-normal text-sek">{pibMbTekst('delta')}</span></dd>
          <dt className="text-sek">Cena lokacije</dt>
          <dd className="text-lg font-bold">{osnovica !== null ? <Iznos centi={osnovica} /> : '—'} <span className="block text-sm font-normal text-prig">plaća se direktno vlasniku, u dinarima</span></dd>
        </dl>
        {osnovica !== null && <div className="border-t border-linija pt-4"><ObracunVlasniku osnovicaCenti={osnovica} tip={TIP_VLASNIKA[l.vlasnikId] ?? 'pravno'} /></div>}
        <p className="rounded-dugme bg-traka px-3 py-2 text-sm">Rezervacije prave samo firme i preduzetnici (PIB i matični broj).</p>
        {vodjeno && <p className="rounded-dugme bg-akcent-s px-3 py-2 text-sm" role="note" data-samo-citanje>Polja su popunjena iz opcije i samo se čitaju. U slobodnom režimu možete menjati polja.</p>}
        <Polje naziv="Prekovremeni sati (opciono)" htmlFor="prek" pomoc={`Svaki prekovremeni sat: ${eur(l.prekovremeniSatCenti)}.`}>
          <input id="prek" type="number" min={0} max={8} inputMode="numeric" readOnly={vodjeno} className={`${KLASA_POLJA} max-w-40`} value={prekovremeni} onChange={(e) => setPrekovremeni(e.target.value)} />
        </Polje>
        <label className="flex min-h-11 cursor-pointer items-start gap-3">
          <input type="checkbox" disabled={vodjeno} className="mt-1 h-5 w-5 accent-[#C8401E]" checked={domacin} onChange={(e) => setDomacin(e.target.checked)} />
          <span><b>Domaćin na snimanju</b><br />
            <span className="text-sm text-sek">{eur(DOMACIN_PO_DANU_CENTI)} po snimajućem danu (izmišljeno). Poseban red na predračunu Nasetua; nije deo osnovice za naknadu od 15% ni iznosa za vlasnika.</span></span>
        </label>
      </Kartica>

      <Kartica className="mt-6 p-5 md:p-6">
        <Natpis>Šta sledi</Natpis>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Vlasnik odgovara u {SATI_ZAHTEV_VLASNIKA} h.</li>
          <li>Ako odobri, dobijate predračun naknade.</li>
          <li>Posle uplate naknade otvaraju se adresa i kontakt.</li>
        </ol>
        <h3 className="mt-4 font-semibold">Otkazivanje (predlog za advokata)</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-sek">
          {OTKAZIVANJE_REDOVI.map((r) => <li key={r}>{r}</li>)}
        </ul>
      </Kartica>

      {greska && <p className="mt-4 font-semibold text-opasno" role="alert">{greska}</p>}
      <div className="mt-6 flex flex-wrap items-start gap-3">
        {postojeci
          ? <Link to={`/produkcija/rezervacija/${postojeci.id}`} className="font-semibold text-akcent hover:underline">Pogledaj poslat zahtev →</Link>
          : <DugmeRadnje id="zahtev" primarno ikona={Send} disabled={!!zasto} zasto={zasto} slobodno={posalji}
              naIzvedeno={(novo) => { const z = novo.zahtevi.at(-1); if (z) navigate(`/produkcija/rezervacija/${z.id}`) }}>Pošalji zahtev vlasniku</DugmeRadnje>}
      </div>
    </Stranica>
  )
}
