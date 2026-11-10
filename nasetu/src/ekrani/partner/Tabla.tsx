// T1 — Tabla partnera: moji izbori. (T2, pravljenje izbora, koristi isti ekran kao P3: DeljenjeIzbora.)
import { Layers, Plus, Send } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Iznos } from '../../komponente/Iznos'
import { Dugme, DugmeLink, Kartica, KLASA_POLJA, NapomenaNeSalje, Naslov, Natpis, Oznaka, Polje, PraznoStanje, Stranica } from '../../komponente/osnovno'
import { MAX_TEKST_UNOSA, PARTNER_PROCENAT } from '../../logika/konstante'
import { deoPartnera } from '../../logika/novac'
import { TIPOVI } from '../../podaci/lokacije'
import { formatVreme, istekao } from '../../logika/vreme'
import { MILA } from '../../podaci/akteri'
import { useStanje } from '../../stanje/StanjeProvider'

/** Izmišljen primer obračuna (B4): naknada 90 € → partner dobija 20% = 18 €. */
const PRIMER_NAKNADA_CENTI = 9000

export default function Tabla() {
  const { stanje, probaj, salji, vodjeno } = useStanje()
  const [naziv, setNaziv] = useState('')
  const [tip, setTip] = useState<string>(TIPOVI[0])
  const [opstina, setOpstina] = useState('')
  const [vlasnik, setVlasnik] = useState('')
  const [saglasan, setSaglasan] = useState(false)
  const [poslato, setPoslato] = useState<string | null>(null)
  const moje = stanje.prijaveLokacija.filter((p) => p.izvor === 'partner')
  const nedostaje = !naziv.trim() ? 'Upišite naziv lokacije.' : !opstina.trim() ? 'Upišite opštinu.' : !saglasan ? 'Potvrdite da je vlasnik saglasan.' : null
  const navigate = useNavigate()
  const moji = stanje.izbori.filter((i) => i.akterId === MILA)

  const noviIzbor = () => {
    const id = probaj({ tip: 'NOVI_IZBOR' })?.izbori.at(-1)?.id
    if (id) navigate(`/izbor/${id}/deljenje`)
  }

  return (
    <Stranica>
      <Naslov podnaslov="Location menadžer Mila K. (izmišljeno). Tačne adrese ne vidite ni vi: vidi ih samo produkcija posle potvrđene uplate naknade." desno={<Dugme vanPrice ikona={Plus} onClick={noviIzbor}>Novi izbor</Dugme>}>
        Moji izbori
      </Naslov>

      {moji.length === 0 ? (
        <PraznoStanje ikona={Layers} naslov="Još nemate izbora" tekst="Napravite izbor za klijenta: izaberete lokacije, podelite link i pratite glasove.">
          <Dugme vanPrice onClick={noviIzbor}>Novi izbor</Dugme>
        </PraznoStanje>
      ) : (
        <div className="flex flex-col gap-3">
          {moji.map((i) => {
            const glasovi = stanje.glasovi.filter((g) => g.izborId === i.id)
            const rok = i.linkOd + i.trajanje
            return (
              <Kartica key={i.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div>
                  <b>{i.naziv}</b>
                  <p className="text-sm text-sek">Klijent: {i.zaKoga || '— (nije upisano)'} · lokacija: {i.lokacijaIds.length} · glasova: {glasovi.length}</p>
                  <p className="text-sm text-sek">Link ističe: {formatVreme(rok)} (simulirano)</p>
                </div>
                <div className="flex items-center gap-3">
                  {istekao(rok, stanje.sati) ? <Oznaka vrsta="istekla">Link je istekao</Oznaka> : <Oznaka vrsta="aktivna">Link aktivan</Oznaka>}
                  <DugmeLink to={`/izbor/${i.id}/deljenje`} varijanta="sekundarno">Otvori</DugmeLink>
                </div>
              </Kartica>
            )
          })}
        </div>
      )}

      <section className="mt-10">
        <Natpis>Preporuke</Natpis>
        <Kartica className="p-5 text-sm">
          <p><b>Pravilo:</b> dobijate {PARTNER_PROCENAT}% naknade Nasetua, samo od plaćenih rezervacija — kad donesete klijenta ili kad se rezerviše lokacija koju ste upisali uz saglasnost vlasnika.</p>
          <p className="mt-1 text-sek">U prvoj verziji se provizije vode ručno (tabla provizija stiže u Fazi 2).</p>
          <p className="cifre mt-3 rounded-dugme bg-traka p-3">
            Primer obračuna (izmišljeno): naknada <Iznos centi={PRIMER_NAKNADA_CENTI} uRedu /> → vaš deo {PARTNER_PROCENAT}%: <b><Iznos centi={deoPartnera(PRIMER_NAKNADA_CENTI)} uRedu /></b>
          </p>
        </Kartica>

        <h3 className="mb-2 mt-6 font-semibold">Preporuči lokaciju</h3>
        <Kartica className="p-5">
          <div className="mb-4"><NapomenaNeSalje /></div>
          <form className="flex flex-col gap-4" noValidate onSubmit={(e) => {
            e.preventDefault()
            if (nedostaje || vodjeno) return
            salji({ tip: 'POSALJI_PREPORUKU', preporuka: { naziv, tip, opstina, vlasnikNaziv: vlasnik, saglasnostVlasnika: saglasan } })
            setPoslato(naziv.trim()); setNaziv(''); setOpstina(''); setVlasnik(''); setSaglasan(false)
          }}>
            <fieldset disabled={vodjeno} className="contents">
            <div className="grid gap-4 sm:grid-cols-2">
              <Polje naziv="Naziv lokacije" obavezno htmlFor="p-naziv"><input id="p-naziv" autoComplete="off" maxLength={MAX_TEKST_UNOSA} className={KLASA_POLJA} value={naziv} onChange={(e) => setNaziv(e.target.value)} /></Polje>
              <Polje naziv="Tip prostora" htmlFor="p-tip"><select id="p-tip" className={KLASA_POLJA} value={tip} onChange={(e) => setTip(e.target.value)}>{TIPOVI.map((x) => <option key={x}>{x}</option>)}</select></Polje>
              <Polje naziv="Opština" obavezno htmlFor="p-opstina"><input id="p-opstina" autoComplete="off" maxLength={MAX_TEKST_UNOSA} className={KLASA_POLJA} value={opstina} onChange={(e) => setOpstina(e.target.value)} /></Polje>
              <Polje naziv="Vlasnik (izmišljen naziv)" htmlFor="p-vlasnik"><input id="p-vlasnik" autoComplete="off" maxLength={MAX_TEKST_UNOSA} className={KLASA_POLJA} value={vlasnik} onChange={(e) => setVlasnik(e.target.value)} /></Polje>
            </div>
            <label className="flex min-h-11 cursor-pointer items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-[#C8401E]" checked={saglasan} onChange={(e) => setSaglasan(e.target.checked)} />
              <span><b>Vlasnik je saglasan</b><br /><span className="text-sm text-sek">Obavezno: lokaciju upisujete uz saglasnost vlasnika. Adresu ne unosite — ne čuva se.</span></span>
            </label>
            </fieldset>
            <div><Dugme vanPrice type="submit" ikona={Send} disabled={!!nedostaje} zasto={nedostaje}>Pošalji preporuku adminu</Dugme></div>
          </form>
          {poslato && <p className="mt-4 rounded-dugme bg-[#F0FDF4] p-3 font-semibold text-uspeh" role="status">Preporuka „{poslato}“ stigla je adminu u „Lokacije na čekanju“.</p>}
          {moje.length > 0 && (
            <ul className="mt-4 flex flex-col gap-1 text-sm">
              {moje.map((p) => <li key={p.id}><b>{p.naziv}</b> — {p.stanje === 'ceka' ? 'čeka admina' : p.stanje === 'objavljena' ? 'objavljena' : 'odbijena'}</li>)}
            </ul>
          )}
        </Kartica>
      </section>
    </Stranica>
  )
}
