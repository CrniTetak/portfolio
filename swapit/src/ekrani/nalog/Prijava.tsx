// R1 „Prijava“ i R5 „Zaboravljena lozinka“ (UX 6.2). Lažna prijava: polja su unapred popunjena (lozinka je statičan red tačkica), a „Prijavi se“
// otvara dijalog „Uđi kao“ sa četiri ugla. Ništa se ne šalje; stanje priče se ne menja, samo se otvara kuća izabranog ugla.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { Logo } from '../../komponente/Logo'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PrikaznoPolje } from '../../komponente/PrikaznoPolje'
import { Veza } from '../../komponente/Veza'
import { Dijalog } from '../../okvir/Dijalozi'
import { KUCA, link } from '../../pravila/rute'
import { NAZIV_UGLA, UGLOVI, type Ugao } from '../../prica/tipovi'
import { KONTAKT_ANA } from '../../scenario/prica'
import { ANA_ID } from '../../scenario/svet'
import { PORUKE } from '../../tekstovi/okvir'

const OPIS_UGLA: Record<Ugao, string> = {
  ana: 'građanka koja traži veći bicikl za ćerku',
  marko: 'građanin koji ima dečji bicikl',
  prodavnica: 'prodavnica sportske opreme (firma)',
  moderacija: 'moderatorka SWAPIT tima',
}

export function R1() {
  const navigate = useNavigate()
  const demo = useDemo()
  const [dijalog, setDijalog] = useState(false)
  const udji = (u: Ugao) => {
    setDijalog(false)
    // vođena priča: ekran stanja priče za ugao; slobodno: kuća ugla
    const ekran = demo.rezim === 'vodjena' ? demo.ekranZa(u) : KUCA[u]
    navigate(link(ekran, u))
    window.scrollTo(0, 0)
  }
  return (
    <section className="kartica mx-auto max-w-md" data-ekran-sadrzaj="R1">
      <div className="mb-4 flex justify-center">
        <Logo sirina={160} />
      </div>
      <h1>Prijava</h1>
      <div className="stog mt-4">
        <PrikaznoPolje oznaka="Korisničko ime ili e-pošta" vrednost={ANA_ID} napomena />
        <PrikaznoPolje oznaka="Lozinka" vrednost="" lozinka />
        <div className="red-dugmad">
          <button type="button" className="dugme dugme-zeleno" onClick={() => setDijalog(true)}>
            Prijavi se
          </button>
        </div>
        <p>
          <Veza ekran="R5">Zaboravljena lozinka?</Veza>
        </p>
        <p>
          Nemaš nalog?{' '}
          <Veza ekran="R2" className="font-extrabold">
            Napravi nalog
          </Veza>
        </p>
        <p className="pomocni-tekst">Bez lozinke. Svi podaci su izmišljeni. Ništa se ne šalje.</p>
      </div>
      {dijalog && (
        <Dijalog naslov="Uđi kao" onZatvori={() => setDijalog(false)}>
          <p className="mb-3 pomocni-tekst">Izaberi čije oči gledaš.</p>
          <div className="grid gap-2" role="group" aria-label="Uđi kao">
            {UGLOVI.map((u, i) => (
              <button key={u} type="button" className="dugme dugme-linija text-left" data-prvi-fokus={i === 0 ? true : undefined} onClick={() => udji(u)}>
                <b>{NAZIV_UGLA[u]}</b> <span className="pomocni-tekst">— {OPIS_UGLA[u]}</span>
              </button>
            ))}
          </div>
        </Dijalog>
      )}
    </section>
  )
}

export function R5() {
  const demo = useDemo()
  const [poslato, setPoslato] = useState(false)
  return (
    <section className="kartica mx-auto max-w-md" data-ekran-sadrzaj="R5">
      <div className="mb-4 flex justify-center">
        <Logo sirina={160} />
      </div>
      <h1>Zaboravljena lozinka</h1>
      <div className="stog mt-4">
        <PrikaznoPolje oznaka="E-pošta" vrednost={KONTAKT_ANA} napomena />
        {poslato && (
          <Obavestenje stanje="uspeh" uloga="status">
            <span data-link-poslat>{PORUKE.simulacija}. Link za novu lozinku bi stigao na ovu e-poštu.</span>
          </Obavestenje>
        )}
        <div className="red-dugmad">
          <button
            type="button"
            className="dugme dugme-zeleno"
            onClick={() => {
              setPoslato(true)
              demo.obavesti(PORUKE.simulacija)
            }}
          >
            Pošalji link
          </button>
          <Veza ekran="R1" className="dugme dugme-tekst">
            Nazad na prijavu
          </Veza>
        </div>
      </div>
    </section>
  )
}
