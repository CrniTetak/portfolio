// B11 — Pravne strane (nacrt): opšti uslovi, privatnost i kolačići, ugovori o posredovanju. Sve je izmišljeno; tekst piše advokat.
import { ChevronDown } from 'lucide-react'
import { Kartica, Naslov, Oznaka, Stranica } from '../../komponente/osnovno'
import { OZNAKA_ADVOKAT } from '../../logika/dokumenti'
import { VERZIJA_DOKUMENATA } from '../../logika/konstante'
import { PRAVNI_DOKUMENTI } from '../../podaci/primeri'

export default function Pravno() {
  return (
    <Stranica uzak>
      <Naslov podnaslov={`Nacrti, verzija ${VERZIJA_DOKUMENATA} (izmišljeno). ${OZNAKA_ADVOKAT[0].toUpperCase()}${OZNAKA_ADVOKAT.slice(1)}. Nije pravni savet.`}>Pravne strane (nacrt)</Naslov>
      <p className="mb-6 rounded-dugme bg-prototip-s px-4 py-3 text-sm text-prototip-tekst">
        Prihvaćena verzija dokumenata vidi se uz naloge u ulozi Admin („Nalozi na čekanju“). Ovo su kratke ključne stavke iz blueprinta, a ne pravni tekst.
      </p>
      <div className="flex flex-col gap-3">
        {PRAVNI_DOKUMENTI.map((d) => (
          <Kartica key={d.id} className="p-0">
            <details className="group">
              <summary className="flex min-h-12 cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-5 py-3 font-semibold">
                <span>{d.naziv}</span>
                <span className="flex items-center gap-2"><Oznaka vrsta="neutralna">{d.verzija} (izmišljeno)</Oznaka><ChevronDown size={18} aria-hidden className="transition group-open:rotate-180" /></span>
              </summary>
              <div className="border-t border-linija p-5">
                <p className="mb-3 text-sm text-sek">Strane: {d.strane}</p>
                {d.odeljci.map(([naslov, tekst]) => (
                  <div key={naslov} className="mb-3 text-sm">
                    <h3 className="font-semibold">{naslov}</h3>
                    <p className="text-sek">{tekst}</p>
                  </div>
                ))}
              </div>
            </details>
          </Kartica>
        ))}
      </div>
    </Stranica>
  )
}
