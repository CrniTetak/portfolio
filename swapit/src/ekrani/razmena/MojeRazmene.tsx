// X12 „Moje razmene i ponude“ (UX 6.5): tabovi Obaveštenja · Poslate ponude · Primljene ponude · Aktivne razmene i akcije · Završene.
// Sadržaj se izvodi iz stanja priče: šta je Ana poslala, šta je Marko primio, kada se pojavi lanac, kada je razmena obavljena.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../../demo/DemoProvider'
import { useStanjePrice } from '../../demo/useStanje'
import { KorisnikRed } from '../../komponente/KorisnikRed'
import { MalaStvar } from '../../komponente/MalaStvar'
import { Obavestenje } from '../../komponente/Obavestenje'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { broj, poeni } from '../../scenario/format'
import { LANAC, TRAZI_TEKST } from '../../scenario/prica'
import { AKCIJA_NAZIV, NAZIV_STATUSA, PERIOD_DANA } from '../../scenario/poslovno'
import { JAKNA_ID, PONUDE_JAKNA } from '../../scenario/slobodno'
import { REF_AKCIJA_PRIJAVA } from '../../scenario/strane'
import { ANA_ID, FIRMA_PO_ID, JOVANA_ID, KORISNIK_PO_ID, MARKO_ID, nadjiOglas, oglasPoId, POENI_BICIKL } from '../../scenario/svet'
import { drugaStrana, statusPonude } from '../../tokovi/operacije'
import { primljenePonude } from './Primljene'

type Tab = 'obavestenja' | 'poslate' | 'primljene' | 'aktivne' | 'zavrsene'
const TABOVI: { id: Tab; naziv: string }[] = [
  { id: 'obavestenja', naziv: 'Obaveštenja' },
  { id: 'poslate', naziv: 'Poslate ponude' },
  { id: 'primljene', naziv: 'Primljene ponude' },
  { id: 'aktivne', naziv: 'Aktivne razmene i akcije' },
  { id: 'zavrsene', naziv: 'Završene' },
]

type Stavka = { id: string; naslov: string; opis?: string; status?: string; akcije: { naziv: string; ekran: string; parametri?: Record<string, string>; glavna?: boolean }[]; poseban?: 'poeni'; od?: string }

export function X12() {
  const { ugao } = useEkran()
  const demo = useDemo()
  const navigate = useNavigate()
  const l = useLink()
  const { korak, grana, uradjeno, slobodno, tokovi, ja, s } = useStanjePrice()
  const [tab, setTab] = useState<Tab>('obavestenja')

  const sadrzaj: Record<Tab, Stavka[]> = { obavestenja: [], poslate: [], primljene: [], aktivne: [], zavrsene: [] }
  const ana = ugao === 'ana'
  const marko = ugao === 'marko'
  const lanacPrihvacen = uradjeno('6.jovana')
  const zavrsena = uradjeno('8.x11')
  const poenska = grana === 'poeni'

  if (ana) {
    if (korak >= 3 && !uradjeno('3.w4')) sadrzaj.obavestenja.push({ id: 'poklapanje', naslov: 'Pronađen oglas koji odgovara tvojoj želji', opis: `${TRAZI_TEKST['ana-ps2']}: oglas korisnika ${MARKO_ID}.`, akcije: [{ naziv: 'Pogledaj poklapanje', ekran: 'W4', glavna: true }] })
    if (uradjeno('5.x6'))
      sadrzaj.obavestenja.push({
        id: 'odbijena',
        naslov: MARKO_ID + ' je odbio tvoju ponudu',
        opis: `Traži: ${TRAZI_TEKST['markov-bicikl']}.`,
        akcije: [{ naziv: 'Vidi predlog lanca razmene', ekran: 'X13', glavna: true }],
        poseban: 'poeni',
      })
    if (uradjeno('6.jovana')) sadrzaj.obavestenja.push({ id: 'lanac', naslov: 'Lanac razmene je prihvaćen', opis: 'Dogovorite primopredaju.', akcije: [{ naziv: 'Idi na dogovor', ekran: 'X8', parametri: { razmena: 'lanac' }, glavna: true }] })
    if (uradjeno('4.x2')) sadrzaj.poslate.push({ id: 'ps2', naslov: 'PlayStation 2 sa igrama → dečji bicikl', opis: 'Ponuda korisniku ' + MARKO_ID + '.', status: uradjeno('5.x6') ? 'Odbijena' : 'Čeka odgovor', akcije: [{ naziv: 'Otvori', ekran: 'X3', parametri: { oglas: 'markov-bicikl' } }] })
  }
  if (marko) {
    if (uradjeno('4.x2') && !uradjeno('5.x6')) sadrzaj.obavestenja.push({ id: 'nova', naslov: 'Nova ponuda za tvoj dečji bicikl', opis: ANA_ID + ' nudi PlayStation 2 sa igrama.', akcije: [{ naziv: 'Pogledaj ponude', ekran: 'X4', parametri: { oglas: 'markov-bicikl' }, glavna: true }] })
    if (korak >= 3) sadrzaj.obavestenja.push({ id: 'poklapanje', naslov: 'Pronađen oglas koji odgovara tvojoj želji', opis: `${TRAZI_TEKST['markov-bicikl']}: oglas korisnika ${JOVANA_ID}.`, akcije: [{ naziv: 'Pogledaj poklapanje', ekran: 'W4', glavna: true }] })
    if (uradjeno('6.jovana')) sadrzaj.obavestenja.push({ id: 'lanac', naslov: 'Lanac razmene je prihvaćen', opis: 'Dobijaš udžbenike, daješ bicikl Ani.', akcije: [{ naziv: 'Idi na dogovor', ekran: 'X8', parametri: { razmena: 'lanac' }, glavna: true }] })
    if (!slobodno) for (const p of primljenePonude(uradjeno)) sadrzaj.primljene.push({ id: p.id, naslov: p.stvari.map((x) => x.naslov).join(', '), opis: `Ponuda korisnika ${p.od}.`, od: p.od, akcije: [{ naziv: 'Otvori', ekran: 'X5', parametri: { oglas: 'markov-bicikl', ponuda: p.id } }] })
  }
  // račva „za poene“ (6R–8R): poklon PlayStation 2 i bicikl za poene
  if (ana && poenska) {
    if (uradjeno('7R.jovana') && !uradjeno('7R.potvrdi')) sadrzaj.obavestenja.push({ id: 'zahtev-poklon', naslov: JOVANA_ID + ' traži tvoj poklon', opis: 'PlayStation 2 sa igrama.', akcije: [{ naziv: 'Otvori zahtev', ekran: 'W5', parametri: { oglas: 'ana-ps2' }, glavna: true }] })
    if (uradjeno('8R.uzmi') && !uradjeno('8R.x11')) sadrzaj.aktivne.push({ id: 'bicikl-poeni', naslov: 'Dečji bicikl za poene', opis: 'Davalac stvari: ' + MARKO_ID + '.', status: 'U toku', akcije: [{ naziv: 'Potvrdi primopredaju', ekran: 'X9', parametri: { razmena: 'lanac' }, glavna: true }] })
    if (uradjeno('7R.potvrdi') && !uradjeno('7R.prijem')) sadrzaj.aktivne.push({ id: 'poklon', naslov: 'Poklon: PlayStation 2 sa igrama', opis: 'Primalac: ' + JOVANA_ID + '. Čeka se potvrda prijema.', status: 'U toku', akcije: [{ naziv: 'Moji poeni', ekran: 'W1' }] })
    if (uradjeno('7R.prijem')) sadrzaj.zavrsene.push({ id: 'poklon', naslov: 'Poklon: PlayStation 2 sa igrama', opis: 'Primalac: ' + JOVANA_ID + '.', status: 'Poklonjeno', akcije: [{ naziv: 'Moji poeni', ekran: 'W1' }] })
    if (uradjeno('8R.x11')) sadrzaj.zavrsene.push({ id: 'bicikl-poeni', naslov: 'Dečji bicikl za poene', opis: 'Davalac stvari: ' + MARKO_ID + '.', status: 'Razmena obavljena', akcije: [{ naziv: 'Pogledaj', ekran: 'X10', parametri: { razmena: 'lanac' } }] })
  }
  if (marko && poenska) {
    if (korak === 6) sadrzaj.obavestenja.push({ id: 'ana-razmislja', naslov: ANA_ID + ' razmišlja da uzme tvoj bicikl za poene', opis: 'Bicikl je za poene, vrednost ' + poeni(POENI_BICIKL) + '.', akcije: [{ naziv: 'Pogledaj oglas', ekran: 'O1', parametri: { oglas: 'markov-bicikl' } }] })
    if (korak >= 7 && !uradjeno('8R.uzmi')) sadrzaj.obavestenja.push({ id: 'ana-uzima', naslov: ANA_ID + ' uzima bicikl za poene', opis: 'Ana je poklonila PlayStation 2 i skuplja poene.', akcije: [{ naziv: 'Pogledaj oglas', ekran: 'O1', parametri: { oglas: 'markov-bicikl' } }] })
    if (uradjeno('8R.uzmi') && !uradjeno('8R.x11')) {
      sadrzaj.obavestenja.push({ id: 'ana-uzela', naslov: ANA_ID + ' je uzela bicikl', opis: 'Za ovaj bicikl SWAPIT ti dodeljuje ' + poeni(POENI_BICIKL) + ' tek kad se prijem potvrdi.', akcije: [{ naziv: 'Potvrdi predaju', ekran: 'X9', parametri: { razmena: 'lanac' }, glavna: true }] })
      sadrzaj.aktivne.push({ id: 'bicikl-poeni', naslov: 'Dečji bicikl za poene', opis: 'Primalac stvari: ' + ANA_ID + '.', status: 'U toku', akcije: [{ naziv: 'Potvrdi predaju', ekran: 'X9', parametri: { razmena: 'lanac' }, glavna: true }] })
    }
    if (uradjeno('8R.x11')) sadrzaj.zavrsene.push({ id: 'bicikl-poeni', naslov: 'Dečji bicikl za poene', opis: 'Primalac stvari: ' + ANA_ID + '.', status: 'Razmena obavljena', akcije: [{ naziv: 'Pogledaj', ekran: 'X10', parametri: { razmena: 'lanac' } }] })
  }
  if (ugao === 'prodavnica' && uradjeno('9.z4')) sadrzaj.aktivne.push({ id: 'akcija', naslov: 'Akcija „' + AKCIJA_NAZIV + '“', opis: 'Prijave stižu na tablu akcija.', status: 'Aktivna', akcije: [{ naziv: 'Tabla akcija', ekran: 'A4', glavna: true }] })
  if (ana || marko) {
    if (lanacPrihvacen && !zavrsena) sadrzaj.aktivne.push({ id: 'lanac', naslov: 'Lanac razmene: PlayStation 2, udžbenici, dečji bicikl', opis: LANAC.map((v) => `${v.od} → ${v.ka}`).join(' · '), status: 'U toku', akcije: [{ naziv: 'Otvori dogovor', ekran: 'X8', parametri: { razmena: 'lanac' }, glavna: true }] })
    if (zavrsena) sadrzaj.zavrsene.push({ id: 'lanac', naslov: 'Lanac razmene: PlayStation 2, udžbenici, dečji bicikl', opis: LANAC.map((v) => `${v.od} → ${v.ka}`).join(' · '), status: 'Razmena obavljena', akcije: [{ naziv: 'Pogledaj', ekran: 'X10', parametri: { razmena: 'lanac' } }] })
  }

  // ---- slobodni tokovi: poslate i primljene ponude, razmene, zahtevi za poklon, prijava za akciju (isti izvor kao ekrani X1–X11, W5, A2)
  const imeStrane = (id: string): string => FIRMA_PO_ID[id]?.naziv ?? id
  const NAZIV_STATUSA_PONUDE = { ceka: 'Čeka odgovor', odbijena: 'Odbijena', prihvacena: 'Prihvaćena' } as const
  if (ja) {
    const mojiOglasi = new Set(s.oglasi.filter((o) => o.vlasnik === ja).map((o) => o.id))
    for (const p of tokovi.ponude.filter((x) => x.od === ja)) {
      const cilj = nadjiOglas(s, p.cilj, tokovi)
      sadrzaj.poslate.push({
        id: p.id,
        naslov: `${p.stvari.map((x) => x.naslov).join(', ')} → ${cilj?.naslov ?? p.cilj}`,
        opis: `Ponuda za oglas korisnika ${cilj ? imeStrane(cilj.vlasnik) : ''}.`,
        status: NAZIV_STATUSA_PONUDE[p.status],
        akcije: [p.status === 'prihvacena' ? { naziv: 'Otvori dogovor', ekran: 'X8', parametri: { razmena: p.id }, glavna: true } : { naziv: 'Otvori', ekran: 'X3', parametri: { oglas: p.cilj } }],
      })
    }
    for (const z of tokovi.zahtevi.filter((x) => x.od === ja)) {
      const o = nadjiOglas(s, z.oglas, tokovi)
      sadrzaj.poslate.push({ id: `zahtev-${z.oglas}`, naslov: `Zahtev za poklon: ${o?.naslov ?? z.oglas}`, opis: 'Čeka potvrdu vlasnika.', status: 'Čeka odgovor', akcije: [{ naziv: 'Otvori oglas', ekran: 'O1', parametri: { oglas: z.oglas } }] })
    }
    // primljene: u slobodnom režimu ponude Irene i Stefana stoje uz Markovu dečju jaknu; ponude drugog građanina na moje oglase stižu iz tokova
    const stigle = [
      ...(marko && slobodno ? PONUDE_JAKNA.map((p) => ({ id: p.id, cilj: JAKNA_ID, od: p.od, naslov: p.stvari.map((x) => x.naslov).join(', '), status: statusPonude(tokovi, p.id) })) : []),
      ...tokovi.ponude.filter((p) => mojiOglasi.has(p.cilj)).map((p) => ({ id: p.id, cilj: p.cilj, od: p.od, naslov: p.stvari.map((x) => x.naslov).join(', '), status: p.status })),
    ]
    for (const p of stigle) {
      sadrzaj.primljene.push({ id: p.id, naslov: p.naslov, opis: `Ponuda korisnika ${p.od} za ${nadjiOglas(s, p.cilj, tokovi)?.naslov ?? p.cilj}.`, status: NAZIV_STATUSA_PONUDE[p.status], od: p.od, akcije: [{ naziv: 'Otvori', ekran: 'X5', parametri: { oglas: p.cilj, ponuda: p.id } }] })
      if (p.status === 'ceka') sadrzaj.obavestenja.push({ id: `nova-${p.id}`, naslov: `Nova ponuda za ${nadjiOglas(s, p.cilj, tokovi)?.naslov ?? p.cilj}`, opis: `Ponuda korisnika ${p.od}.`, akcije: [{ naziv: 'Pogledaj ponude', ekran: 'X4', parametri: { oglas: p.cilj }, glavna: true }] })
    }
    for (const z of tokovi.zahtevi.filter((x) => mojiOglasi.has(x.oglas))) {
      const o = nadjiOglas(s, z.oglas, tokovi)
      sadrzaj.obavestenja.push({ id: `poklon-${z.oglas}-${z.od}`, naslov: `${z.od} traži tvoj poklon`, opis: o?.naslov, akcije: [{ naziv: 'Otvori zahtev', ekran: 'W5', parametri: { oglas: z.oglas }, glavna: true }] })
    }
    for (const r of tokovi.razmene.filter((x) => x.vlasnik === ja || x.od === ja)) {
      const naslov = r.tip === 'poeni' ? `Za poene: ${r.naslov}` : r.tip === 'poklon' ? `Poklon: ${r.naslov}` : `Razmena: ${r.naslov}`
      const druga = drugaStrana(r, ja)
      if (r.faza < 3) {
        const [naziv, ekran] = r.faza === 1 ? ['Otvori dogovor', 'X8'] : ['Potvrdi primopredaju', 'X9']
        sadrzaj.aktivne.push({ id: r.id, naslov, opis: `Druga strana: ${KORISNIK_PO_ID[druga]?.id ?? imeStrane(druga)}.`, status: r.faza === 1 ? 'Dogovor' : 'Primopredaja', akcije: [{ naziv, ekran, parametri: { razmena: r.id }, glavna: true }] })
      } else {
        sadrzaj.zavrsene.push({ id: r.id, naslov, opis: `Druga strana: ${KORISNIK_PO_ID[druga]?.id ?? imeStrane(druga)}.`, status: 'Razmena obavljena', akcije: [{ naziv: 'Pogledaj', ekran: 'X10', parametri: { razmena: r.id } }, ...(r.ocene.some((o) => o.autor === ja) ? [] : [{ naziv: 'Oceni razmenu', ekran: 'X11', parametri: { razmena: r.id }, glavna: true }])] })
      }
    }
    const prijavaAkcije = tokovi.prijaveAkcije.find((p) => p.k === ja)
    if (prijavaAkcije) {
      const red = s.akcija?.redovi.find((r) => r.korisnik === ja)
      sadrzaj.aktivne.push({ id: 'prijava-akcije', naslov: `Prijava za akciju „${AKCIJA_NAZIV}“`, opis: `Šifra prijave: ${REF_AKCIJA_PRIJAVA} · ${prijavaAkcije.stvar} · ${prijavaAkcije.termin}`, status: red ? NAZIV_STATUSA[red.status] : 'Čeka procenu', akcije: [{ naziv: 'Otvori prijavu', ekran: 'A3', parametri: { akcija: 'staro-za-novo' } }] })
    }
    // Prodavnica: zbirovi su isti izvor kao tabla firme (F3)
    if (ugao === 'prodavnica') {
      sadrzaj.primljene.push({ id: 'zbir-ponude', naslov: `Ponude u poslednjih ${PERIOD_DANA} dana: ${broj(s.zupcanik.ponude)}`, opis: 'Zbir sa table firme.', akcije: [{ naziv: 'Pregled rezultata', ekran: 'F6' }] })
      sadrzaj.zavrsene.push({ id: 'zbir-razmene', naslov: `Obavljene razmene: ${broj(s.zupcanik.obavljeneRazmene)}`, opis: 'Zbir sa table firme.', akcije: [{ naziv: 'Tabla firme', ekran: 'F3' }] })
    }
  }

  const prazno: Record<Tab, string> = {
    obavestenja: 'Nema novih obaveštenja.',
    poslate: 'Još nisi poslao/la nijednu ponudu.',
    primljene: 'Nema primljenih ponuda.',
    aktivne: 'Nema aktivnih razmena.',
    zavrsene: 'Nema završenih razmena.',
  }
  const lista = sadrzaj[tab]

  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="X12">
      <h1>Moje razmene i ponude</h1>
      <div className="tabovi" role="group" aria-label="Moje razmene i ponude">
        {TABOVI.map((t) => (
          <button key={t.id} type="button" aria-pressed={tab === t.id} className="tab" onClick={() => setTab(t.id)}>
            {t.naziv} ({broj(sadrzaj[t.id].length)})
          </button>
        ))}
      </div>
      <div role="group" aria-label="Sadržaj izabranog prikaza" className="stog-sm" data-tab-panel={tab}>
        {lista.length === 0 && <p className="prazno-stanje">{prazno[tab]}</p>}
        {lista.map((st) => (
          <article key={st.id} className="stavka" data-stavka={st.id}>
            <div className="stavka-glavna stog-sm">
              <h2>{st.naslov}</h2>
              {st.opis && <p className="pomocni-tekst">{st.opis}</p>}
              {st.status && (
                <p>
                  Status: <b>{st.status}</b>
                </p>
              )}
              {st.id === 'ps2' && <MalaStvar stvar={{ naslov: oglasPoId('ana-ps2')!.naslov, vrsta: 'roba', oglas: 'ana-ps2', ikonica: 'gamepad-2' }} />}
              {st.od && <KorisnikRed id={st.od} bezZnacki />}
              {st.poseban === 'poeni' && korak <= 5 && (
                <p className="pomocni-tekst">
                  Ili: <Znacka vrsta="poeni" vrednost={oglasPoId('markov-bicikl')!.vrednostPoena} />, ako nemaš šta da ponudiš.
                </p>
              )}
            </div>
            <div className="stavka-akcije">
              {st.akcije.map((a) => (
                <Veza key={a.naziv} ekran={a.ekran} parametri={a.parametri} className={`dugme ${a.glavna ? 'dugme-zeleno' : 'dugme-linija'}`}>
                  {a.naziv}
                </Veza>
              ))}
              {st.poseban === 'poeni' && korak <= 5 && (
                <button
                  type="button"
                  className="dugme dugme-linija"
                  onClick={() => {
                    // račva „za poene“: korak 6, grana poeni (isto što radi prekidač u traci priče)
                    demo.postavi({ korak: 6, n: 0, grana: 'poeni' })
                    navigate(l('O1', { oglas: 'markov-bicikl' }))
                    window.scrollTo(0, 0)
                  }}
                >
                  Uzmi bicikl za poene
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {ugao === 'prodavnica' && <Obavestenje>Ponude i akcije firme stižu sa table firme.</Obavestenje>}
    </section>
  )
}
