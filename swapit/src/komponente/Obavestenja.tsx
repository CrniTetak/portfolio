// Zajednička obaveštenja koja moraju da kažu ISTO na svim ekranima gde se pojavljuju (S9): prava potrošača i ideje.
import { Obavestenje } from './Obavestenje'

/** Prava potrošača: ista rečenica u X2, X13 i O1. Građanin nije trgovac, firma jeste. */
export function PravaPotrosaca({ firma = false }: { firma?: boolean }) {
  return (
    <Obavestenje stanje="upozorenje">
      {firma ? (
        <>
          <b>Druga strana je firma.</b> Važe prava potrošača u skladu sa pravilima te firme.
        </>
      ) : (
        <>
          <b>Prava potrošača ne važe.</b> Reklamacija i povraćaj se ne primenjuju kad je druga strana građanin, a ne trgovac.
        </>
      )}
    </Obavestenje>
  )
}

/** Ideja kao ponuda ili oglas (O1, X1, X2, X4, X5): definicija i upozorenje da javno opisana ideja više nije tajna. */
export function ObavestenjeIdeja() {
  return (
    <Obavestenje stanje="upozorenje">
      <b>Ideja</b> je savet ili konsultacija, plan ili nacrt, ili dizajn ili fajl uz licencu. Javno opisana ideja više nije tajna; izum prvo zaštiti.
    </Obavestenje>
  )
}

/** Nekretnine i vozila (O1, O2, X2): SWAPIT ne posreduje, prenos vlasništva se završava van aplikacije. */
export function ObavestenjeNekretnine() {
  return (
    <Obavestenje stanje="upozorenje">
      SWAPIT ne posreduje u prometu nekretnina i vozila, ne učestvuje u dogovoru i ne uzima proviziju. Prenos vlasništva se završava van aplikacije: kod notara, odnosno u MUP-u.
    </Obavestenje>
  )
}
