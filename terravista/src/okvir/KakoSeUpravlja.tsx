// KARTICA „Kako se upravlja“ (UX 3.5): prozor preko ekrana televizora. Prvi put se prikazuje na T1 (talas 1); dugme „?“ u traci je otvara uvek.
// Primer sloja: fokus ne izlazi iz kartice dok se ne zatvori; Nazad je zatvara.
import { KAKO_SE_UPRAVLJA } from '../podaci/stalni-tekstovi'
import { TvFokus, TvSloj } from '../tv-navigacija/fokus'

export function KakoSeUpravlja({ onZatvori }: { onZatvori: () => void }) {
  return (
    <TvSloj id="kako-se-upravlja" onNazad={onZatvori} pocetni="kako-ok">
      <div className="tv-prozor" role="dialog" aria-modal="true" aria-labelledby="kako-naslov" aria-describedby="kako-lista">
        <div className="tv-prozor-kartica">
          <h3 id="kako-naslov">Kako se upravlja</h3>
          <ul id="kako-lista">
            {KAKO_SE_UPRAVLJA.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <TvFokus id="kako-ok" etiketa="U redu" className="tv-dugme tv-dugme--glavno" onAktiviraj={onZatvori}>
            U redu
          </TvFokus>
        </div>
      </div>
    </TvSloj>
  )
}
