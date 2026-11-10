// Telefonski ekrani talasa 2: P6 Paketi, P7 Stranica paketa, P11 Uređaji, P12 Računi, P13 Račun, P14 Nalog, P15 Jezik, P16 Pomoć, P17 Uslovi.
import { useState } from 'react'
import { ChevronRight } from '../../okvir/Ikone'
import { useDemo } from '../../okvir/stanje'
import { useToast } from '../../okvir/Toast'
import { PlocicaLogotipa } from '../../komponente/tv/PlocicaLogotipa'
import { TelOkvir } from '../../komponente/tel/TelOkvir'
import { cena, cenaMesecno, datum } from '../../podaci/format'
import { CENA_ZAVISI_OD_ZEMLJE, JEZIK_PORUKA, SIMULIRANA_RADNJA } from '../../podaci/stalni-tekstovi'
import { PAKETI, PREZIME_PORODICE, RACUNI, UREDJAJI, ZEMLJE, dostupan, lik, paket, pdvUCeni, proizvod, racun, zemlja, cenaPaketa } from '../../podaci/svet'
import { POMOC } from '../../tekstovi/pomoc'
import { USLOVI_NACRT_NAPOMENA, USLOVI_ODELJCI } from '../../tekstovi/o-demou'
import { sastavi, type Parametri } from '../../pravila/ekrani'

type Svojstva = { parametri: Parametri }

export function P6Paketi() {
  const d = useDemo()
  const grupa = (vrsta: 'zemlja' | 'zanr', naslov: string) => (
    <div className="tel-kartica">
      <strong>{naslov}</strong>
      {PAKETI.filter((p) => p.vrsta === vrsta).map((p) => (
        <button key={p.id} type="button" className="tel-pitanje" onClick={() => d.idiTel(sastavi('P7', { id: p.id }))}>
          <span>
            {p.naziv}
            <br />
            <span className="tel-napomena">
              {cenaMesecno(cenaPaketa(p))}
              {d.pretplate.paketi.includes(p.id) ? ' · Pretplaćen' : ''}
            </span>
          </span>
          <span className="tel-logotipi">
            {p.kanali.map((k) => (
              <PlocicaLogotipa key={k.id} kanalId={k.id} velicina="mala" />
            ))}
          </span>
        </button>
      ))}
    </div>
  )
  return (
    <TelOkvir id="P6" naslov="Paketi" nazadNa={sastavi('P1')} napomena={CENA_ZAVISI_OD_ZEMLJE}>
      {grupa('zemlja', 'Po zemlji')}
      {grupa('zanr', 'Po žanru')}
    </TelOkvir>
  )
}

export function P7Paket({ parametri }: Svojstva) {
  const d = useDemo()
  const p = paket(parametri.id)
  const pretplacen = d.pretplate.paketi.includes(p.id)
  const radi = ZEMLJE.filter((z) => p.kanali.every((k) => dostupan(k, z.kod))).map((z) => z.naziv)
  return (
    <TelOkvir id="P7" naslov={p.naziv} nazadNa={sastavi('P6')}>
      <div className="tel-kartica">
        <p className="tel-cena">{cenaMesecno(cenaPaketa(p))}</p>
        <p className="tel-napomena">{CENA_ZAVISI_OD_ZEMLJE}</p>
        {p.kanali.map((k) => (
          <div key={k.id} className="tel-red">
            <PlocicaLogotipa kanalId={k.id} velicina="mala" />
            <span className="tel-napomena">Uživo · gledanje unazad: {k.gledanjeUnazad ? 'da' : 'ne'} (primer)</span>
          </div>
        ))}
        <p className="tel-napomena">Radi u: {radi.join(', ')} (primer)</p>
      </div>
      <button
        type="button"
        className="tel-dugme"
        disabled={pretplacen}
        onClick={() => d.idiTel(sastavi('P3', { proizvod: p.id }))}
      >
        {pretplacen ? 'Pretplaćen' : 'Pretplati se'}
      </button>
    </TelOkvir>
  )
}

export function P11Uredjaji() {
  const { pokazi } = useToast()
  return (
    <TelOkvir id="P11" naslov="Uređaji" nazadNa={sastavi('P14')}>
      <div className="tel-kartica">
        {UREDJAJI.map((u) => (
          <div key={u.id} className="tel-red tel-red--razmak">
            <span>{u.naziv}</span>
            <button type="button" className="tel-veza" onClick={() => pokazi(SIMULIRANA_RADNJA)}>
              Odjavi
            </button>
          </div>
        ))}
        <p className="tel-napomena">2 od 3 uređaja (primer)</p>
      </div>
    </TelOkvir>
  )
}

export function P12Racuni() {
  const d = useDemo()
  // računi prate priču: prikazuju se samo za ono na šta je nalog trenutno pretplaćen
  const prikazani = RACUNI.filter((r) => d.pretplate.kanali.includes(r.proizvod) || d.pretplate.paketi.includes(r.proizvod))
  return (
    <TelOkvir id="P12" naslov="Računi" nazadNa={sastavi('P14')} napomena="Računi su prikaz.">
      {prikazani.length === 0 && <p className="tel-napomena">Još nema računa (primer).</p>}
      <ul className="tel-lista">
        {prikazani.map((r) => {
          const p = proizvod(r.proizvod)!
          return (
            <li key={r.id}>
              <button type="button" onClick={() => d.idiTel(sastavi('P13', { id: r.id }))}>
                <span>
                  {r.id} · {p.naziv}
                  <br />
                  <span className="tel-napomena">
                    {datum(r.datum)} · {cena(p.cena)}
                  </span>
                </span>
                <ChevronRight className="ic" aria-hidden="true" />
              </button>
            </li>
          )
        })}
      </ul>
    </TelOkvir>
  )
}

export function P13Racun({ parametri }: Svojstva) {
  const { pokazi } = useToast()
  const d = useDemo()
  const r = racun(parametri.id)
  const p = proizvod(r.proizvod)!
  const pdv = pdvUCeni(p.cena)
  return (
    <TelOkvir id="P13" naslov={`Račun ${r.id}`} nazadNa={sastavi('P12')}>
      <div className="tel-kartica">
        <p className="tel-napomena">{datum(r.datum)}</p>
        <div className="tel-red tel-red--razmak">
          <span>{p.naziv}</span>
          <span>{cena(p.cena - pdv)}</span>
        </div>
        <div className="tel-red tel-red--razmak">
          <span>PDV (primer)</span>
          <span>{cena(pdv)}</span>
        </div>
        <div className="tel-red tel-red--razmak">
          <strong>Ukupno sa PDV-om</strong>
          <strong>{cena(p.cena)}</strong>
        </div>
        <p className="tel-napomena">Zemlja kupca: {zemlja(d.zemlja).naziv}</p>
      </div>
      <button type="button" className="tel-dugme tel-dugme--sporedno" onClick={() => pokazi(SIMULIRANA_RADNJA)}>
        Preuzmi račun (prikaz)
      </button>
    </TelOkvir>
  )
}

export function P14Nalog() {
  const d = useDemo()
  const glavni = lik('ana')
  const red = (naziv: string, cilj: string, vrednost = '') => (
    <li key={naziv}>
      <button type="button" onClick={() => d.idiTel(cilj)}>
        <span>{naziv}</span>
        <span className="tel-napomena">{vrednost}</span>
      </button>
    </li>
  )
  return (
    <TelOkvir id="P14" naslov="Moj nalog" nazadNa={sastavi('P1')}>
      <div className="tel-kartica">
        <strong>
          {glavni.ime} {PREZIME_PORODICE} (demo)
        </strong>
        <p className="tel-napomena">{zemlja(d.zemlja).naziv}</p>
      </div>
      <ul className="tel-lista">
        {red('Uređaji', sastavi('P11'))}
        {red('Računi', sastavi('P12'))}
        {red('Jezik', sastavi('P15'), 'Srpski')}
        {red('Pomoć', sastavi('P16'))}
      </ul>
      <label className="tel-prekidac">
        <input type="checkbox" checked={d.sloj.obavestenja} onChange={() => d.podesavanje({ obavestenja: !d.sloj.obavestenja })} />
        <span>Obaveštenja: {d.sloj.obavestenja ? 'uključeno' : 'isključeno'}</span>
      </label>
      <p className="tel-napomena">Roditeljska zaštita: {d.sloj.roditeljska ? 'uključena' : 'isključena'} (podešava se na televizoru)</p>
      <button type="button" className="tel-dugme tel-dugme--sporedno" onClick={() => d.idiTel(sastavi('P1'))}>
        Odjavi se
      </button>
      <p className="tel-napomena">Demo — ostaješ prijavljen</p>
    </TelOkvir>
  )
}

export function P15Jezik() {
  const [poruka, setPoruka] = useState('')
  const jezici = ['Srpski', 'Nemački', 'Engleski']
  return (
    <TelOkvir id="P15" naslov="Jezik" nazadNa={sastavi('P14')} napomena={poruka}>
      <ul className="tel-lista">
        {jezici.map((j, i) => (
          <li key={j}>
            <button type="button" aria-describedby={i > 0 ? 'tel-napomena' : undefined} onClick={() => setPoruka(i === 0 ? '' : JEZIK_PORUKA)}>
              <span>{j}</span>
              <span className="tel-napomena">{i === 0 ? '(izabran)' : ''}</span>
            </button>
          </li>
        ))}
      </ul>
    </TelOkvir>
  )
}

export function P16Pomoc() {
  const [otvoreno, setOtvoreno] = useState<string | null>(null)
  return (
    <TelOkvir id="P16" naslov="Pomoć" nazadNa={sastavi('P14')}>
      {POMOC.map((p) => (
        <div key={p.id}>
          <button type="button" className="tel-pitanje" aria-expanded={otvoreno === p.id} onClick={() => setOtvoreno(otvoreno === p.id ? null : p.id)}>
            {p.pitanje}
          </button>
          {otvoreno === p.id && <p className="tel-odgovor">{p.odgovor}</p>}
        </div>
      ))}
      <p className="tel-napomena">Kontakt: podrška (demo, bez slanja)</p>
    </TelOkvir>
  )
}

export function P17Uslovi({ parametri }: Svojstva) {
  return (
    <TelOkvir id="P17" naslov="Uslovi pretplate (nacrt)" nazadNa={sastavi('P3', { proizvod: parametri.proizvod })}>
      <p className="tel-napomena">{USLOVI_NACRT_NAPOMENA}</p>
      {USLOVI_ODELJCI.map((o) => (
        <div key={o.naslov} className="tel-kartica">
          <strong>{o.naslov}</strong>
          <p>{o.tekst}</p>
        </div>
      ))}
    </TelOkvir>
  )
}
