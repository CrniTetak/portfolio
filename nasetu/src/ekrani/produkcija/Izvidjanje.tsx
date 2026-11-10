// P8 — Izviđanje (Produkcija): zahtev i status. Adresa se otvara SAMO imenovanoj osobi, 24 h pre potvrđenog izviđanja.
import { Send } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { ZakljucanaAdresa } from '../../komponente/ZakljucanaAdresa'
import { Dugme, fokusirajGresku, Kartica, KLASA_POLJA, NapomenaNeSalje, Naslov, Natpis, Oznaka, Polje, Stranica } from '../../komponente/osnovno'
import { danasIso, dodajDane, formatVreme, satiZaDan } from '../../logika/vreme'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { adresaZaImenovanu, adresaZaUlogu } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'


export default function Izvidjanje() {
  const { id: lokacijaId = '' } = useParams()
  const { stanje, salji, vodjeno } = useStanje()
  const l = nadjiLokaciju(lokacijaId)
  // Ponuđeni termini su UVEK posle simuliranog „sada" (za 2, 3 i 5 dana, u 10:00)
  const danasnji = danasIso(stanje.sati)
  const daniIzvidjanja = [2, 3, 5].map((k) => dodajDane(danasnji, k)).filter((d) => satiZaDan(d, 10) > stanje.sati)
  const [dan, setDan] = useState('')
  const izabraniDan = daniIzvidjanja.includes(dan) ? dan : daniIzvidjanja[0]
  const [osoba, setOsoba] = useState('Ana P.')
  const [broj, setBroj] = useState('2')
  const [pokusao, setPokusao] = useState(false)
  if (!l) return <Navigate to="/produkcija" replace />

  const moja = stanje.izvidjanja.filter((i) => i.lokacijaId === l.id && i.produkcijaId === 'delta')
  const greskaOsoba = !osoba.trim() ? 'Unesite ime i prezime osobe koja ide' : null
  const greskaBroj = !(Number(broj) >= 1) ? 'Unesite broj ljudi' : null

  const posalji = () => {
    if (vodjeno) return
    setPokusao(true)
    if (greskaOsoba || greskaBroj) { fokusirajGresku(); return }
    if (!izabraniDan) return
    salji({ tip: 'ZATRAZI_IZVIDJANJE', lokacijaId: l.id, kada: satiZaDan(izabraniDan, 10), osoba, brojLjudi: Math.floor(Number(broj)) })
  }

  return (
    <Stranica uzak>
      <Naslov podnaslov="Adresu dan ranije dobija samo osoba koju imenujete. Ostali članovi ekipe vide samo opštinu i zonu.">Izviđanje — {l.naziv}</Naslov>
      <div className="mb-4"><NapomenaNeSalje /></div>
      <Kartica className="mb-8 flex flex-col gap-4 p-5 md:p-6">
        <fieldset disabled={vodjeno} className="contents">
        <Polje naziv="Željeni termin (u 10:00)" htmlFor="dan">
          <select id="dan" className={KLASA_POLJA} value={izabraniDan} onChange={(e) => setDan(e.target.value)}>
            {daniIzvidjanja.map((d) => <option key={d} value={d}>{formatVreme(satiZaDan(d, 10))}</option>)}
          </select>
        </Polje>
        <Polje naziv="Ime i prezime osobe koja ide" obavezno htmlFor="osoba" greska={pokusao ? greskaOsoba : null} pomoc="Samo ta osoba dobija adresu.">
          <input id="osoba" autoComplete="off" className={KLASA_POLJA} value={osoba} onChange={(e) => setOsoba(e.target.value)} />
        </Polje>
        <Polje naziv="Broj ljudi" htmlFor="broj" greska={pokusao ? greskaBroj : null}>
          <input id="broj" type="number" min={1} max={10} inputMode="numeric" className={`${KLASA_POLJA} max-w-40`} value={broj} onChange={(e) => setBroj(e.target.value)} />
        </Polje>
        </fieldset>
        <div><Dugme vanPrice ikona={Send} onClick={posalji}>Pošalji zahtev za izviđanje</Dugme></div>
      </Kartica>

      <Natpis>Moji zahtevi za izviđanje</Natpis>
      {moja.length === 0 && <p className="text-sek">Još nema zahteva za izviđanje na ovoj lokaciji.</p>}
      <div className="flex flex-col gap-4">
        {moja.map((i) => (
          <Kartica key={i.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <b>{formatVreme(i.kada)}</b>
              {i.stanje === 'ceka' && <Oznaka vrsta="ceka-vlasnika">Čeka vlasnika</Oznaka>}
              {i.stanje === 'potvrdjeno' && <Oznaka vrsta="aktivna">Potvrđeno</Oznaka>}
              {i.stanje === 'odbijeno' && <Oznaka vrsta="odbijeno">Odbijeno</Oznaka>}
            </div>
            <p className="mt-1 text-sm text-sek">Osoba: {i.osoba} · ljudi: {i.brojLjudi}</p>
            {i.stanje === 'potvrdjeno' && (
              <div className="mt-4">
                <Natpis>Poruka za: {i.osoba} — izviđanje {formatVreme(i.kada)}</Natpis>
                <ZakljucanaAdresa prikaz={adresaZaImenovanu(stanje, l.id, i.osoba)} />
                <p className="mt-2 text-sm text-sek">Kontakt na izviđanju je Nasetu, ne vlasnik. Ostali članovi ekipe i dalje vide samo: {adresaZaUlogu(stanje, l.id).zona}.</p>
              </div>
            )}
            {i.stanje === 'ceka' && <p className="mt-2 text-sm text-sek">Adresa stiže dan ranije samo imenovanoj osobi, kad vlasnik potvrdi.</p>}
          </Kartica>
        ))}
      </div>
      <p className="mt-6"><Link to={`/lokacije/${l.id}`} className="font-semibold text-akcent hover:underline">← Nazad na lokaciju</Link></p>
    </Stranica>
  )
}
