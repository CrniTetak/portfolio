// U3 O ovom demou (talas 2): šta demo jeste i nije, šest linija koje platforma namerno ne prelazi, cene, likovi i „Izvori slika i logotipa“.
import { ZnakTerraVista } from '../../komponente/tv/ZnakTerraVista'
import { cena } from '../../podaci/format'
import { CENE, FILMSKA_RIZNICA, LOGOTIPI, PREZIME_PORODICE, SLIKE, lik, prikaziLogotipe } from '../../podaci/svet'
import { CENE_NAPOMENA, CRVENE_LINIJE, DEMO_JESTE, DEMO_NIJE, LIKOVI_NAPOMENA } from '../../tekstovi/o-demou'
import { sastavi } from '../../pravila/ekrani'

function Lista({ stavke }: { stavke: readonly string[] }) {
  return (
    <ul className="tabla-lista">
      {stavke.map((r) => (
        <li key={r}>{r}</li>
      ))}
    </ul>
  )
}

export function U3ODemou() {
  return (
    <div className="strana strana--uvod" data-ekran="U3">
      <div className="strana-sadrzaj">
        <ZnakTerraVista klasa="strana-znak" />
        <h1>O ovom demou</h1>
        <div className="uvod-izbor">
          <section className="uvod-blok">
            <strong>Šta ovaj demo jeste</strong>
            <Lista stavke={DEMO_JESTE} />
          </section>
          <section className="uvod-blok">
            <strong>Šta nije</strong>
            <Lista stavke={DEMO_NIJE} />
          </section>
        </div>
        <section className="uvod-blok">
          <strong>Šta TerraVista namerno ne radi</strong>
          <Lista stavke={CRVENE_LINIJE} />
        </section>
        <section className="uvod-blok">
          <strong>Ilustrativne cene</strong>
          <p>
            {cena(CENE.kanalPoIzboru)} · {cena(CENE.paketZanr)} · {cena(CENE.paketZemlja)} mesečno. {CENE_NAPOMENA}
          </p>
        </section>
        <section className="uvod-blok">
          <strong>Likovi i kanal su izmišljeni</strong>
          <p>
            {lik('ana').ime}, {lik('nikola').ime} i {lik('sara').ime} {PREZIME_PORODICE}, urednica {lik('vesna').ime} i kanal „{FILMSKA_RIZNICA.naziv}“. {LIKOVI_NAPOMENA}
          </p>
        </section>
        <section className="uvod-blok" aria-label={prikaziLogotipe ? 'Izvori slika i logotipa' : 'Izvori slika'}>
          <strong>{prikaziLogotipe ? 'Izvori slika i logotipa' : 'Izvori slika'}</strong>
          {prikaziLogotipe && <p>Logotipi su samo prikaz, uz naziv kanala; žig ostaje vlasniku kanala, a status sa izvora nije dozvola vlasnika kanala.</p>}
          <ul className="tabla-lista">
            {(prikaziLogotipe ? LOGOTIPI : []).filter((l) => l.evidencija).map((l) => (
              <li key={l.id}>
                Logotip: {l.kanal} — {l.evidencija!.licencaSaStranice}
                {l.evidencija!.ogranicenja ? ` (${l.evidencija!.ogranicenja})` : ''} — {l.evidencija!.stranica}
              </li>
            ))}
            {SLIKE.map((s) => (
              <li key={s.id}>
                Slika programa: {s.autor} · {s.licenca} · {s.izvor}
              </li>
            ))}
          </ul>
        </section>
        <a className="strana-veza" href={`#${sastavi('U1')}`}>
          Nazad
        </a>
      </div>
    </div>
  )
}
