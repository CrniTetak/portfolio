// Predračun (UI 4.8): izgleda kao uredan papirni dokument. Nema dugmeta "Plati".
// Iznos za uplatu je u DINARIMA (glavni iznos), evro je ispod kao "orijentaciono". Naknada se računa u evrima.
import { eur, eurOrijentaciono, kursTekst, rsdPara } from '../logika/novac'
import { NAKNADA_MINIMUM_CENTI, NAKNADA_PROCENAT, PRIMALAC_UPLATE, RACUN_UPLATE } from '../logika/konstante'
import { stavkePredracuna } from '../logika/rezervacije'
import type { Predracun } from '../logika/tipovi'
import { pibMbTekst } from '../podaci/akteri'
import { Oznaka } from './osnovno'

interface Props {
  predracun: Predracun
  /** naziv kupca (produkcija ili vlasnik) */
  kupac: string
  lokacija: string
  opisCene: string
}

const NASLOV = {
  naknada: 'Predračun — naknada Nasetua',
  'izbor-van-kataloga': 'Predračun — izbor van kataloga',
  fotografisanje: 'Predračun — fotografisanje prostora',
} as const

export function PredracunKartica({ predracun: p, kupac, lokacija, opisCene }: Props) {
  const placeno = p.uplataPotvrdjena !== null
  const stavke = stavkePredracuna(p, opisCene)
  return (
    <section className="relative mx-auto w-full max-w-[720px] rounded-papir border border-linija bg-white p-5 shadow-pilula md:p-8" aria-label={NASLOV[p.vrsta]}>
      <span className="mb-3 inline-block rounded border-2 border-prig px-2 py-0.5 text-[13px] font-bold tracking-[0.12em] text-prig md:absolute md:right-8 md:top-7 md:mb-0">SIMULIRANO</span>
      <h2 className="text-[24px] font-bold md:text-[26px]">{NASLOV[p.vrsta]}</h2>
      <p className="text-sm text-sek">Br. {p.pozivNaBroj.split(' ')[1]} · {kupac}{lokacija ? ` · ${lokacija}` : ''}</p>
      <p className="mt-1 text-sm text-sek">Kupac: {kupac} · {pibMbTekst(p.kupacId)}</p>
      <p className="my-4 rounded-dugme border-l-4 border-akcent bg-akcent-s px-4 py-3 font-semibold text-mastilo">
        {p.vrsta === 'naknada'
          ? 'Ovo je samo naša naknada. Cenu lokacije plaćate direktno vlasniku, po dogovoru iz ugovora o lokaciji.'
          : 'Ovo je predračun za uslugu Nasetua (izmišljeno). Cenu lokacije plaćate direktno vlasniku.'}
      </p>
      <table className="cifre w-full border-collapse">
        <caption className="sr-only">Stavke predračuna u evrima</caption>
        <tbody>
          {stavke.map((s) => (
            <tr key={s.naziv} className={s.tip === 'info' ? 'text-prig' : ''}>
              <td className="border-b border-linija py-2.5 pr-3">
                {s.tip === 'info' ? <>Cena lokacije{opisCene ? ` (${opisCene})` : ''} — <i>ne plaća se ovde</i></>
                  : s.tip === 'naknada' ? <>Naknada Nasetua {NAKNADA_PROCENAT}% (najmanje {eur(NAKNADA_MINIMUM_CENTI)}){p.primenjenMinimum && <b className="block text-sm text-mastilo">Primenjen najmanji iznos</b>}</>
                  : s.naziv}
                {s.napomena && <span className="block text-sm text-sek">{s.napomena}</span>}
              </td>
              <td className="border-b border-linija py-2.5 text-right whitespace-nowrap">{eur(s.iznosCenti)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[13px] text-sek">Stavke su u evrima (naknada se računa u evrima); iznos za uplatu je preračunat u dinare po kursu zapisanom na predračunu.</p>

      {/* ukupno: na uskom ekranu natpis iznad iznosa (320 px), na širem u istom redu */}
      <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <span className="font-bold">Ukupno za uplatu Nasetuu</span>
        <span className="cifre sm:text-right">
          <b className="block text-2xl font-extrabold whitespace-nowrap text-mastilo sm:text-[28px]">{rsdPara(p.ukupnoPara)}</b>
          <span className="text-sm text-sek">{eurOrijentaciono(p.ukupnoCenti)}</span>
        </span>
      </div>
      <p className="cifre mt-1 text-sm text-sek sm:text-right">{kursTekst(p.kurs)} — izmišljeni fiksni kurs prototipa</p>

      <dl className="cifre mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-dugme bg-traka p-4 text-sm">
        <dt className="text-sek">Primalac</dt><dd>{PRIMALAC_UPLATE}</dd>
        <dt className="text-sek">Račun</dt><dd>{RACUN_UPLATE} (izmišljeno)</dd>
        <dt className="text-sek">Poziv na broj</dt><dd>{p.pozivNaBroj} (izmišljeno)</dd>
      </dl>
      {p.vrsta === 'naknada' && <p className="mt-4 text-sm text-sek">Naknada je nepovratna, osim kad otkaže vlasnik; tada se vraća i nudi se zamenska lokacija.</p>}
      {p.povracaj && (
        <p className="cifre mt-3 rounded-dugme bg-[#FEF3C7] px-4 py-3 text-sm font-semibold text-prototip-tekst" role="status">
          Vlasnik je otkazao: naknada se vraća (izmišljeno), {rsdPara(p.povracaj.iznosPara)}.
        </p>
      )}
      <div className="mt-4">
        {placeno
          ? <Oznaka vrsta="placeno" velika>Uplata potvrđena</Oznaka>
          : <Oznaka vrsta="ceka-uplatu" velika>Čeka uplatu</Oznaka>}
      </div>
    </section>
  )
}
