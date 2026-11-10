// Kalendar zauzetosti (UI 4.18): slobodno belo, zauzeto sivo sa precrtanim brojem, izabrani termin akcent (beli tekst); blokirano tamno mastilo sa ikonicom zabrane.
// Za vlasnika (B7) kalendar je i alat: slobodan dan se blokira jednim klikom, a blokiran dan (tamno, sa oznakom) se odblokira.
// Dani zauzeti van Nasetua (izmišljeno) ne mogu se menjati.
import { Ban, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { mreza, NAZIVI_MESECA } from '../logika/vreme'

const DANI = ['pon', 'uto', 'sre', 'čet', 'pet', 'sub', 'ned']

interface Props {
  /** zauzeto van Nasetua (sivo, precrtano) */
  zauzeti: string[]
  /** blokirao vlasnik (tamno, ikonica) */
  blokirani?: string[]
  izabrani?: string[]
  /** ako je dato, slobodni i blokirani dani su dugmad; klik javlja izabrani dan */
  onDan?: (dan: string) => void
  /** polazni mesec (ISO dan); inače prvi izabrani dan ili novembar 2026. */
  polazniDan?: string
}

export function Kalendar({ zauzeti, blokirani = [], izabrani = [], onDan, polazniDan }: Props) {
  const prvi = polazniDan ?? izabrani[0] ?? '2026-11-01'
  const [godina, setGodina] = useState(Number(prvi.slice(0, 4)))
  const [mesec, setMesec] = useState(Number(prvi.slice(5, 7)) - 1)

  const pomeri = (n: number) => {
    const d = new Date(Date.UTC(godina, mesec + n, 1))
    setGodina(d.getUTCFullYear())
    setMesec(d.getUTCMonth())
  }
  const velicina = onDan ? 'h-10 w-10' : 'h-9 w-9'

  return (
    <div className="rounded-kartica border border-linija bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <button type="button" aria-label="Prethodni mesec" onClick={() => pomeri(-1)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-traka"><ChevronLeft size={20} /></button>
        <b className="capitalize">{NAZIVI_MESECA[mesec]} {godina}.</b>
        <button type="button" aria-label="Sledeći mesec" onClick={() => pomeri(1)} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-traka"><ChevronRight size={20} /></button>
      </div>
      <table className="w-full table-fixed text-center text-sm cifre">
        <thead><tr>{DANI.map((d) => <th key={d} className="pb-1 text-[13px] font-semibold uppercase text-prig">{d}</th>)}</tr></thead>
        <tbody>
          {mreza(godina, mesec).map((red, i) => (
            <tr key={i}>
              {red.map((dan, j) => {
                if (!dan) return <td key={j} />
                const zauzet = zauzeti.includes(dan)
                const blokiran = !zauzet && blokirani.includes(dan)
                const izabran = izabrani.includes(dan)
                const stanjeTekst = izabran ? 'izabrani termin' : zauzet ? 'zauzeto' : blokiran ? 'blokirano' : 'slobodno'
                const klasa = izabran
                  ? 'bg-akcent font-semibold text-white'
                  : zauzet ? 'bg-[#F0EEEC] text-sek line-through'
                  : blokiran ? 'bg-mastilo font-semibold text-white ring-2 ring-inset ring-white outline outline-1 outline-mastilo'
                  : 'text-mastilo'
                const sadrzaj = (
                  <>
                    {blokiran ? <Ban size={13} aria-hidden className="mr-0.5 shrink-0" /> : null}{Number(dan.slice(8))}
                    <span className="sr-only"> {stanjeTekst}</span>
                  </>
                )
                // dugme samo za dane koje vlasnik sme da menja: slobodan (blokiraj) i blokiran (odblokiraj)
                const mozeKlik = !!onDan && !zauzet
                return (
                  <td key={j} className="p-0.5">
                    {mozeKlik ? (
                      <button
                        type="button" onClick={() => onDan(dan)} aria-pressed={blokiran}
                        aria-label={`${Number(dan.slice(8))}. ${NAZIVI_MESECA[mesec]}, ${stanjeTekst}. ${blokiran ? 'Odblokiraj' : 'Blokiraj'}`}
                        title={blokiran ? 'Blokirano — klik odblokira' : 'Slobodno — klik blokira'}
                        className={`inline-flex ${velicina} cursor-pointer items-center justify-center rounded-full border ${blokiran ? 'border-mastilo' : 'border-linija-j hover:bg-akcent-s'} ${klasa}`}
                      >{sadrzaj}</button>
                    ) : (
                      <span className={`inline-flex ${velicina} items-center justify-center rounded-full ${klasa}`} title={stanjeTekst[0].toUpperCase() + stanjeTekst.slice(1)}>
                        {sadrzaj}
                      </span>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-sek">
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full border border-linija-j bg-white" aria-hidden /> slobodno</li>
        <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-[#F0EEEC]" aria-hidden /> zauzeto</li>
        {(onDan || blokirani.length > 0) && <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-mastilo ring-2 ring-inset ring-white outline outline-1 outline-mastilo" aria-hidden /> blokirano (vlasnik)</li>}
        {izabrani.length > 0 && <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-akcent" aria-hidden /> vaš termin</li>}
      </ul>
    </div>
  )
}
