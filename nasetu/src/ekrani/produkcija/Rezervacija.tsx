// P5 (status) i P7 — Rezervacija: čeka vlasnika → odobreno/odbijeno/isteklo → predračun → adresa posle uplate;
// ili: vlasnik otkazao → naknada se vraća (izmišljeno) i nudi se zamenska lokacija.
import { FileText } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { NedostajeObjekat } from '../../komponente/KorakNijePoceo'
import { Iznos } from '../../komponente/Iznos'
import { ObracunVlasniku } from '../../komponente/ObracunVlasniku'
import { OznakaFaze } from '../../komponente/Faze'
import { Odbrojavanje } from '../../komponente/Odbrojavanje'
import { ZakljucanaAdresa } from '../../komponente/ZakljucanaAdresa'
import { Dugme, DugmeLink, Kartica, Naslov, Natpis, Stranica } from '../../komponente/osnovno'
import { SATI_ZAHTEV_VLASNIKA } from '../../logika/konstante'
import { eur, rsdPara } from '../../logika/novac'
import { opisTermina, terminTekst } from '../../logika/prikaz'
import { fazaRezervacije, mozeLiOdobriti } from '../../logika/rezervacije'
import { RAZLOG_AUTO_ODBIJANJA } from '../../logika/red'
import { zamenskeLokacije } from '../../logika/zamena'
import { formatVreme } from '../../logika/vreme'
import { TIP_VLASNIKA } from '../../podaci/akteri'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { adresaZaUlogu, izborDelte, predracunZa, sveLokacije, zauzetiDani } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Rezervacija() {
  const { id = '' } = useParams()
  const { stanje, probaj } = useStanje()
  const [greska, setGreska] = useState<string | null>(null)
  const navigate = useNavigate()
  const z = stanje.zahtevi.find((x) => x.id === id && x.produkcijaId === 'delta')
  if (!z) return <NedostajeObjekat korak={6} ka="/produkcija" />
  const l = nadjiLokaciju(z.lokacijaId)
  if (!l) return <NedostajeObjekat korak={6} ka="/produkcija" />

  const p = predracunZa(stanje, z.id)
  const faza = fazaRezervacije(z, p, stanje.sati)
  const izbor = izborDelte(stanje)
  const adresa = adresaZaUlogu(stanje, l.id)
  // zahtev čeka, ali je termin u međuvremenu potvrđen drugome
  const terminZauzet = faza === 'ceka-vlasnika' && !mozeLiOdobriti(z, stanje.zahtevi, zauzetiDani(stanje, l), stanje.sati, stanje.opcije).moze
  const brief = stanje.briefovi.find((b) => b.id === z.briefId)
  const zamene = faza === 'otkazao-vlasnik'
    ? zamenskeLokacije({
        katalog: sveLokacije(stanje), zahtev: z, tipoviBriefa: brief?.tipovi ?? [], sviZahtevi: stanje.zahtevi,
        opcije: stanje.opcije, zauzetiDani: (x) => zauzetiDani(stanje, x), sada: stanje.sati,
      })
    : []
  const ref = `rezervacija=${z.id}`

  return (
    <Stranica uzak>
      <Naslov desno={<OznakaFaze faza={faza} velika />}>Rezervacija — {l.naziv}</Naslov>

      <Kartica className="mb-6 p-5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-sek">Termin</dt><dd className="font-medium">{terminTekst(z.termin)} ({opisTermina(z.termin)})</dd>
          <dt className="text-sek">Cena lokacije</dt>
          <dd className="font-medium"><Iznos centi={z.osnovicaCenti} kurs={z.kurs} className="font-bold" /> <span className="block text-sek">plaća se direktno vlasniku, u dinarima</span></dd>
          {z.domacin && <><dt className="text-sek">Domaćin</dt><dd className="font-medium">Domaćin lokacije na snimanju (poseban red na predračunu)</dd></>}
        </dl>
        <div className="mt-4 border-t border-linija pt-4">
          <ObracunVlasniku osnovicaCenti={z.osnovicaCenti} tip={TIP_VLASNIKA[l.vlasnikId] ?? 'pravno'} kurs={z.kurs} />
        </div>
      </Kartica>

      {faza === 'ceka-vlasnika' && (
        <Kartica className="mb-6 p-5">
          <p className="mb-2 font-semibold">Čeka vlasnika — odgovor do {formatVreme(z.rok)}</p>
          <Odbrojavanje rok={z.rok} sada={stanje.sati} ukupno={SATI_ZAHTEV_VLASNIKA} prefiks="Preostalo" />
          {terminZauzet && <p className="mt-3 font-semibold text-opasno" role="alert">Vlasnik trenutno ne može da odobri ovaj zahtev: termin je zauzet ili prednost ima prva opcija druge produkcije.</p>}
          <p className="mt-3 text-sm text-sek">Kad vlasnik odobri, dobijate predračun naknade.</p>
        </Kartica>
      )}

      {faza === 'istekao' && (
        <Kartica className="mb-6 p-5">
          {greska && <p className="mb-2 font-semibold text-opasno" role="alert">{greska}</p>}
          <p className="font-semibold">Istekao je — vlasnik nije odgovorio u {SATI_ZAHTEV_VLASNIKA} h.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Dugme vanPrice onClick={() => {
              const novo = probaj({ tip: 'POSALJI_ZAHTEV', lokacijaId: l.id, termin: z.termin, razred: z.razred, prekovremeniSati: z.prekovremeniSati, domacin: z.domacin })
              const nz = novo?.zahtevi.at(-1)
              if (!novo || !nz) { setGreska('Zahtev nije poslat: termin je zauzet, lokacija ne prima tu ekipu ili je zahtev već poslat.'); return }
              navigate(`/produkcija/rezervacija/${nz.id}`)
            }}>Pošalji ponovo</Dugme>
            <DugmeLink to={izbor ? `/izbor/${izbor.id}` : '/lokacije'} varijanta="sekundarno">Vrati se na izbor</DugmeLink>
          </div>
        </Kartica>
      )}

      {faza === 'odbijen' && (
        <Kartica className="mb-6 p-5">
          <p className="font-semibold">{z.razlog === RAZLOG_AUTO_ODBIJANJA ? `Zahtev je automatski odbijen (razlog: ${RAZLOG_AUTO_ODBIJANJA}).` : `Vlasnik je odbio zahtev${z.razlog ? ` (razlog: ${z.razlog.toLowerCase()})` : ''}.`}</p>
          <div className="mt-3"><DugmeLink to={izbor ? `/izbor/${izbor.id}` : '/lokacije'} varijanta="sekundarno">Pogledaj druge lokacije iz izbora</DugmeLink></div>
        </Kartica>
      )}

      {faza === 'ceka-uplatu' && p && (
        <Kartica className="mb-6 p-5">
          <p className="font-semibold">Vlasnik je odobrio. Sledeći korak je uplata naknade Nasetua.</p>
          <p className="mt-1 text-sm text-sek">Naknada: <b className="cifre text-mastilo">{rsdPara(p.ukupnoPara)}</b></p>
          <div className="mt-3"><DugmeLink to={`/produkcija/predracun/${p.id}`}>Otvori predračun</DugmeLink></div>
        </Kartica>
      )}

      {faza === 'otkazao-vlasnik' && (
        <Kartica className="mb-6 border-l-4 !border-l-opasno p-5" >
          <p className="font-semibold" role="status">Vlasnik je otkazao rezervaciju.</p>
          <p className="cifre mt-1">Naknada se vraća (izmišljeno): <b className="text-mastilo">{p?.povracaj ? rsdPara(p.povracaj.iznosPara) : '—'}</b></p>
          <p className="mt-1 text-sm text-sek">Termin je ponovo slobodan, a adresa vlasnika više nije dostupna.</p>
          {p && p.umanjenjeCenti > 0 && <p className="mt-1 text-sm font-semibold">Umanjenje od {eur(p.umanjenjeCenti)} važi i za zamensku rezervaciju.</p>}
          <h3 className="mt-4 font-semibold">Predlog zamenske lokacije</h3>
          {zamene.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-2">
              {zamene.map((x) => (
                <li key={x.id}><Link to={`/lokacije/${x.id}`} className="flex min-h-11 items-center gap-2 rounded-kartica border border-linija bg-white p-3 font-semibold text-akcent hover:underline">{x.naziv} <span className="font-normal text-sek">— {x.tip}, {x.opstina}; slobodna u terminu</span></Link></li>
              ))}
            </ul>
          ) : <p className="mt-2 text-sek">Nema slobodne zamenske lokacije u terminu. Nasetu šalje novi izbor u 24–48 h.</p>}
        </Kartica>
      )}

      {(faza === 'ceka-uplatu' || faza === 'placeno' || faza === 'otkazao-vlasnik') && (
        <section className="mb-6">
          <Natpis>Adresa i kontakt</Natpis>
          {/* animacija otključavanja samo kad je naknada plaćena */}
          <ZakljucanaAdresa prikaz={adresa} animiraj={faza === 'placeno'} dokumenti={faza === 'placeno'} zastitniPeriod={faza === 'placeno'} />
        </section>
      )}

      {faza === 'placeno' && (
        <section>
          <Natpis>Dokumenti</Natpis>
          <ul className="flex flex-col gap-2">
            <li><Link to={`/primeri?dokument=ugovor&${ref}`} className="flex min-h-11 items-center gap-2 rounded-kartica border border-linija bg-white p-3 font-semibold text-akcent hover:underline"><FileText size={18} aria-hidden /> Ugovor o lokaciji (primer)</Link></li>
            <li><Link to={`/primeri?dokument=brief&${ref}`} className="flex min-h-11 items-center gap-2 rounded-kartica border border-linija bg-white p-3 font-semibold text-akcent hover:underline"><FileText size={18} aria-hidden /> Location Brief (primer)</Link></li>
            <li><Link to={`/primeri?dokument=zapisnik&${ref}`} className="flex min-h-11 items-center gap-2 rounded-kartica border border-linija bg-white p-3 font-semibold text-akcent hover:underline"><FileText size={18} aria-hidden /> Obrazac zapisnika na ulazu i izlazu (primer)</Link></li>
          </ul>
          <p className="mt-4"><DugmeLink to={`/produkcija/izvidjanje/${l.id}`} varijanta="link">Zatraži izviđanje</DugmeLink></p>
        </section>
      )}
    </Stranica>
  )
}
