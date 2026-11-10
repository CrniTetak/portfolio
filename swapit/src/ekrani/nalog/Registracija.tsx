// R2, R3, R4: nalog u tri koraka (UX 6.2). Korak 1 priče. Ne tražimo pol, ulicu ni datum rođenja: samo grad i potvrdu punoletstva.
// Obavezne kvačice NISU unapred štiklirane; „Dalje“ u traci priče ih štiklira kad izvede korak.
import { useState } from 'react'
import { useSaglasnost } from '../../demo/useStanje'
import { Logo } from '../../komponente/Logo'
import { Kvacica, Padajuce } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useStanjePrice } from '../../demo/useStanje'
import { GODINE_PUNOLETSTVA, KONTAKT_ANA, KOD_POTVRDE, TELEFON_ANA_MASKIRAN } from '../../scenario/prica'
import { poeni } from '../../scenario/format'
import { ANA_ID, POCETNI_POENI, REGION_KORISNICI } from '../../scenario/svet'

function Glava({ korak }: { korak: number }) {
  return (
    <>
      <div className="mb-4 flex justify-center">
        <Logo sirina={140} />
      </div>
      <div className="koraci-nalog mb-4" role="img" aria-label={`Korak ${korak} od 3`}>
        {[1, 2, 3].map((k) => (
          <i key={k} data-gotov={k <= korak ? '1' : undefined} />
        ))}
        <span>
          Korak {korak} od 3
        </span>
      </div>
    </>
  )
}

export function R2() {
  const l = useLink()
  return (
    <section className="kartica ekran-uzak" data-ekran-sadrzaj="R2">
      <Glava korak={1} />
      <h1>Napravi nalog</h1>
      <div className="stog mt-4">
        <PrikaznoPolje oznaka="Korisničko ime" vrednost={ANA_ID} napomena />
        <PrikaznoPolje oznaka="E-pošta" vrednost={KONTAKT_ANA} />
        <PrikaznoPolje oznaka="Broj telefona" vrednost={TELEFON_ANA_MASKIRAN} />
        <PrikaznoPolje oznaka="Lozinka" vrednost="" lozinka />
        <PrikaznoPolje oznaka="Ponovi lozinku" vrednost="" lozinka />
        <p className="pomocni-tekst">Ne tražimo pol, ulicu ni datum rođenja.</p>
        <div className="red-dugmad">
          <RadnjaDugme id="1.r2" nakon={l('R3')} poruka={false}>
            Dalje
          </RadnjaDugme>
          <Veza ekran="R1" className="dugme dugme-tekst">
            Već imaš nalog? Prijavi se
          </Veza>
        </div>
      </div>
    </section>
  )
}

export function R3() {
  const l = useLink()
  const [punoletstvo, setPunoletstvo] = useSaglasnost('r3_punoletstvo')
  const [uslovi, setUslovi] = useSaglasnost('r3_uslovi')
  const [grad, setGrad] = useState('Beograd')
  const nedostaje = !punoletstvo || !uslovi
  return (
    <section className="kartica ekran-uzak" data-ekran-sadrzaj="R3">
      <Glava korak={2} />
      <h1>Grad i punoletstvo</h1>
      <div className="stog mt-4">
        <Padajuce oznaka="Grad" vrednost={grad} onChange={setGrad} opcije={['Beograd']} grupe={[{ naziv: 'U regionu', opcije: REGION_KORISNICI.map((k) => k.grad) }]} />
        <Kvacica obavezna checked={punoletstvo} onChange={setPunoletstvo} dataKljuc="r3_punoletstvo" oznaka={<>Imam {GODINE_PUNOLETSTVA} ili više godina</>} />
        <Kvacica
          obavezna
          checked={uslovi}
          onChange={setUslovi}
          dataKljuc="r3_uslovi"
          oznaka={
            <>
              Prihvatam <Veza ekran="S4" parametri={{ tekst: 'uslovi' }}>uslove korišćenja</Veza> i <Veza ekran="S4" parametri={{ tekst: 'privatnost' }}>politiku privatnosti</Veza>
            </>
          }
        />
        <div className="red-dugmad">
          <RadnjaDugme id="1.r3" nakon={l('R4')} poruka={false} blokirano={nedostaje ? 'Označi obavezna polja' : undefined}>
            Napravi nalog
          </RadnjaDugme>
          <Veza ekran="R2" className="dugme dugme-tekst">
            Nazad
          </Veza>
        </div>
      </div>
    </section>
  )
}

export function R4() {
  const { uradjeno } = useStanjePrice()
  const potvrdjeno = uradjeno('1.r4')
  return (
    <section className="kartica ekran-uzak" data-ekran-sadrzaj="R4">
      <Glava korak={3} />
      <h1>{potvrdjeno ? 'Nalog je spreman' : 'Potvrda telefona'}</h1>
      {!potvrdjeno ? (
        <div className="stog mt-4">
          <p>Poslali smo kod na tvoj broj.</p>
          <PrikaznoPolje oznaka="Kod iz poruke" vrednost={KOD_POTVRDE} napomena />
          <div className="red-dugmad">
            <RadnjaDugme id="1.r4" poruka={false}>
              Potvrdi
            </RadnjaDugme>
            <Veza ekran="R3" className="dugme dugme-tekst">
              Nazad
            </Veza>
          </div>
        </div>
      ) : (
        <div className="stog mt-4" data-uspeh>
          <Obavestenje stanje="uspeh" uloga="status">
            <b>Uspeh.</b> Broj je potvrđen i ostaje skriven; otkriva se tek posle prihvaćene ponude.
          </Obavestenje>
          <div className="znacke">
            <Znacka vrsta="verifikovan" />
            <Znacka vrsta="gradjanin" />
          </div>
          <p>
            Dobila si <b className="num">{poeni(POCETNI_POENI)}</b> za početak <Znacka vrsta="model" />
          </p>
          <div className="red-dugmad">
            <Veza ekran="P1" className="dugme dugme-zeleno">
              Uđi
            </Veza>
          </div>
        </div>
      )}
    </section>
  )
}
