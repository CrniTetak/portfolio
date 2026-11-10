// Red oglasa (UI 5.4): zaglavlje (naziv, „Vidi sve (N)“) i niz kartica. Na računaru strelice ‹ › listaju niz; na telefonu je niz vodoravan.
// P-S4: strelice imaju pun naziv („Prethodni oglasi u redu …“) i neaktivne su na ivicama; „Vidi sve“ nosi kontekst; red nije landmark (grupa sa naslovom).
// P-S3: glatko listanje samo ako korisnik nije tražio smanjeno kretanje.
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useEkran } from '../okvir/kontekst'
import { link } from '../pravila/rute'
import { Znacka } from './Znacka'

const smanjenoKretanje = (): boolean => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function RedKategorije({ naslov, brojSvih, kat, istaknuto = false, children }: { naslov: string; brojSvih?: number; kat?: string; istaknuto?: boolean; children: ReactNode }) {
  const { ugao } = useEkran()
  const niz = useRef<HTMLDivElement>(null)
  const [ivica, setIvica] = useState({ pocetak: true, kraj: false })
  const izmeri = useCallback(() => {
    const el = niz.current
    if (!el) return
    const pocetak = el.scrollLeft <= 1
    const kraj = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1
    // isto stanje se ne upisuje ponovo (inače bi posmatrač veličine i ponovno iscrtavanje pravili beskonačnu petlju)
    setIvica((p) => (p.pocetak === pocetak && p.kraj === kraj ? p : { pocetak, kraj }))
  }, [])
  useEffect(() => {
    izmeri()
    const el = niz.current
    if (!el) return
    const posmatrac = new ResizeObserver(izmeri)
    posmatrac.observe(el)
    // D8: strelice su tačne i kad se promeni SADRŽAJ reda (broj kartica), a ne samo veličina okvira
    const sadrzaj = new MutationObserver(izmeri)
    sadrzaj.observe(el, { childList: true })
    return () => {
      posmatrac.disconnect()
      sadrzaj.disconnect()
    }
  }, [izmeri])
  const listaj = (d: number) => niz.current?.scrollBy({ left: d * 360, behavior: smanjenoKretanje() ? 'auto' : 'smooth' })
  return (
    <div role="group" aria-label={naslov} className={`red-kat${istaknuto ? ' red-istaknuto' : ''}`} data-red={kat ?? 'istaknuto'}>
      <div className="red-kat-glava">
        <h2 className="flex items-center gap-3">
          {naslov}
          {istaknuto && <Znacka vrsta="istaknuto" />}
        </h2>
        {kat && brojSvih !== undefined && (
          <a href={`#${link('P7', ugao, { kat })}`} aria-label={`Vidi sve (${brojSvih}): ${naslov}`}>
            Vidi sve ({brojSvih})
          </a>
        )}
      </div>
      <div className="red-kat-telo">
        <button type="button" className="red-strelica" data-strana="levo" aria-label={`Prethodni oglasi u redu ${naslov}`} aria-disabled={ivica.pocetak || undefined} onClick={() => listaj(-1)}>
          <ChevronLeft size={22} strokeWidth={1.75} aria-hidden />
        </button>
        <div className="red-kat-niz" ref={niz} onScroll={izmeri}>
          {children}
        </div>
        <button type="button" className="red-strelica" data-strana="desno" aria-label={`Sledeći oglasi u redu ${naslov}`} aria-disabled={ivica.kraj || undefined} onClick={() => listaj(1)}>
          <ChevronRight size={22} strokeWidth={1.75} aria-hidden />
        </button>
      </div>
    </div>
  )
}
