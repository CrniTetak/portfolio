// A2 — Predračun i potvrda uplate (Admin). Potvrda uplate naknade otvara adresu i kontakt produkciji.
// Radi za sve vrste predračuna: naknada za rezervaciju, izbor van kataloga i fotografisanje prostora.
import { Check } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { PredracunKartica } from '../../komponente/PredracunKartica'
import { Dugme, Kartica, KLASA_POLJA, NapomenaNeSalje, Naslov, Natpis, Polje, Stranica } from '../../komponente/osnovno'
import { MAX_BELESKA } from '../../logika/konstante'
import { rsdPara } from '../../logika/novac'
import { opisTermina } from '../../logika/prikaz'
import { mozeLiPotvrditiUplatu } from '../../logika/rezervacije'
import { formatVreme } from '../../logika/vreme'
import { nazivAktera } from '../../podaci/akteri'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { useIdiKao } from '../../stanje/hooks'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Predracun() {
  const { id = '' } = useParams()
  const { stanje, salji } = useStanje()
  const idiKao = useIdiKao()
  const [beleska, setBeleska] = useState('')
  const p = stanje.predracuni.find((x) => x.id === id)
  if (!p) return <Navigate to="/admin" replace />
  const z = p.zahtevId ? stanje.zahtevi.find((x) => x.id === p.zahtevId) : undefined
  const prijava = p.prijavaId ? stanje.prijaveLokacija.find((x) => x.id === p.prijavaId) : undefined
  const l = z ? nadjiLokaciju(z.lokacijaId) : undefined
  const odluka = mozeLiPotvrditiUplatu(z, p)
  const placeno = p.uplataPotvrdjena !== null
  const istorija = stanje.dnevnik.filter((d) => d.ref === p.id)
  const otkazano = z?.stanje === 'otkazao-vlasnik'
  const beleske = z ? stanje.beleske.filter((b) => b.zahtevId === z.id) : []
  const kupac = nazivAktera(p.kupacId)
  // odluka O10: samo vidljiva beleška o broju otkazivanja ovog vlasnika (bez funkcije isključenja)
  const otkazivanjaVlasnika = l ? stanje.zahtevi.filter((x) => x.stanje === 'otkazao-vlasnik' && nadjiLokaciju(x.lokacijaId)?.vlasnikId === l.vlasnikId).length : 0

  return (
    <Stranica uzak>
      <Naslov>{kupac}{l ? ` — ${l.naziv}` : prijava ? ` — ${prijava.naziv}` : ''}</Naslov>
      <PredracunKartica predracun={p} kupac={kupac} lokacija={l?.naziv ?? prijava?.naziv ?? ''} opisCene={z ? opisTermina(z.termin) : ''} />

      <div className="mx-auto mt-6 max-w-[720px]">
        {otkazano && z ? (
          <div className="rounded-dugme bg-[#FEF3C7] p-4 font-semibold text-prototip-tekst" role="status">
            <p>Rezervacija je otkazana (vlasnik); naknada se vraća (izmišljeno).</p>
            <div className="mt-3"><Dugme varijanta="sekundarno" onClick={() => idiKao('produkcija', `/produkcija/rezervacija/${z.id}`)}>Pogledaj otkazanu rezervaciju kao Produkcija</Dugme></div>
          </div>
        ) : placeno ? (
          <div className="rounded-dugme bg-[#F0FDF4] p-4 font-semibold text-uspeh" role="status">
            <p>{p.vrsta === 'naknada' ? 'Uplata potvrđena. Adresa i kontakt su otvoreni produkciji.' : 'Uplata potvrđena.'}</p>
            {p.vrsta === 'naknada' && z && (
              <div className="mt-3"><Dugme onClick={() => idiKao('produkcija', `/produkcija/rezervacija/${z.id}`)}>Pogledaj kao Produkcija → rezervacija</Dugme></div>
            )}
          </div>
        ) : (
          <Dugme ikona={Check} disabled={!odluka.moze} zasto={odluka.razlog} onClick={() => salji({ tip: 'POTVRDI_UPLATU', predracunId: p.id })}>
            Potvrdi uplatu {rsdPara(p.ukupnoPara)}
          </Dugme>
        )}

        {z?.stanje === 'otkazao-vlasnik' && (
          <Kartica className="mt-6 border-l-4 !border-l-opasno p-4" >
            <p className="font-semibold">Vlasnik je otkazao plaćenu rezervaciju.</p>
            <p className="cifre text-sm text-sek">Povraćaj naknade (izmišljeno): {p.povracaj ? rsdPara(p.povracaj.iznosPara) : '—'}. Beleška: otkazivanja ovog vlasnika: {otkazivanjaVlasnika} — po predlogu blueprinta ponovljeno otkazivanje vodi isključenju (bez funkcije isključenja u prototipu).</p>
          </Kartica>
        )}

        <Kartica className="mt-6 p-4">
          <Natpis>Istorija</Natpis>
          <ul className="space-y-1 text-sm">
            {istorija.length === 0 && <li className="text-sek">Još nema zapisa.</li>}
            {istorija.map((d, i) => <li key={i}><span className="cifre text-prig">{formatVreme(d.sati)}</span> — {d.tekst}</li>)}
          </ul>
        </Kartica>

        {z && (
          <Kartica className="mt-6 p-4">
            <Natpis>Beleške o sporovima (vidi samo admin)</Natpis>
            <ul className="mb-3 space-y-1 text-sm">
              {beleske.length === 0 && <li className="text-sek">Još nema beleški.</li>}
              {beleske.map((b) => <li key={b.id}><span className="cifre text-prig">{formatVreme(b.sati)}</span> — {b.tekst}</li>)}
            </ul>
            <div className="mb-3"><NapomenaNeSalje /></div>
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (beleska.trim()) { salji({ tip: 'DODAJ_BELESKU', zahtevId: z.id, tekst: beleska }); setBeleska('') } }}>
              <Polje naziv="Nova beleška" htmlFor="beleska" pomoc={`Najviše ${MAX_BELESKA} znakova. Čuva se samo u ovom prozoru (prototip).`}>
                <textarea id="beleska" rows={2} maxLength={MAX_BELESKA} autoComplete="off" className={`${KLASA_POLJA} h-auto py-2`} value={beleska} onChange={(e) => setBeleska(e.target.value)} />
              </Polje>
              <div><Dugme type="submit" varijanta="sekundarno" disabled={!beleska.trim()} zasto={!beleska.trim() ? 'Upišite belešku.' : null}>Dodaj belešku</Dugme></div>
            </form>
          </Kartica>
        )}
        <p className="mt-6"><Link to="/admin" className="font-semibold text-akcent hover:underline">← Nazad na pregled</Link></p>
      </div>
    </Stranica>
  )
}
