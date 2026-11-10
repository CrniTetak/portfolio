// X13 „Lanac razmene — predlog“ (UX 6.5). Korak 6: aplikacija povezuje liste želja troje ljudi; lanac nastaje samo ako sve troje prihvate.
// Ana klikne „Prihvati lanac“, a Marko i Jovana prihvataju odmah posle (automatske radnje); kad gleda Marko, Ana je prihvatila ranije.
import { ArrowDown, ArrowRight, Check } from 'lucide-react'
import { Fragment, useEffect, useRef, useState } from 'react'
import { useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { KorisnikRed } from '../../komponente/KorisnikRed'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { PravaPotrosaca } from '../../komponente/Obavestenja'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { Dijalog } from '../../okvir/Dijalozi'
import { useEkran } from '../../okvir/kontekst'
import { usePrica } from '../../okvir/prica'
import { LANAC } from '../../scenario/prica'
import { ANA_ID, JOVANA_ID, KORISNIK_PO_ID, MARKO_ID, oglasPoId } from '../../scenario/svet'

const PRIHVATIO: Record<string, string> = { [ANA_ID]: 'prihvatila', [MARKO_ID]: 'prihvatio', [JOVANA_ID]: 'prihvatila' }
const GLAVNA_RADNJA = { ana: '6.ana', marko: '6.marko' } as const

/** PK8: poruka pri prihvatanju lanca zavisi od ugla: kaže ko je još prihvatio (imena iz izvora, rod iz PRIHVATIO). */
export function porukaPrihvatanja(ugao: 'ana' | 'marko'): string {
  const ostali = [ANA_ID, MARKO_ID, JOVANA_ID].filter((id) => id !== (ugao === 'ana' ? ANA_ID : MARKO_ID))
  const imena = ostali.map((id) => KORISNIK_PO_ID[id].ime).join(' i ')
  const sveZenske = ostali.every((id) => PRIHVATIO[id] === 'prihvatila')
  return `Lanac je prihvaćen: ${imena} su prihvatil${sveZenske ? 'e' : 'i'}.`
}

/** Razmak između stanja „Ana prihvatila → Marko prihvatio → Jovana prihvatila → Lanac prihvaćen“ (ms). */
const KORAK_SEKVENCE_MS = 700
const CEKA_SE = ['', 'Čeka se Marko', 'Čeka se Jovana', 'Prihvaćeno']

export function X13() {
  const { ugao } = useEkran()
  const { korak, grana, uradjeno } = useStanjePrice()
  const prica = usePrica()
  // Jedan klik prihvata lanac za sve troje; kratka sekvenca stanja se vidi bez dodatnih klikova (faza 1–3, pa null = gotovo).
  const sviPrihvatili = uradjeno('6.jovana')
  const prethodno = useRef(sviPrihvatili)
  const [faza, setFaza] = useState<number | null>(null)
  const [odbijanje, setOdbijanje] = useState(false)
  useEffect(() => {
    if (!sviPrihvatili) {
      prethodno.current = false
      setFaza(null)
      return
    }
    if (prethodno.current) return
    prethodno.current = true
    setFaza(1)
    const t = [2, 3, null].map((f, i) => setTimeout(() => setFaza(f), (i + 1) * KORAK_SEKVENCE_MS))
    return () => t.forEach(clearTimeout)
  }, [sviPrihvatili])
  if (grana === 'poeni')
    return (
      <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="X13" data-bez-lanca>
        <h1>Lanac razmene</h1>
        <Obavestenje stanje="upozorenje">U račvi „za poene“ nema lanca razmene: Ana uzima bicikl za poene.</Obavestenje>
        <button type="button" className="dugme dugme-zeleno self-start" onClick={prica.glavniTok}>
          Nazad na glavni tok
        </button>
      </section>
    )
  if (korak < 5 || (korak === 5 && !uradjeno('5.x6')))
    return <JosNijePocelo naslov="Lanac razmene — predlog" opis="Kad Marko odbije ponudu, aplikacija spaja liste želja troje ljudi i predlaže lanac razmene." korak={6} />
  const korisnik = ugao === 'ana' ? ANA_ID : MARKO_ID
  const daje = LANAC.find((v) => v.od === korisnik)!
  const dobija = LANAC.find((v) => v.ka === korisnik)!
  const prihvatili: Record<string, boolean> =
    faza === null ? { [ANA_ID]: uradjeno('6.ana'), [MARKO_ID]: uradjeno('6.marko'), [JOVANA_ID]: uradjeno('6.jovana') } : { [ANA_ID]: faza >= 1, [MARKO_ID]: faza >= 2, [JOVANA_ID]: faza >= 3 }
  const svi = sviPrihvatili && faza === null
  const gleda = ugao === 'ana' || ugao === 'marko'
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X13">
      <h1>Lanac razmene — predlog</h1>
      <p>
        Nijedna strana nema tačno ono što druga traži, ali troje zajedno imaju. <Znacka vrsta="gradjanin" />
      </p>
      <PravaPotrosaca />
      <div className="lanac" data-lanac>
        {LANAC.map((v, i) => {
          const o = oglasPoId(v.oglas)!
          return (
            <Fragment key={v.oglas}>
              <div className="lanac-karta" data-ja={v.od === korisnik ? '1' : undefined} data-veza={v.oglas}>
                <KorisnikRed id={v.od} bezZnacki />
                {v.od === korisnik && <span className="sr-only">(ti)</span>}
                <p className="pomocni-tekst flex items-center gap-1">
                  daje <ArrowRight size={14} strokeWidth={1.75} aria-hidden /> {v.ka}
                </p>
                <MalaStvar stvar={{ naslov: o.naslov, vrsta: o.vrsta, oglas: o.id, ikonica: 'puzzle' }} />
              </div>
              {i < LANAC.length - 1 && (
                <span className="lanac-strelica" aria-hidden>
                  <ArrowRight size={28} strokeWidth={1.75} className="hidden min-[900px]:block" />
                  <ArrowDown size={28} strokeWidth={1.75} className="min-[900px]:hidden" />
                </span>
              )}
            </Fragment>
          )
        })}
      </div>
      <div className="dva-stupca dva-stupca-jednaka" data-sta-dobijas>
        <div className="kartica kartica-mirna stog-sm">
          <h2>Šta dobijaš</h2>
          <MalaStvar stvar={{ naslov: oglasPoId(dobija.oglas)!.naslov, vrsta: 'roba', oglas: dobija.oglas, ikonica: 'puzzle' }} />
          <p className="pomocni-tekst">Od korisnika {dobija.od}.</p>
        </div>
        <div className="kartica kartica-mirna stog-sm">
          <h2>Šta daješ</h2>
          <MalaStvar stvar={{ naslov: oglasPoId(daje.oglas)!.naslov, vrsta: 'roba', oglas: daje.oglas, ikonica: 'puzzle' }} />
          <p className="pomocni-tekst">Korisniku {daje.ka}.</p>
        </div>
      </div>
      <ul className="stog-sm" aria-label="Status učesnika" data-ucesnici>
        {LANAC.map((v) => (
          <li key={v.od} className="status-ucesnik" data-gotovo={prihvatili[v.od] ? '1' : undefined}>
            {prihvatili[v.od] ? <Check size={16} strokeWidth={2.5} aria-hidden /> : null}
            {v.od}: {prihvatili[v.od] ? PRIHVATIO[v.od] : 'čeka se'}
          </li>
        ))}
      </ul>
      <p className="pomocni-tekst">Lanac nastaje samo ako sve troje prihvate.</p>
      {/* P-S2: JEDAN stalni status sa porukama po fazama (lista učesnika nema aria-live) */}
      <p className="sr-only" role="status" data-status-lanca>
        {faza !== null ? CEKA_SE[faza] : svi ? 'Lanac prihvaćen — sve troje.' : ''}
      </p>
      {svi ? (
        <div className="stog-sm" data-lanac-prihvacen>
          <Obavestenje stanje="uspeh">
            <b>Lanac prihvaćen</b> — sve troje. Dogovorite primopredaju.
          </Obavestenje>
          <Veza ekran="X8" parametri={{ razmena: 'lanac' }} className="dugme dugme-zeleno self-start">
            Idi na dogovor
          </Veza>
        </div>
      ) : faza !== null ? (
        <p className="pomocni-tekst" data-sekvenca={faza}>
          {CEKA_SE[faza]}
        </p>
      ) : (
        gleda && (
          <div className="red-dugmad">
            <RadnjaDugme id={GLAVNA_RADNJA[ugao as 'ana' | 'marko']} poruka={porukaPrihvatanja(ugao as 'ana' | 'marko')}>
              Prihvati lanac
            </RadnjaDugme>
            <button type="button" className="dugme dugme-tekst" onClick={() => setOdbijanje(true)}>
              Odbij
            </button>
          </div>
        )
      )}
      {/* N9: „Odbij“ pokazuje ishod: u priči sve troje prihvataju, pa se odbijanje vraća */}
      {odbijanje && (
        <Dijalog naslov="Lanac otkazan" onZatvori={() => setOdbijanje(false)}>
          <p className="mb-4">Da odbiješ, lanac bi bio otkazan. U priči sve troje prihvataju lanac, pa se odbijanje ne primenjuje.</p>
          <button type="button" className="dugme dugme-zeleno" data-prvi-fokus onClick={() => setOdbijanje(false)}>
            Vrati
          </button>
        </Dijalog>
      )}
    </section>
  )
}
