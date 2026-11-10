// P1. Player Home: uloga je namerno najmanja. Pozdrav, pločica "Your transfer: step N of 9", linija od 6 tačaka,
// "Your share" i "Your next deadline". Igrač vidi samo svoj udeo (5%, ukupno i po ratama), ne uslove dogovora (rate klubova, bonuse, sell-on, proviziju).
import { Chip } from '../../komponente/Chip'
import { DugmeLink } from '../../komponente/Dugme'
import { Ekran } from '../../komponente/Ekran'
import { Kartica, KpiPlocica, PlocicaPaznje } from '../../komponente/Kartica'
import { VremenskaLinija6 } from '../../komponente/Linije'
import { usePrica } from '../../prica/PricaProvider'
import { nazivKoraka } from '../../prica/koraci'
import { sledecaRadnja } from '../../prica/reducer'
import { celija } from '../../pravila/matrica'
import { gotovo, odbijeno, ponudaPrihvacena } from '../../pravila/izvedeno'
import { IGRAC_NEMA_PLACANJA, ISPLATA_UDELA, STA_IGRAC_VIDI } from '../../tekstovi/prica'
import { putZa } from '../../pravila/rute'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'
import { eur, pct } from '../../scenario/format'
import type { Pozicija } from '../../prica/tipovi'

/** Igračev sledeći rok, izražen rečima (samo ono što igrač sme da zna). */
function rokIgraca(poz: Pozicija): string {
  if (odbijeno(poz)) return 'Nothing due'
  if (poz.korak <= 3) return 'Nothing due yet'
  if (poz.korak === 4) return gotovo(poz, 'g3') ? 'Waiting for the other signatures' : `Sign by ${DATUM.potpisRok}`
  if (poz.korak <= 6) return 'Waiting for funds and registration'
  if (poz.korak === 7) return gotovo(poz, 'p1') ? `Next payment on ${DATUM.rata2}` : `First payment on ${DATUM.isplata}`
  if (poz.korak === 8) return gotovo(poz, 'f8') ? `Next payment on ${DATUM.rata3}` : `Installment 2 on ${DATUM.rata2}`
  return `Installment 3 was due on ${DATUM.rata3} and is delayed`
}

const radnjaPotpisa = { ekran: 'P5' as const, pazi: `You have 2 documents to sign by ${DATUM.potpisRok}` }

export default function P1Pocetna() {
  const { poz, zavrsenKorak } = usePrica()
  const p = pogled('player')
  const sl = sledecaRadnja(poz)
  // U koraku 4 igrač ima dokumenta za potpis čim korak počne (dugme na ekranu Documents čeka svoj red, pravilo 1.6)
  const zaPotpis = sl && sl.uloga === 'player' ? sl : poz.korak === 4 && !gotovo(poz, 'g3') ? radnjaPotpisa : undefined
  const c = celija(poz.korak, 'player', poz.grana)

  return (
    <Ekran id="P1" naslov={`Hello, ${p.igrac.ime1}`} podnaslov={`${p.stariKlub} → ${p.noviKlub}`}>
      <PlocicaPaznje
        varijanta={zaPotpis ? 'warn' : 'info'}
        ikona={zaPotpis ? 'pen' : 'info'}
        naslov={`Your transfer: step ${poz.korak} of 9 — ${nazivKoraka(poz.korak, poz.grana, 'naziv', 'player')}`}
        desno={zaPotpis ? <DugmeLink to={putZa(zaPotpis.ekran)} varijanta="primary" sm>Open documents</DugmeLink> : undefined}
      >
        <b>{zaPotpis ? zaPotpis.pazi : zavrsenKorak ? c.zavrsni : c.pocetni}</b>
      </PlocicaPaznje>

      <VremenskaLinija6 poz={poz} />

      <div className="grid g-1-1">
        {odbijeno(poz) ? (
          <KpiPlocica oznaka="Your share" vrednost="Not applicable" napomena={poz.korak <= 6 ? 'Registration not completed' : poz.korak === 7 ? 'The transfer did not go through' : 'The transfer is closed'} />
        ) : ponudaPrihvacena(poz) ? (
          <KpiPlocica oznaka="Your share" vrednost={eur(p.udeo.ukupno)} napomena={`${pct(p.udeo.pct)} of the transfer fee, paid to you from escrow`} />
        ) : (
          <KpiPlocica oznaka="Your share" vrednost="Not agreed yet" napomena={`${pct(p.udeo.pct)} of the transfer fee, calculated once the clubs agree`} />
        )}
        <KpiPlocica oznaka="Your next deadline" vrednost={<span style={{ fontSize: 16 }}>{rokIgraca(poz)}</span>} napomena={odbijeno(poz) ? `${IGRAC_NEMA_PLACANJA}.` : `Your share is ${ISPLATA_UDELA}.`} />
      </div>

      <Kartica naslov="What you see here" id="vidis">
        <p className="muted">
          {STA_IGRAC_VIDI} In this illustration, other parties see only the outcome of the medical. <Chip v="neutral" ikona="lock">Private by design</Chip>
        </p>
      </Kartica>
      <Kartica naslov="More" id="vise">
        <div className="btnrow">
          <DugmeLink to={putZa('P4')} varijanta="secondary">Medical</DugmeLink>
          <DugmeLink to={putZa('P8')} varijanta="secondary">Exceptions</DugmeLink>
        </div>
      </Kartica>
    </Ekran>
  )
}
