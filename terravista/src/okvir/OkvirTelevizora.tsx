// OKVIR TELEVIZORA: ram + platno (1920 × 1080 ili krupno 960 × 540) umanjeno jednim faktorom; unutra ekran, pilula „Demo“,
// red „Izabrano: …“ i poruka. Regija „Televizor (demo)“ za čitač ekrana; red „Izabrano“ je aria-live (PLAN B5.3).
import { useEffect } from 'react'
import { TvSadrzajEkrana } from '../ekrani'
import { useTvObavestenje } from '../tv-navigacija/fokus'
import { KakoSeUpravlja } from './KakoSeUpravlja'
import { TV_KRUPNO, TV_PUNO, RAM_TV, TRAJANJE_UDARA_MS, POMAK_UDARA } from './mere'
import { useDemo } from './stanje'
import { TvToast } from './Toast'
import { Uklopi } from './Uklopi'

export function OkvirTelevizora({ krupno = false, poSirini = false, bezRama = false }: { krupno?: boolean; poSirini?: boolean; bezRama?: boolean }) {
  const baza = krupno ? TV_KRUPNO : TV_PUNO
  const { pomoc, zatvoriPomoc } = useDemo()
  const { izabrano, udar } = useTvObavestenje()

  // Kratak „udar“ na ivici: izabrani element se pomeri nekoliko jedinica u smeru strelice i vrati (WAAPI; isključeno kad sistem traži manje pokreta).
  useEffect(() => {
    if (!udar || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = document.querySelector<HTMLElement>('[data-tv-oblast] [data-izabran]')
    const p = POMAK_UDARA
    const pomak = { levo: `${-p}px 0`, desno: `${p}px 0`, gore: `0 ${-p}px`, dole: `0 ${p}px` }[udar.smer]
    el?.animate({ translate: ['0 0', pomak, '0 0'] }, { duration: TRAJANJE_UDARA_MS })
  }, [udar])

  return (
    <Uklopi baza={baza} tip="tv" ram={RAM_TV} poSirini={poSirini} bezRama={bezRama} oblast naslov="Televizor (demo)">
      <div className={`tv-platno ${krupno ? 'tv-platno--krupno' : ''}`} data-tv-platno style={{ width: baza.sirina, height: baza.visina }} onMouseDown={(e) => e.preventDefault()}>
        <TvSadrzajEkrana />
        {pomoc && <KakoSeUpravlja onZatvori={zatvoriPomoc} />}
        <span className="tv-pilula-demo">Demo</span>
        <div className="tv-izabrano" aria-hidden="true" data-tv-izabrano>
          {izabrano ? `Izabrano: ${izabrano}` : ''}
        </div>
        <TvToast />
      </div>
    </Uklopi>
  )
}
