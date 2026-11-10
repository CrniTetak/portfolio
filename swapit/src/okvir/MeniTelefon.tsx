// Meni ≡ na telefonu (UX 2.1, 9): ista lista kao ikonska traka i meni profila, plus kategorije, „Gledaj kao“ i Restart.
// U vođenom režimu ikonska traka iz Figme živi ovde (jedan fiksni sloj pri dnu je traka priče).
import { X } from 'lucide-react'
import { useRef } from 'react'
import { useDemo } from '../demo/DemoProvider'
import { link, RUTA_PO_ID } from '../pravila/rute'
import { NAZIV_UGLA, UGLOVI } from '../prica/tipovi'
import { useEkran, useIdi, usePromenaUgla } from './kontekst'
import { Ikona } from './Ikone'
import { MENI_UGLA } from './LeviStub'
import { IKONSKA_TRAKA, MENI_PROFILA, OSTALO_U_MENIJU } from './stavke'
import { preskociVracanjeFokusa, useFocusTrap } from './useFocusTrap'

export function MeniTelefon() {
  const demo = useDemo()
  const { ugao } = useEkran()
  const idi = useIdi()
  const promeniUgao = usePromenaUgla()
  const ref = useRef<HTMLDivElement>(null)
  const zatvori = () => demo.otvoriMeni(false)
  useFocusTrap(ref, true, zatvori)
  const sme = (ekran: string) => RUTA_PO_ID[ekran].uglovi.includes(ugao)
  const veza = (ekran: string, naziv: string, ikona?: Parameters<typeof Ikona>[0]['naziv']) => (
    <a
      key={`${ekran}-${naziv}`}
      href={`#${link(ekran, ugao)}`}
      onClick={() => {
        preskociVracanjeFokusa() // fokus ide na h1 novog ekrana, ne nazad na dugme ≡
        zatvori()
      }}
    >
      {ikona && <Ikona naziv={ikona} velicina={18} />}
      {naziv}
      {ekran === 'W1' && <span className="pomocni-tekst" data-model-u-meniju> · model u proveri</span>}
    </a>
  )
  return (
    <div className="fixed inset-0 z-[80]" data-dijalog data-meni-telefon>
      <button type="button" tabIndex={-1} aria-hidden="true" className="skrim absolute inset-0" onClick={zatvori} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Meni" className="meni-panel padajuce-telefon">
        <button type="button" className="ikona-dugme meni-zatvori" aria-label="Zatvori meni" data-prvi-fokus onClick={zatvori}>
          <X size={22} strokeWidth={1.75} aria-hidden />
        </button>
        {(ugao === 'prodavnica' || ugao === 'moderacija') && (
          <>
            {/* S10: meni ugla (levi stub na računaru) na telefonu stoji ovde, pa se do svake njegove stavke stiže */}
            <div className="naslov-grupe" data-meni-ugla-telefon={ugao}>
              {MENI_UGLA[ugao].naziv}
            </div>
            {MENI_UGLA[ugao].stavke.map((s) => veza(s.ekran, s.naziv))}
          </>
        )}
        <div className="naslov-grupe">Prečice</div>
        {IKONSKA_TRAKA.filter((i) => sme(i.ekran)).map((i) => veza(i.ekran, i.naziv, i.ikona))}
        <div className="naslov-grupe">Moj nalog</div>
        {MENI_PROFILA.filter((i) => sme(i.ekran)).map((i) => veza(i.ekran, i.naziv))}
        <div className="naslov-grupe">Gledaj kao</div>
        {UGLOVI.map((u) => (
          <button
            key={u}
            type="button"
            aria-pressed={u === ugao}
            onClick={() => {
              zatvori()
              promeniUgao(u)
            }}
          >
            {NAZIV_UGLA[u]}
          </button>
        ))}
        <div className="naslov-grupe">Više</div>
        {OSTALO_U_MENIJU.filter((i) => sme(i.ekran)).map((i) => veza(i.ekran, i.naziv))}
        <button
          type="button"
          onClick={() => {
            zatvori()
            demo.otvoriRestart(true)
          }}
        >
          Restart demo
        </button>
        <button
          type="button"
          onClick={() => {
            zatvori()
            idi('R1')
          }}
        >
          Odjavi se
        </button>
      </div>
    </div>
  )
}
