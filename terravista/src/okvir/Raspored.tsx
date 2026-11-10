// RASPORED (PLAN B4.5):
//  - široko (širina ≥ 1000 px i odnos ≥ 1,2): televizor (oko 72 %, telefon oko 24 %) sa natpisom i daljinskim ispod, desno telefon; sve staje bez pomeranja stranice;
//  - usko: JEDAN uređaj + prekidač „Televizor ⇄ Telefon“; telefon prirodno (punom širinom);
//    televizor vodoravno: preko celog ekrana, bez daljinskog, krupno platno 960 × 540;
//    televizor uspravno: slika 16 : 9 pri vrhu, ispod kompaktan daljinski, red „Izabrano“ i savet za okretanje telefona.
import { useState } from 'react'
import { Daljinski, MiniDaljinski } from './Daljinski'
import { OkvirTelefona } from './OkvirTelefona'
import { OkvirTelevizora } from './OkvirTelevizora'
import { PrekidacUredjaja } from './PrekidacUredjaja'
import { UPIT_NISKO, UPIT_SIROKO, UPIT_VODORAVNO } from './mere'
import { useDemo } from './stanje'
import { useMedia } from './useMedia'
import { useTvObavestenje } from '../tv-navigacija/fokus'

/** Savet „okreni telefon“ se prikazuje jednom (do osvežavanja stranice), ne pri svakom povratku na uspravni televizor. */
let savetViden = false

export function Raspored() {
  const siroko = useMedia(UPIT_SIROKO)
  return siroko ? <RasporedSiroko /> : <RasporedUsko />
}

function RasporedSiroko() {
  const d = useDemo()
  const nisko = useMedia(UPIT_NISKO)
  const tekst = (
    <div className="podnozje-tekst">
      <b>Televizor</b>
      <span>Upravljaš strelicama, Enter-om i Backspace-om, ili klikom</span>
    </div>
  )
  return (
    <div className={`raspored raspored--siroko ${nisko ? 'raspored--bocno' : ''}`} data-raspored={nisko ? 'siroko-bocno' : 'siroko'}>
      <div className="kolona kolona--tv">
        <OkvirTelevizora />
        {!nisko && (
          <div className="podnozje-tv">
            {tekst}
            <Daljinski />
            <span className="podnozje-tekst" aria-hidden="true" />
          </div>
        )}
      </div>
      {nisko && (
        <div className="kolona kolona--daljinski">
          {tekst}
          <Daljinski uspravan />
        </div>
      )}
      <div className="kolona kolona--tel">
        <div className="natpis-uredjaja">
          <b>Telefon</b>
          {d.sija && (
            <span className="sija-natpis" role="status">
              {d.sija}
            </span>
          )}
        </div>
        <OkvirTelefona osvetli={d.sija !== null} />
      </div>
    </div>
  )
}

function RasporedUsko() {
  const { uredjaj } = useDemo()
  const vodoravno = useMedia(UPIT_VODORAVNO)
  const { izabrano } = useTvObavestenje()
  const [savetSakriven, setSavetSakriven] = useState(savetViden)

  return (
    <div className={`usko usko--${uredjaj}`} data-raspored="usko">
      {!(vodoravno && uredjaj === 'tv') && <PrekidacUredjaja />}
      {uredjaj === 'tel' ? (
        <OkvirTelefona prirodno />
      ) : vodoravno ? (
        <div className="usko-tv-vodoravno">
          <MiniDaljinski />
          <OkvirTelevizora krupno bezRama />
        </div>
      ) : (
        <div className="usko-tv-uspravno">
          <OkvirTelevizora krupno poSirini />
          <Daljinski kompaktan />
          <div className="izabrano-red" aria-hidden="true">
            {izabrano ? `Izabrano: ${izabrano}` : ' '}
          </div>
          {!savetSakriven && (
            <button
              type="button"
              className="savet"
              onClick={() => {
                savetViden = true
                setSavetSakriven(true)
              }}
            >
              Za bolji prikaz okreni telefon vodoravno
            </button>
          )}
        </div>
      )}
    </div>
  )
}
