// V1 (+ V3) — Kontrolna tabla vlasnika: zahtevi, opcije na mojim lokacijama, moje lokacije, novac (bruto/neto).
import { CalendarDays, Inbox } from 'lucide-react'
import { useState } from 'react'
import { Iznos } from '../../komponente/Iznos'
import { Kalendar } from '../../komponente/Kalendar'
import { OznakaFaze, OznakaOpcije } from '../../komponente/Faze'
import { Odbrojavanje } from '../../komponente/Odbrojavanje'
import { Dugme, Kartica, DugmeLink, Naslov, Natpis, Oznaka, Prekidac, Stranica } from '../../komponente/osnovno'
import { SATI_ZAHTEV_VLASNIKA } from '../../logika/konstante'
import { mozeLiBlokirati } from '../../logika/kalendar'
import { RAZLOG_AUTO_ODBIJANJA } from '../../logika/red'
import { KURS_RSD } from '../../logika/konstante'
import { brutoNeto, kursTekst, rsdPara, type TipVlasnika } from '../../logika/novac'
import { jeZiva, pozicija, stanjeOpcije } from '../../logika/opcije'
import { terminTekst } from '../../logika/prikaz'
import { fazaRezervacije, stanjeZahteva } from '../../logika/rezervacije'
import { formatVreme } from '../../logika/vreme'
import { ALFA, AKTERI, IVAN, nazivAktera, TIP_VLASNIKA } from '../../podaci/akteri'
import { LOKACIJE, nadjiLokaciju } from '../../podaci/lokacije'
import { akterTrenutni, predracunZa, zahteviKojiCekaju, zahteviVlasnika } from '../../stanje/izvedeno'
import type { Lokacija } from '../../podaci/lokacije'
import { useStanje } from '../../stanje/StanjeProvider'

/** Kartica jedne lokacije sa kalendarom u kome vlasnik blokira i odblokira dane (B7). */
function KarticaLokacijeVlasnika({ l }: { l: Lokacija }) {
  const { stanje, salji, vodjeno } = useStanje()
  const [poruka, setPoruka] = useState<string | null>(null)
  const blokirani = stanje.blokiraniDani[l.id] ?? []
  const klik = (dan: string) => {
    if (blokirani.includes(dan)) { salji({ tip: 'ODBLOKIRAJ_DAN', lokacijaId: l.id, dan }); setPoruka(null); return }
    const o = mozeLiBlokirati({ l, dan, blokirani: stanje.blokiraniDani, opcije: stanje.opcije, zahtevi: stanje.zahtevi, sada: stanje.sati })
    if (!o.moze) { setPoruka(o.razlog); return }
    salji({ tip: 'BLOKIRAJ_DAN', lokacijaId: l.id, dan })
    setPoruka(null)
  }
  return (
    <Kartica className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b>{l.naziv}</b><Oznaka vrsta="aktivna">Objavljeno</Oznaka>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-sek"><CalendarDays size={14} aria-hidden /> Zauzeto van Nasetua: {l.zauzeti.length} · blokirali ste: {blokirani.length}</p>
      <details className="mt-3">
        <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-akcent">Kalendar: blokiraj ili odblokiraj dane</summary>
        <div className="mt-2">
          <Kalendar zauzeti={l.zauzeti} blokirani={blokirani} onDan={vodjeno ? undefined : klik} />
          <p className="mt-2 text-sm text-sek" aria-live="polite">{vodjeno ? 'Blokiranje dana nije deo priče. Probajte u slobodnom režimu.' : poruka ?? 'Klik na slobodan dan ga blokira; klik na blokiran dan ga odblokira. Blokirani dani važe u svim proverama termina.'}</p>
        </div>
      </details>
    </Kartica>
  )
}

export default function Tabla() {
  const { stanje, salji, vodjeno } = useStanje()
  const ja = akterTrenutni(stanje)
  const tip: TipVlasnika = TIP_VLASNIKA[ja] ?? 'pravno'
  const mojeLokacije = LOKACIJE.filter((l) => l.vlasnikId === ja)
  const cekaju = zahteviKojiCekaju(stanje, ja)
  // zahtevi drugog vlasnika (drugi prikaz Pravno/Fizičko) ne smeju ostati neprimećeni
  const drugi = ja === ALFA ? IVAN : ALFA
  const uDrugomPrikazu = zahteviKojiCekaju(stanje, drugi).length
  const sviZahtevi = zahteviVlasnika(stanje, ja)
  const opcijeNaMojim = stanje.opcije.filter((o) => mojeLokacije.some((l) => l.id === o.lokacijaId) && (jeZiva(o, stanje.sati) || o.stanje === 'aktivna'))
  const osporene = opcijeNaMojim.filter((o) => stanjeOpcije(o, stanje.sati) === 'osporena')
  const izvidjanja = stanje.izvidjanja.filter((i) => mojeLokacije.some((l) => l.id === i.lokacijaId) && i.stanje === 'ceka')
  const mojePrijave = stanje.prijaveLokacija.filter((p) => p.vlasnikId === ja)
  // novac: zahtevi koji su na stolu ili odobreni (odbijeni i istekli se ne računaju)
  const zaNovac = sviZahtevi.filter((z) => ['ceka', 'odobren', 'otkazao-vlasnik'].includes(stanjeZahteva(z, stanje.sati)))
  // zahtevi koje je sistem sam odbio jer je termin potvrđen produkciji sa prvom opcijom (A2)
  const autoOdbijeni = sviZahtevi.filter((z) => z.stanje === 'odbijen' && z.razlog === RAZLOG_AUTO_ODBIJANJA)
  const predracuniFoto = stanje.predracuni.filter((p) => p.vrsta === 'fotografisanje' && p.kupacId === ja)

  return (
    <Stranica>
      <Naslov
        desno={vodjeno ? <Oznaka vrsta="neutralna">Prikaz: pravno lice (u vođenoj priči se ne menja)</Oznaka> : (
          <Prekidac<TipVlasnika> oznaka="Prikaz vlasnika" izabrano={stanje.prikazVlasnika} onChange={(p) => salji({ tip: 'PROMENI_PRIKAZ_VLASNIKA', prikaz: p })}
            vrednosti={[{ id: 'pravno', naziv: 'Pravno lice' }, { id: 'fizicko', naziv: 'Fizičko lice' }]} />
        )}
        podnaslov={AKTERI[ja]?.opis}
      >
        {nazivAktera(ja)}
      </Naslov>

      {uDrugomPrikazu > 0 && (
        <Kartica className="mb-6 flex flex-wrap items-center justify-between gap-3 border-l-4 !border-l-uloga-vlasnik p-4">
          <span>Zahteva koji čekaju u prikazu „{TIP_VLASNIKA[drugi] === 'fizicko' ? 'Fizičko lice' : 'Pravno lice'}“: <b>{uDrugomPrikazu}</b></span>
          <Dugme vanPrice varijanta="sekundarno" onClick={() => salji({ tip: 'PROMENI_PRIKAZ_VLASNIKA', prikaz: TIP_VLASNIKA[drugi] })}>Prebaci prikaz</Dugme>
        </Kartica>
      )}

      <section className="mb-10">
        <Natpis>Zahtevi koji čekaju odgovor</Natpis>
        {cekaju.length === 0 ? (
          <Kartica className="flex items-center gap-3 p-5 text-sek"><Inbox size={20} aria-hidden /> Nema zahteva koji čekaju.</Kartica>
        ) : (
          <div className="flex flex-col gap-3">
            {cekaju.map((z) => (
              <Kartica key={z.id} className="flex flex-col gap-4 border-l-4 !border-l-uloga-vlasnik p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
                  <div>
                  <b>{nadjiLokaciju(z.lokacijaId)?.naziv}</b> — {nazivAktera(z.produkcijaId)}
                  <p className="text-sm text-sek">Termin: {terminTekst(z.termin)}</p>
                  </div>
                  <div className="sm:w-52"><Odbrojavanje rok={z.rok} sada={stanje.sati} ukupno={SATI_ZAHTEV_VLASNIKA} prefiks="Preostalo" /></div>
                </div>
                <DugmeLink to={`/vlasnik/zahtev/${z.id}`} className="self-start sm:self-center">Otvori</DugmeLink>
              </Kartica>
            ))}
          </div>
        )}
      </section>

      {autoOdbijeni.length > 0 && (
        <section className="mb-10">
          <Natpis>Automatski odbijeni zahtevi</Natpis>
          {autoOdbijeni.map((z) => (
            <Kartica key={z.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 p-4">
              <span><b>{nadjiLokaciju(z.lokacijaId)?.naziv}</b> — {nazivAktera(z.produkcijaId)}<span className="block text-sm text-sek">Odbijeno: {z.razlog}</span></span>
              <DugmeLink to={`/vlasnik/zahtev/${z.id}`} varijanta="sekundarno">Otvori</DugmeLink>
            </Kartica>
          ))}
        </section>
      )}

      {osporene.length > 0 && (
        <section className="mb-10">
          <Natpis>Osporena opcija</Natpis>
          {osporene.map((o) => (
            <Kartica key={o.id} className="mb-3 border-l-4 !border-l-opasno p-4">
              <p>
                Opcija na lokaciji <b>{nadjiLokaciju(o.lokacijaId)?.naziv}</b> je osporena — druga produkcija traži isti termin.
                Prva produkcija ima 24 h da potvrdi ili odustane.
              </p>
              <p className="mt-1 text-sm text-sek">Samo informativno: ne morate ništa da radite.</p>
            </Kartica>
          ))}
        </section>
      )}

      <section className="mb-10">
        <Natpis>Opcije na mojim lokacijama</Natpis>
        {opcijeNaMojim.length === 0 ? <p className="text-sek">Nema opcija.</p> : (
          <ul className="flex flex-col gap-2">
            {opcijeNaMojim.map((o) => (
              <li key={o.id}>
                <Kartica className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <span><b>{nadjiLokaciju(o.lokacijaId)?.naziv}</b> — drži {nazivAktera(o.produkcijaId)}, {terminTekst(o.termin)}</span>
                  <OznakaOpcije stanje={stanjeOpcije(o, stanje.sati)} pozicija={pozicija(stanje.opcije, o, stanje.sati)} />
                </Kartica>
              </li>
            ))}
          </ul>
        )}
      </section>

      {izvidjanja.length > 0 && (
        <section className="mb-10">
          <Natpis>Zahtevi za izviđanje</Natpis>
          {izvidjanja.map((i) => (
            <Kartica key={i.id} className="mb-3 flex flex-wrap items-center justify-between gap-3 p-4">
              <span><b>{nadjiLokaciju(i.lokacijaId)?.naziv}</b> — {formatVreme(i.kada)}, {i.osoba}</span>
              <DugmeLink to={`/vlasnik/izvidjanje/${i.id}`} varijanta="sekundarno">Otvori</DugmeLink>
            </Kartica>
          ))}
        </section>
      )}

      <section className="mb-10">
        <Natpis>Moji zahtevi i novac {tip === 'fizicko' ? '(fizičko lice)' : '(pravno lice)'}</Natpis>
        {zaNovac.length === 0 ? <p className="text-sek">Nema zahteva.</p> : (
          <div className="overflow-x-auto">
            <table className="tabela-kartice cifre w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">Zahtevi i novac</caption>
              <thead>
                <tr className="bg-traka text-left text-[13px] uppercase tracking-[0.06em] text-prig">
                  <th scope="col" className="p-3">Lokacija</th><th scope="col" className="p-3 text-right">Bruto (cena lokacije)</th>
                  <th scope="col" className="p-3 text-right">Naknada Nasetua (plaća produkcija)</th>
                  {tip === 'fizicko' && <th scope="col" className="p-3 text-right">Porez po odbitku*</th>}
                  <th scope="col" className="p-3 text-right">Neto (vama)</th><th scope="col" className="p-3">Status</th><td className="p-3"><span className="sr-only">Radnja</span></td>
                </tr>
              </thead>
              <tbody>
                {zaNovac.map((z) => {
                  const bn = brutoNeto(z.osnovicaCenti, tip)
                  const p = predracunZa(stanje, z.id)
                  return (
                    <tr key={z.id} className="h-14 border-b border-linija">
                      <td data-label="Lokacija" className="p-3">{nadjiLokaciju(z.lokacijaId)?.naziv}</td>
                      <td data-label="Bruto" className="p-3 text-right"><Iznos centi={bn.brutoCenti} kurs={z.kurs} /></td>
                      <td data-label="Naknada Nasetua (plaća produkcija)" className="p-3 text-right text-mastilo">{p ? <>
                        <Iznos centi={p.naknadaCenti} kurs={p.kurs} />
                        {p.ukupnoCenti !== p.naknadaCenti && <span className="block text-[13px] text-sek">za uplatu: {rsdPara(p.ukupnoPara)} (uz umanjenje/usluge)</span>}
                      </> : '—'}</td>
                      {tip === 'fizicko' && <td data-label="Porez po odbitku*" className="p-3 text-right">−<Iznos centi={bn.porezCenti} kurs={z.kurs} /></td>}
                      <td data-label="Neto (vama)" className="p-3 text-right font-bold"><Iznos centi={bn.netoCenti} kurs={z.kurs} /></td>
                      <td data-label="Status" className="p-3"><OznakaFaze faza={fazaRezervacije(z, p, stanje.sati)} /></td>
                      <td className="p-3 text-right"><DugmeLink to={`/vlasnik/zahtev/${z.id}`} varijanta="sekundarno" className="whitespace-nowrap">Otvori</DugmeLink></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-2 text-[13px] text-prig">Dinari su glavni iznos (izmišljen kurs {kursTekst(KURS_RSD)}), evro je orijentacioni. Izmišljeno; nije poreski savet — poreska pravila proveriti sa knjigovođom.</p>
      </section>

      <section>
        <Natpis>Moje lokacije</Natpis>
        <div className="grid gap-3 sm:grid-cols-2">
          {mojeLokacije.map((l) => <KarticaLokacijeVlasnika key={l.id} l={l} />)}
          {mojePrijave.map((p) => {
            const foto = predracuniFoto.find((x) => x.prijavaId === p.id)
            return (
              <Kartica key={p.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <b>{p.naziv}</b>
                  {p.stanje === 'ceka' && <Oznaka vrsta="ceka-vlasnika">Čeka odobrenje admina</Oznaka>}
                  {p.stanje === 'objavljena' && <Oznaka vrsta="aktivna">Objavljeno u katalogu (izmišljeno)</Oznaka>}
                  {p.stanje === 'odbijena' && <Oznaka vrsta="odbijeno">Admin je odbio prijavu</Oznaka>}
                </div>
                <p className="mt-1 text-sm text-sek">{p.stanje === 'ceka' ? 'Ne pojavljuje se u katalogu dok admin ne odobri.' : p.stanje === 'objavljena' ? 'Vidi se u katalogu; u prototipu se ne rezerviše.' : 'Prijava nije prošla proveru.'}</p>
                {foto && <p className="mt-2"><DugmeLink to={`/vlasnik/predracun/${foto.id}`} varijanta="link">Predračun za fotografisanje</DugmeLink></p>}
              </Kartica>
            )
          })}
        </div>
        <p className="mt-4"><DugmeLink to="/vlasnik/nova-lokacija" varijanta="sekundarno">Dodaj lokaciju</DugmeLink></p>
        {ja !== ALFA && <p className="mt-3 text-[13px] text-prig">*Porez po odbitku za fizičko lice, orijentaciono.</p>}
      </section>
    </Stranica>
  )
}
