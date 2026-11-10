// V1 Tabla vlasnice kanala (Vesna) i M1 Tabla platforme (talas 2). Sve brojke su izmišljene i nepromenljive (isto u svim koracima).
// Kanal vlasnice je IZMIŠLJEN; pregled prava je po delu i zemlji (ne po pravom kanalu), uz „(primer)“.
import { ZnakTerraVista } from '../../komponente/tv/ZnakTerraVista'
import { broj, cenaBezCenti, postotakOd, procenat } from '../../podaci/format'
import { NEDOSTUPNO } from '../../podaci/stalni-tekstovi'
import { useMedia } from '../../okvir/useMedia'
import {
  DELOVI,
  FILMSKA_RIZNICA,
  GLEDANOST,
  MERILA_PILOTA,
  PLAN_TRZISTA,
  PODELA_KANALA,
  PRAVA_KANALA,
  PRIHOD_PO_DELOVIMA,
  PRIHOD_KANALA,
  SERVISI,
  ZEMLJE,
  lik,
  matricaPrava,
  udeo,
} from '../../podaci/svet'
import { useDemo } from '../../okvir/stanje'

const NAZIV_DELA: Record<string, string> = { besplatni: 'Besplatni kanali (reklame)', 'po-izboru': 'Kanali po izboru', paket: 'Paketi' }
const KRATKO_DELA: Record<string, string> = { besplatni: 'Besplatni', 'po-izboru': 'Po izboru', paket: 'Paketi' }
const STANJA = { obezbedjeno: 'Obezbeđeno (primer)', delimicno: 'Delimično obezbeđeno (primer)', nije: 'Nije obezbeđeno (primer)' }

function NazadNaPricu() {
  const d = useDemo()
  return (
    <div className="tabla-dugme">
      <button type="button" className="strana-veza" onClick={d.vratiGledaoca}>
        Nazad na priču
      </button>
    </div>
  )
}

export function V1Tabla() {
  const najvise = Math.max(...Object.values(GLEDANOST))
  return (
    <div className="tabla" data-ekran="V1">
      <div className="tabla-zaglavlje">
        <h1>
          {lik('vesna').ime} · urednica kanala „{FILMSKA_RIZNICA.naziv}“ (izmišljen kanal)
        </h1>
        <ZnakTerraVista klasa="strana-znak" />
      </div>
      <div className="tabla-mreza">
        <section className="tabla-blok">
          <h2>Gledanost po zemljama</h2>
          {ZEMLJE.map((z) => (
            <div key={z.kod} className="stubic-red">
              <span>{z.naziv}</span>
              <span className="stubic-staza">
                <span className="stubic" style={{ display: 'block', width: PRAVA_KANALA[z.kod] ? `${postotakOd(GLEDANOST[z.kod], najvise)}%` : '0%' }} />
              </span>
              {/* zemlja bez prava: nema gledanosti (crtica, ne broj) */}
              <span>{PRAVA_KANALA[z.kod] ? (
                  broj(GLEDANOST[z.kod])
                ) : (
                  <>
                    <span aria-hidden="true">—</span>
                    <span className="sr-only">Nema gledanosti. {NEDOSTUPNO}</span>
                  </>
                )}</span>
            </div>
          ))}
          <p className="meta">gledalaca mesečno (primer)</p>
        </section>
        <section className="tabla-blok">
          <h2>Prihod od reklama</h2>
          <p className="tabla-iznos">{cenaBezCenti(PRIHOD_KANALA)} mesečno (primer)</p>
          <p>Kanal dobija {procenat(PODELA_KANALA)} prihoda od reklama na svom kanalu (primer).</p>
        </section>
        <section className="tabla-blok">
          <h2>Zemlje sa pravima</h2>
          <ul className="tabla-lista">
            {ZEMLJE.map((z) => (
              <li key={z.kod}>
                {z.naziv}: <span className={PRAVA_KANALA[z.kod] ? 'stanje-obezbedjeno' : 'stanje-nije'}>{PRAVA_KANALA[z.kod] ? STANJA.obezbedjeno : STANJA.nije}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <p className="tabla-napomena">Sve brojke su izmišljene; „{FILMSKA_RIZNICA.naziv}“ nije stvaran kanal.</p>
      <NazadNaPricu />
    </div>
  )
}

export function M1Platforma() {
  const matrica = matricaPrava()
  const usko = useMedia('(max-width: 720px)')
  const klasa = (st: string) => `stanje-${st === 'obezbedjeno' ? 'obezbedjeno' : st === 'delimicno' ? 'delimicno' : 'nije'}`
  return (
    <div className="tabla" data-ekran="M1">
      <div className="tabla-zaglavlje">
        <h1>Tim platforme</h1>
        <ZnakTerraVista klasa="strana-znak" />
      </div>
      <div className="tabla-mreza">
        <section className="tabla-blok">
          <h2>Prihod po delovima (primer)</h2>
          {DELOVI.map((deo) => (
            <div key={deo} className="stubic-red">
              <span>{KRATKO_DELA[deo]}</span>
              <span className="stubic-staza">
                <span className="stubic" style={{ display: 'block', width: `${Math.round(udeo(deo))}%` }} />
              </span>
              <span>
                {cenaBezCenti(PRIHOD_PO_DELOVIMA[deo])} · {procenat(Math.round(udeo(deo)))}
              </span>
            </div>
          ))}
        </section>
        <section className="tabla-blok tabla-blok--siroko" tabIndex={0} aria-label="Pregled prava po delu i zemlji">
          <h2>Pregled prava (po delu i zemlji)</h2>
          {usko ? (
            <table className="matrica">
              <thead>
                <tr>
                  <th scope="col">Zemlja</th>
                  {DELOVI.map((deo) => (
                    <th key={deo} scope="col">
                      {KRATKO_DELA[deo]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ZEMLJE.map((z) => (
                  <tr key={z.kod}>
                    <th scope="row">{z.naziv}</th>
                    {DELOVI.map((deo) => (
                      <td key={deo} className={klasa(matrica[deo][z.kod])}>
                        {STANJA[matrica[deo][z.kod]]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
          <table className="matrica">
            <thead>
              <tr>
                <th scope="col">Deo</th>
                {ZEMLJE.map((z) => (
                  <th key={z.kod} scope="col">
                    {z.naziv}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DELOVI.map((deo) => (
                <tr key={deo}>
                  <th scope="row">{NAZIV_DELA[deo]}</th>
                  {ZEMLJE.map((z) => {
                    const st = matrica[deo][z.kod]
                    return (
                      <td key={z.kod} className={`stanje-${st === 'obezbedjeno' ? 'obezbedjeno' : st === 'delimicno' ? 'delimicno' : 'nije'}`}>
                        {STANJA[st]}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </section>
        <section className="tabla-blok">
          <h2>Servisi za besplatne kanale</h2>
          <ul className="tabla-lista">
            {SERVISI.map((s) => (
              <li key={s}>{s}: poslato (prikaz)</li>
            ))}
          </ul>
        </section>
        <section className="tabla-blok">
          <h2>Plan tržišta</h2>
          <ol className="tabla-lista">
            {PLAN_TRZISTA.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ol>
          <h2>Merila pilota</h2>
          <ul className="tabla-lista">
            {MERILA_PILOTA.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </section>
      </div>
      <NazadNaPricu />
    </div>
  )
}
