// P9 — Primeri dokumenata i e-mail obaveštenja (statični pregled).
// Ugovor o lokaciji i Location Brief se popunjavaju iz PLAĆENE rezervacije (?rezervacija=<id>), a adresu i kontakt
// upisuje isključivo logika/adresa.ts; u svakom drugom slučaju prikazuje se opšti izmišljeni primer.
import { FileText, Mail, X } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { Dugme, Kartica, Naslov, Natpis, Oznaka, Stranica } from '../../komponente/osnovno'
import type { PrikazAdrese } from '../../logika/adresa'
import { briefOdeljci, ugovorOdeljci, type PodaciDokumenta } from '../../logika/dokumenti'
import { DOKUMENTI_REZERVACIJE, MEJLOVI, PRAVNI_DOKUMENTI, type Dokument, type Mejl } from '../../podaci/primeri'
import { adresaZaUlogu, podaciZaDokument } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'

function ListPapira({ d, odeljci, popunjeno, onZatvori }: { d: Dokument; odeljci: [string, string][]; popunjeno: boolean; onZatvori: () => void }) {
  return (
    <div className="rounded-kartica bg-traka p-3 md:p-6" role="region" aria-label={d.naziv}>
      <div className="mb-3 flex items-center justify-between rounded bg-white px-3 py-2 text-sm">
        <span className="font-semibold">{d.naziv}{d.verzija ? ` · ${d.verzija} (izmišljeno)` : ''}</span>
        <button type="button" onClick={onZatvori} className="flex min-h-9 cursor-pointer items-center gap-1 font-semibold text-akcent hover:underline"><X size={16} aria-hidden /> Zatvori</button>
      </div>
      <div>
        {/* telefon: list papira zauzima celu širinu i raste po potrebi (bez skrola u stranu); dokument raste sa tekstom */}
        <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-papir bg-white p-5 shadow-hover sm:min-h-[560px] sm:p-8">
          <p className="mb-4 bg-prototip-s px-3 py-1 text-center text-[13px] font-bold tracking-wider text-prototip-tekst">PRIMER — nije pravni dokument</p>
          <h2 className="mb-1 text-2xl font-bold">{d.naziv}</h2>
          <p className="mb-4 text-sm text-sek">{d.strane}{popunjeno ? ' · popunjeno iz plaćene rezervacije' : ''}</p>
          {odeljci.map(([naslov, tekst]) => (
            <div key={naslov} className="mb-3 text-sm">
              <h3 className="font-semibold">{naslov}</h3>
              <p className="text-sek">{tekst}</p>
            </div>
          ))}
          {/* dijagonalni vodeni žig */}
          <span aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center text-[64px] font-bold text-mastilo opacity-[0.07] sm:text-[96px] [transform:rotate(-30deg)]">PRIMER</span>
        </div>
      </div>
    </div>
  )
}

function MejlPregled({ m, onZatvori }: { m: Mejl; onZatvori: () => void }) {
  return (
    <div className="rounded-kartica bg-traka p-3 md:p-6" role="region" aria-label={`E-mail: ${m.naslov}`}>
      <div className="mx-auto max-w-[600px]">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-sek">Od: <b>{m.posiljalac}</b> · {m.vreme}</span>
          <button type="button" onClick={onZatvori} className="flex min-h-9 cursor-pointer items-center gap-1 font-semibold text-akcent hover:underline"><X size={16} aria-hidden /> Zatvori</button>
        </div>
        <p className="mb-2 text-sm text-sek">Kome: <b>{m.primalac}</b></p>
        <div className="rounded-kartica bg-white p-6">
          <h2 className="mb-3 text-lg font-bold">{m.naslov}</h2>
          <p className="mb-5 text-sek">{m.telo}</p>
          <span className="inline-flex h-11 items-center rounded-dugme bg-akcent px-5 font-semibold text-white">{m.dugme}</span>
        </div>
        <p className="mt-2 text-sm text-sek">Primer; ništa se ne šalje. Prototip ne šalje prave mejlove.</p>
      </div>
    </div>
  )
}

function SpisakDokumenata({ naslov, dokumenti, onOtvori }: { naslov: string; dokumenti: Dokument[]; onOtvori: (id: string) => void }) {
  return (
    <>
      <div className="mt-6 first:mt-0"><Natpis>{naslov}</Natpis></div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {dokumenti.map((d) => (
          <li key={d.id}>
            <Kartica className="flex h-full flex-col items-start gap-3 p-4">
              <FileText size={28} strokeWidth={1.25} className="text-akcent" aria-hidden />
              <b>{d.naziv}</b>
              {d.verzija && <Oznaka vrsta="neutralna">{d.verzija} (izmišljeno)</Oznaka>}
              <Dugme varijanta="sekundarno" aria-label={`Otvori primer: ${d.naziv}`} onClick={() => onOtvori(d.id)}>Otvori primer</Dugme>
            </Kartica>
          </li>
        ))}
      </ul>
    </>
  )
}

/** Tekst dokumenta: ugovor i Brief se popunjavaju iz rezervacije (ako je podaci ima), ostali su statični. */
function odeljciZaDokument(dok: Dokument, podaci: PodaciDokumenta | null, adresa: PrikazAdrese | null): [string, string][] {
  if (dok.id === 'ugovor') return ugovorOdeljci(podaci, adresa)
  if (dok.id === 'brief') return briefOdeljci(podaci, adresa)
  return dok.odeljci
}

export default function Primeri() {
  const { stanje } = useStanje()
  const [params, setParams] = useSearchParams()
  const [mejl, setMejl] = useState<string | null>(null)
  const dokId = params.get('dokument')
  const rezervacijaId = params.get('rezervacija')
  const dok = [...DOKUMENTI_REZERVACIJE, ...PRAVNI_DOKUMENTI].find((d) => d.id === dokId)
  const izabranMejl = MEJLOVI.find((m) => m.id === mejl)

  // Popunjavanje iz rezervacije: prvo provera prava (podaciZaDokument), pa adresa preko logika/adresa.ts (adresaZaUlogu)
  const podaci = podaciZaDokument(stanje, rezervacijaId)
  const zahtev = podaci ? stanje.zahtevi.find((z) => z.id === podaci.zahtevId) : undefined
  const adresa = zahtev ? adresaZaUlogu(stanje, zahtev.lokacijaId) : null
  const odeljci = dok ? odeljciZaDokument(dok, podaci, adresa) : []
  const popunjeno = !!podaci && (dok?.id === 'ugovor' || dok?.id === 'brief')
  const trazenaIzRezervacije = !!rezervacijaId && (dok?.id === 'ugovor' || dok?.id === 'brief')

  return (
    <Stranica>
      <Naslov podnaslov="Statični pregled dokumenata i poruka koje bi pravi servis slao. Svi podaci su izmišljeni.">Primeri dokumenata i poruka</Naslov>

      {dok ? (
        <>
          {trazenaIzRezervacije && !popunjeno && (
            <p className="mb-3 rounded-dugme bg-prototip-s px-4 py-3 text-sm font-semibold text-prototip-tekst" role="status">
              {stanje.uloga === 'partner'
                ? 'Dokumenti rezervacije nisu dostupni partneru (ni pre ni posle uplate); prikazuje se opšti izmišljeni primer.'
                : 'Popunjen dokument vidi se posle potvrđene uplate naknade. Dok toga nema (ili rezervacija nije vaša), prikazuje se opšti izmišljeni primer.'}
            </p>
          )}
          <ListPapira d={dok} odeljci={odeljci} popunjeno={popunjeno} onZatvori={() => setParams({})} />
        </>
      ) : (
        <>
          <SpisakDokumenata naslov="Dokumenti rezervacije" dokumenti={DOKUMENTI_REZERVACIJE} onOtvori={(id) => setParams({ dokument: id })} />
          <SpisakDokumenata naslov="Pravni dokumenti (nacrt; tekst piše advokat)" dokumenti={PRAVNI_DOKUMENTI} onOtvori={(id) => setParams({ dokument: id })} />
        </>
      )}

      <div className="mt-10"><Natpis>E-mail obaveštenja</Natpis></div>
      {izabranMejl ? <MejlPregled m={izabranMejl} onZatvori={() => setMejl(null)} /> : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MEJLOVI.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setMejl(m.id)} className="flex h-full w-full cursor-pointer items-start gap-3 rounded-kartica border border-linija bg-white p-4 text-left hover:shadow-[0_6px_16px_rgba(15,23,42,0.10)]">
                <Mail size={20} className="mt-0.5 shrink-0 text-akcent" aria-hidden />
                <span><b className="block">{m.dogadjaj}</b><span className="text-sm text-sek">{m.naslov}</span><span className="block text-[13px] text-prig">Kome: {m.primalac}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Stranica>
  )
}
