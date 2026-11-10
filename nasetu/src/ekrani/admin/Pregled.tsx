// A1 + A3 — Admin pregled: pokazatelji, zahtevi (sa izvorom), nalozi na čekanju, lokacije na čekanju, uplate, izvoz za knjigovođu.
// "Pošalji izbor" proizvodi ekran P2.
import { Check, Download, Inbox, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Kartica, Dugme, DugmeLink, Naslov, Natpis, Oznaka, PraznoStanje, Stranica } from '../../komponente/osnovno'
import { Iznos } from '../../komponente/Iznos'
import { OznakaFaze } from '../../komponente/Faze'
import { CENA_IZBORA_VAN_KATALOGA_CENTI, KURS_RSD, VERZIJA_DOKUMENATA } from '../../logika/konstante'
import { izvoz } from './izvoz'
import { mozeLiObjaviti, kontrolnaLista } from '../../logika/objava'
import { centiIzPara, eurKratko, eurOrijentaciono, rsdPara, uPare } from '../../logika/novac'
import { jeZiva } from '../../logika/opcije'
import { fazaRezervacije } from '../../logika/rezervacije'
import { formatVreme } from '../../logika/vreme'
import { DELTA, nazivAktera, pibMbTekst } from '../../podaci/akteri'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { predracunZa } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'
import type { Nalog } from '../../stanje/tipovi'

/** Izmišljena osnova za "uplaćena naknada ovog meseca" (da broj ne bude 0 na početku). */
const IZMISLJENO_MESECNO_CENTI = 124000

const VRSTA_NALOGA: Record<Nalog['vrsta'], string> = { firma: 'Firma', preduzetnik: 'Preduzetnik', 'fizicko-vlasnik': 'Vlasnik, fizičko lice' }
const VRSTA_PREDRACUNA = { naknada: 'naknada za rezervaciju', 'izbor-van-kataloga': 'izbor van kataloga', fotografisanje: 'fotografisanje prostora' } as const

export default function Pregled() {
  const { stanje, salji } = useStanje()
  const [objavljena, setObjavljena] = useState<{ naziv: string; id: string } | null>(null)
  const noviZahtevi = stanje.briefovi.filter((b) => !b.izborId).length
  const izboriUPripremi = stanje.izbori.filter((i) => i.poslatProdukciji === null && i.uloga === 'produkcija').length
  const aktivneOpcije = stanje.opcije.filter((o) => jeZiva(o, stanje.sati)).length
  const cekajuUplatu = stanje.zahtevi.filter((z) => {
    const p = predracunZa(stanje, z.id)
    return fazaRezervacije(z, p, stanje.sati) === 'ceka-uplatu'
  }).length
  // uplaćeno UKUPNO: u PARAMA (dinari); u zbir ulaze naknade i plaćene usluge, umanjeno za povraćaje; nema filtera po mesecu
  const uplacenoPare = uPare(IZMISLJENO_MESECNO_CENTI, KURS_RSD)
    + stanje.predracuni.filter((p) => p.uplataPotvrdjena !== null).reduce((s, p) => s + p.ukupnoPara, 0)
    - stanje.predracuni.reduce((s, p) => s + (p.povracaj?.iznosPara ?? 0), 0)

  const sigmaCeka = stanje.briefovi.some((b) => !b.izborId && b.produkcijaId !== DELTA)
  const pokazatelji: [string, string, string?][] = [
    ['Novi zahtevi' + (sigmaCeka ? ' (uklj. izmišljenu Produkciju Sigma)' : ''), String(noviZahtevi)], ['Izbori u pripremi', String(izboriUPripremi)], ['Aktivne opcije', String(aktivneOpcije)],
    ['Čekaju uplatu', String(cekajuUplatu)],
    ['Uplaćeno ukupno (izmišljeno)', rsdPara(uplacenoPare), eurOrijentaciono(centiIzPara(uplacenoPare, KURS_RSD))],
  ]
  const predracuni = stanje.predracuni
  const briefoviRed = [...stanje.briefovi].reverse().sort((a, b) => Number(b.produkcijaId === DELTA) - Number(a.produkcijaId === DELTA))
  const nalozi = stanje.nalozi
  const prijave = stanje.prijaveLokacija

  return (
    <Stranica>
      <Naslov podnaslov="Nasetu tim">Admin pregled</Naslov>

      <section className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {pokazatelji.map(([naziv, v, pod]) => (
          <Kartica key={naziv} className="p-4">
            <p className="cifre font-extrabold text-[28px] leading-none max-[420px]:text-[26px]">{v}</p>
            {pod && <p className="cifre mt-1 text-[13px] text-sek">{pod}</p>}
            <p className="mt-2 text-sm text-sek">{naziv}</p>
          </Kartica>
        ))}
      </section>

      <section className="mb-10">
        <Natpis>Zahtevi</Natpis>
        {stanje.briefovi.length === 0 ? (
          <PraznoStanje ikona={Inbox} naslov="Nema zahteva" tekst="Kad produkcija pošalje zahtev, pojavljuje se ovde." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tabela-kartice w-full min-w-[720px] border-collapse text-sm">
              <caption className="sr-only">Zahtevi produkcija</caption>
              <thead>
                <tr className="bg-traka text-left text-[13px] uppercase tracking-[0.06em] text-prig">
                  <th scope="col" className="p-3">Projekat</th><th scope="col" className="p-3">Produkcija</th><th scope="col" className="p-3">Izvor zahteva</th><th scope="col" className="p-3">Status</th><td className="p-3"><span className="sr-only">Radnja</span></td>
                </tr>
              </thead>
              <tbody>
                {briefoviRed.map((b) => (
                  <tr key={b.id} className={`h-14 border-b border-linija hover:bg-traka ${b.produkcijaId === DELTA ? 'bg-akcent-s/60' : ''}`}>
                    <td data-label="Projekat" className="p-3">
                      <b>{b.vrsta}, {b.grad}</b><div className="text-[13px] text-prig">poslato {formatVreme(b.poslat)}</div>
                      {b.pomocDozvole && <div className="text-[13px] font-semibold text-prototip-tekst">Pomoć oko dozvola — cena po dogovoru</div>}
                      {b.vanKataloga && <div className="text-[13px] text-sek">Traženje van kataloga (predračun {eurKratko(CENA_IZBORA_VAN_KATALOGA_CENTI)})</div>}
                    </td>
                    <td data-label="Produkcija" className="p-3">{nazivAktera(b.produkcijaId)}</td>
                    <td data-label="Izvor zahteva" className="p-3">{b.izvor}</td>
                    <td data-label="Status" className="p-3">{b.izborId ? <Oznaka vrsta="aktivna">Izbor poslat</Oznaka> : <Oznaka vrsta="ceka-vlasnika">Čeka pripremu izbora</Oznaka>}</td>
                    <td className="p-3 text-right">
                      {b.izborId
                        ? <DugmeLink to={`/izbor/${b.izborId}/deljenje`} varijanta="sekundarno" className="whitespace-nowrap">Otvori izbor</DugmeLink>
                        : <Dugme className="whitespace-nowrap" onClick={() => salji({ tip: 'ADMIN_POSALJI_IZBOR', briefId: b.id })}>Pošalji izbor</Dugme>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-10">
        <Natpis>Nalozi na čekanju</Natpis>
        <p className="mb-3 text-sm text-sek">Izmišljeni nalozi (nema prave prijave). Odluka admina ne menja ništa drugo u prototipu.</p>
        <div className="overflow-x-auto">
          <table className="tabela-kartice w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">Nalozi na čekanju</caption>
            <thead>
              <tr className="bg-traka text-left text-[13px] uppercase tracking-[0.06em] text-prig">
                <th scope="col" className="p-3">Nalog</th><th scope="col" className="p-3">Podaci</th><th scope="col" className="p-3">Prihvaćeno</th><th scope="col" className="p-3">Status</th><td className="p-3"><span className="sr-only">Radnja</span></td>
              </tr>
            </thead>
            <tbody>
              {nalozi.map((n) => (
                <tr key={n.id} className="border-b border-linija align-top">
                  <td data-label="Nalog" className="p-3"><b>{n.naziv}</b><div className="text-[13px] text-prig">{VRSTA_NALOGA[n.vrsta]}</div></td>
                  <td data-label="Podaci" className="p-3 text-sm">{n.pib ? `PIB ${n.pib} · MB ${n.mb} (izmišljeno)` : `Dokaz prava na izdavanje: ${n.dokaz}`}</td>
                  <td data-label="Prihvaćeno" className="p-3 text-sm">Prihvaćeno: {n.prihvaceno.join(' i ')} (izmišljeno)</td>
                  <td data-label="Status" className="p-3">
                    {n.stanje === 'ceka' && <Oznaka vrsta="ceka-vlasnika">Čeka odluku</Oznaka>}
                    {n.stanje === 'odobren' && <Oznaka vrsta="placeno">Odobren</Oznaka>}
                    {n.stanje === 'odbijen' && <Oznaka vrsta="odbijeno">Odbijen</Oznaka>}
                  </td>
                  <td className="p-3 text-right">
                    {n.stanje === 'ceka' && (
                      <span className="flex flex-wrap justify-end gap-2">
                        <Dugme ikona={Check} className="whitespace-nowrap" aria-label={`Odobri nalog: ${n.naziv}`} onClick={() => salji({ tip: 'ODOBRI_NALOG', nalogId: n.id })}>Odobri</Dugme>
                        <Dugme varijanta="opasno" ikona={X} className="whitespace-nowrap" aria-label={`Odbij nalog: ${n.naziv}`} onClick={() => salji({ tip: 'ODBIJ_NALOG', nalogId: n.id })}>Odbij</Dugme>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[13px] text-prig">Verzija dokumenata: {VERZIJA_DOKUMENATA} (izmišljeno). Tekst piše advokat.</p>
      </section>

      <section className="mb-10">
        <Natpis>Lokacije na čekanju</Natpis>
        {objavljena && (
          <p className="mb-3 rounded-dugme bg-[#F0FDF4] p-3 font-semibold text-uspeh" role="status">
            Lokacija „{objavljena.naziv}“ je objavljena u katalogu. <Link to={`/lokacije/${objavljena.id}`} className="underline">Otvori u katalogu</Link>
          </p>
        )}
        {prijave.length === 0 ? (
          <p className="text-sek">Nema lokacija na čekanju. Pojavljuju se kad vlasnik pošalje lokaciju ili partner preporuči lokaciju.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {prijave.map((p) => {
              const lista = kontrolnaLista(p)
              const odluka = mozeLiObjaviti(p)
              return (
                <Kartica key={p.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <b>{p.naziv}</b>
                      <p className="text-sm text-sek">
                        {p.izvor === 'vlasnik' ? `Šalje vlasnik: ${nazivAktera(p.vlasnikId)}` : `Preporuka partnera (${nazivAktera(p.podnosilacId)}); vlasnik: ${p.vlasnikNaziv}, saglasnost vlasnika: ${p.saglasnostVlasnika ? 'da' : 'ne'}`}
                      </p>
                    </div>
                    {p.stanje === 'ceka' && <Oznaka vrsta="ceka-vlasnika">Čeka odluku</Oznaka>}
                    {p.stanje === 'objavljena' && <Oznaka vrsta="aktivna">Objavljena u katalogu</Oznaka>}
                    {p.stanje === 'odbijena' && <Oznaka vrsta="odbijeno">Odbijena</Oznaka>}
                  </div>
                  <ul className="mt-3 flex flex-col gap-1 text-sm" aria-label="Kontrolna lista za objavu">
                    {lista.map((s) => (
                      <li key={s.naziv} className="flex items-center gap-2">
                        {s.ispunjeno ? <Check size={16} className="text-uspeh" aria-hidden /> : <X size={16} className="text-opasno" aria-hidden />}
                        <span>{s.naziv}<span className="sr-only">{s.ispunjeno ? ' — ispunjeno' : ' — nije ispunjeno'}</span></span>
                      </li>
                    ))}
                  </ul>
                  {p.stanje === 'ceka' && (
                    <div className="mt-3 flex flex-wrap items-start gap-2">
                      <Dugme ikona={Check} disabled={!odluka.moze} zasto={odluka.razlog} aria-label={`Odobri objavu: ${p.naziv}`} onClick={() => { salji({ tip: 'ODOBRI_OBJAVU', prijavaId: p.id }); setObjavljena({ naziv: p.naziv, id: `nova-${p.id}` }) }}>Odobri objavu</Dugme>
                      <Dugme varijanta="opasno" ikona={X} aria-label={`Odbij prijavu: ${p.naziv}`} onClick={() => salji({ tip: 'ODBIJ_PRIJAVU', prijavaId: p.id })}>Odbij</Dugme>
                    </div>
                  )}
                </Kartica>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Natpis>Uplate</Natpis>
          <Dugme varijanta="sekundarno" ikona={Download} disabled={predracuni.length === 0} zasto={predracuni.length === 0 ? 'Još nema predračuna.' : null} onClick={() => izvoz(predracuni)}>
            Izvoz faktura za knjigovođu (CSV)
          </Dugme>
        </div>
        {predracuni.length === 0 ? <p className="text-sek">Još nema predračuna. Nastaju kad vlasnik odobri zahtev ili kad se naruči usluga.</p> : (
          <div className="overflow-x-auto">
            <table className="tabela-kartice cifre w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">Predračuni i uplate</caption>
              <thead>
                <tr className="bg-traka text-left text-[13px] uppercase tracking-[0.06em] text-prig">
                  <th scope="col" className="p-3">Predračun</th><th scope="col" className="p-3 text-right">Iznos</th><th scope="col" className="p-3">Status</th><td className="p-3"><span className="sr-only">Radnja</span></td>
                </tr>
              </thead>
              <tbody>
                {predracuni.map((p) => {
                  const z = p.zahtevId ? stanje.zahtevi.find((x) => x.id === p.zahtevId) : undefined
                  const opis = z ? `${nazivAktera(z.produkcijaId)} — ${nadjiLokaciju(z.lokacijaId)?.naziv}` : `${nazivAktera(p.kupacId)} — ${VRSTA_PREDRACUNA[p.vrsta]}`
                  return (
                    <tr key={p.id} className="h-14 border-b border-linija">
                      <td data-label="Predračun" className="p-3">{opis}<div className="text-[13px] text-prig">{VRSTA_PREDRACUNA[p.vrsta]} · {pibMbTekst(p.kupacId)}</div></td>
                      <td data-label="Iznos" className="p-3 text-right font-semibold"><Iznos centi={p.ukupnoCenti} kurs={p.kurs} pare={p.ukupnoPara} />
                        {p.povracaj && <div className="text-[13px] font-normal text-opasno">Povraćaj: {rsdPara(p.povracaj.iznosPara)} (izmišljeno)</div>}</td>
                      <td data-label="Status" className="p-3">
                        {z ? <OznakaFaze faza={fazaRezervacije(z, p, stanje.sati)} />
                          : p.uplataPotvrdjena !== null ? <Oznaka vrsta="placeno">Uplata potvrđena</Oznaka> : <Oznaka vrsta="ceka-uplatu">Čeka uplatu</Oznaka>}
                      </td>
                      <td className="p-3 text-right"><DugmeLink to={`/admin/predracun/${p.id}`} varijanta="sekundarno" className="whitespace-nowrap">Otvori predračun</DugmeLink></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Stranica>
  )
}
