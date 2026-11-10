// Telefonski ekrani talasa 1: P1 Početna, P2 Prijava preko QR koda, P3 Pregled narudžbe, P4 Plaćanje (demo), P5 Pretplata aktivna,
// P8 Moje pretplate, P9 Potvrda otkaza, P10 Otkazano. Telefon se upravlja samo klikom/dodirom. Nema nijednog polja za kucanje
// (samo kvačice); kartica je prikaz-polje. Dugmad koja su radnje priče nose data-radnja.
import { useState } from 'react'
import { Check, CreditCard } from '../../okvir/Ikone'
import { useAkcija } from '../../okvir/akcija'
import { useDemo } from '../../okvir/stanje'
import { PlocicaLogotipa } from '../../komponente/tv/PlocicaLogotipa'
import { TelOkvir } from '../../komponente/tel/TelOkvir'
import { cena, cenaMesecno } from '../../podaci/format'
import { CENA_ZAVISI_OD_ZEMLJE, SA_PDV } from '../../podaci/stalni-tekstovi'
import { DEMO_KODOVI, NAZIV_TELEVIZORA_NA_TELEFONU, PAKET_PRICE, UREDJAJI, lik, pdvUCeni, proizvod, type Proizvod } from '../../podaci/svet'
import { razumemStiklirano } from '../../prica/navigacija'
import { sastavi, type Parametri } from '../../pravila/ekrani'
import { useTvRuta } from '../../tv-navigacija/ruta'

type Svojstva = { parametri: Parametri }

function Logotipi({ p }: { p: Proizvod }) {
  return (
    <span className="tel-logotipi">
      {p.kanali.map((k) => (
        <PlocicaLogotipa key={k.id} kanalId={k.id} velicina="mala" />
      ))}
    </span>
  )
}

function useAktivne(): Proizvod[] {
  const d = useDemo()
  return [...d.pretplate.kanali, ...d.pretplate.paketi].map((id) => proizvod(id)!).filter(Boolean)
}

export function P1Pocetna() {
  const d = useDemo()
  const aktivne = useAktivne()
  return (
    <TelOkvir id="P1" naslov="Početna telefona">
      <h2 className="tel-pozdrav">Zdravo, {lik('ana').ime} (demo)</h2>
      <div className="tel-kartica">
        <strong>Tvoje pretplate</strong>
        {aktivne.length === 0 ? (
          <p className="tel-napomena">Nemaš plaćenih pretplata</p>
        ) : (
          aktivne.map((p) => (
            <div key={p.id} className="tel-red">
              <Logotipi p={p} />
              <span>
                {p.naziv}
                <br />
                <span className="tel-napomena">{cenaMesecno(p.cena)}</span>
              </span>
            </div>
          ))
        )}
      </div>
      <div className="tel-kartica">
        <strong>Povezani uređaji</strong>
        {UREDJAJI.map((u) => (
          <p key={u.id} className="tel-napomena">
            {u.naziv}
          </p>
        ))}
      </div>
      <button type="button" className="tel-dugme" onClick={() => d.idiTel(sastavi('P6'))}>
        Pogledaj pakete
      </button>
      <button type="button" className="tel-dugme tel-dugme--sporedno" onClick={() => d.idiTel(sastavi('P8'))}>
        Moje pretplate
      </button>
      <p className="tel-napomena">{CENA_ZAVISI_OD_ZEMLJE}</p>
    </TelOkvir>
  )
}

export function P2Prijava({ parametri }: Svojstva) {
  const akcija = useAkcija('tel')
  const d = useDemo()
  // Proizvod koji se kupuje stiže iz adrese (T13 ga prosleđuje): P2 nikad ne „pretpostavlja“ Doma TV.
  const proizvodId = parametri.proizvod
  return (
    <TelOkvir id="P2" naslov="Poveži televizor" nazadNa={sastavi('P1')} napomena="Bez lozinke — demo.">
      <div className="tel-kartica">
        <p>Prepoznat je televizor: {NAZIV_TELEVIZORA_NA_TELEFONU}</p>
        <p className="tel-napomena">Prijava kao: {lik('ana').ime} {lik('ana').prezime}</p>
      </div>
      <button
        type="button"
        className="tel-dugme"
        data-radnja="nastavi-kao-ana"
        onClick={() => akcija('nastavi-kao-ana', () => d.idiTel(sastavi('P3', { proizvod: proizvodId })), { proizvod: proizvodId })}
      >
        Nastavi kao {lik('ana').ime}
      </button>
    </TelOkvir>
  )
}

export function P3Narudzba({ parametri }: Svojstva) {
  const akcija = useAkcija('tel')
  const d = useDemo()
  const p = proizvod(parametri.proizvod)!
  const [razumem, setRazumem] = useState(razumemStiklirano(d.pozicija, d.grana))
  return (
    <TelOkvir id="P3" naslov="Pregled" nazadNa={sastavi('P1')}>
      <div className="tel-kartica">
        <div className="tel-red">
          <Logotipi p={p} />
          <span>
            <strong>{p.naziv}</strong>
            <br />
            <span className="tel-napomena">{p.vrsta === 'paket' ? 'Paket' : 'Kanal po izboru'}</span>
          </span>
        </div>
        <p className="tel-cena">{cenaMesecno(p.cena)}</p>
        <p className="tel-napomena">
          {SA_PDV} {CENA_ZAVISI_OD_ZEMLJE}
        </p>
        <ul className="tel-lista-kvacica">
          <li>
            <Check className="ic" aria-hidden="true" /> Pretplata počinje odmah
          </li>
          <li>
            <Check className="ic" aria-hidden="true" /> Otkaz bilo kad
          </li>
        </ul>
      </div>
      <div className="tel-kartica">
        <strong>Uslovi i odustanak (primer)</strong>
        <p className="tel-napomena">Uslovi pretplate i odustanak su u nacrtu (primer).</p>
        <button type="button" className="tel-veza" onClick={() => d.idiTel(sastavi('P17', { proizvod: p.id }))}>
          Uslovi i odustanak
        </button>
      </div>
      <label className="tel-kvacica">
        <input
          type="checkbox"
          checked={razumem}
          data-radnja="razumem"
          onChange={(e) => {
            setRazumem(e.target.checked)
            if (e.target.checked) akcija('razumem', () => {}, { proizvod: p.id })
          }}
        />
        <span>Razumem uslove pretplate (primer)</span>
      </label>
      {!razumem && <p className="tel-napomena">Štikliraj „Razumem“ da nastaviš.</p>}
      <button
        type="button"
        className="tel-dugme"
        disabled={!razumem}
        data-radnja="na-placanje"
        onClick={() => akcija('na-placanje', () => d.idiTel(sastavi('P4', { proizvod: p.id })), { proizvod: p.id })}
      >
        Nastavi na plaćanje
      </button>
      <button type="button" className="tel-dugme tel-dugme--sporedno" onClick={() => d.idiTel(sastavi('P1'))}>
        Odustani
      </button>
    </TelOkvir>
  )
}

export function P4Placanje({ parametri }: Svojstva) {
  const akcija = useAkcija('tel')
  const d = useDemo()
  const p = proizvod(parametri.proizvod)!
  const pdv = pdvUCeni(p.cena)
  return (
    <TelOkvir id="P4" naslov="Plaćanje" nazadNa={sastavi('P3', { proizvod: p.id })} napomena="Demo — ništa se ne naplaćuje">
      <div className="tel-prikaz-polje">
        <CreditCard className="ic" aria-hidden="true" />
        <span>{DEMO_KODOVI.kartica}</span>
        <span className="tel-oznaka">samo prikaz</span>
      </div>
      <div className="tel-kartica">
        <div className="tel-red tel-red--razmak">
          <strong>{p.naziv}</strong>
          <span>mesečno</span>
        </div>
        <div className="tel-red tel-red--razmak">
          <span>Iznos bez PDV-a</span>
          <span>{cena(p.cena - pdv)}</span>
        </div>
        <div className="tel-red tel-red--razmak">
          <span>PDV (primer)</span>
          <span>{cena(pdv)}</span>
        </div>
        <div className="tel-red tel-red--razmak">
          <strong>Ukupno</strong>
          <strong>{cena(p.cena)}</strong>
        </div>
      </div>
      <button
        type="button"
        className="tel-dugme"
        data-radnja="plati"
        onClick={() =>
          akcija(
            'plati',
            () => {
              d.operacija('pretplati', p.id)
              d.idiTel(sastavi('P5', { proizvod: p.id }))
            },
            { proizvod: p.id },
          )
        }
      >
        Pretplati se
      </button>
    </TelOkvir>
  )
}

export function P5Aktivno({ parametri }: Svojstva) {
  const akcija = useAkcija('tel')
  const d = useDemo()
  const { idi } = useTvRuta()
  const p = proizvod(parametri.proizvod)!
  return (
    <TelOkvir id="P5" naslov="Pretplata">
      <div className="tel-potvrda">
        <span className="tel-krug">
          <Check className="ic" aria-hidden="true" strokeWidth={3} />
        </span>
        <h2>Pretplata je aktivna</h2>
        <p>
          {p.naziv} · {cenaMesecno(p.cena)}
        </p>
        <p className="tel-napomena">Otkaz bilo kad: Moje pretplate</p>
      </div>
      <button
        type="button"
        className="tel-dugme"
        data-radnja="vrati-na-tv"
        onClick={() =>
          akcija(
            'vrati-na-tv',
            () => {
              d.postaviUredjaj('tv')
              idi(sastavi(p.vrsta === 'paket' ? 'T16' : 'T14', { id: p.id }))
            },
            { proizvod: p.id },
          )
        }
      >
        Vrati se na televizor
      </button>
      <button type="button" className="tel-dugme tel-dugme--sporedno" onClick={() => d.idiTel(sastavi('P8'))}>
        Moje pretplate
      </button>
    </TelOkvir>
  )
}

export function P8Pretplate() {
  const akcija = useAkcija('tel')
  const d = useDemo()
  const aktivne = useAktivne()
  return (
    <TelOkvir id="P8" naslov="Moje pretplate" nazadNa={sastavi('P1')}>
      {aktivne.length === 0 ? (
        <p>Nemaš plaćenih pretplata. Besplatni kanali rade bez pretplate.</p>
      ) : (
        aktivne.map((p) => (
          <div key={p.id} className="tel-kartica">
            <div className="tel-red">
              <Logotipi p={p} />
              <span>
                <strong>{p.naziv}</strong>
                <br />
                <span className="tel-napomena">
                  {p.vrsta === 'paket' ? 'Paket' : 'Kanal'} · {cenaMesecno(p.cena)}
                </span>
              </span>
            </div>
            <p className="tel-napomena">Sledeće plaćanje: kraj meseca (primer)</p>
          </div>
        ))
      )}
      <button type="button" className="tel-dugme tel-dugme--otkaz" data-radnja="otkazi-ugovore" onClick={() => akcija('otkazi-ugovore', () => d.idiTel(sastavi('P9')), { proizvod: PAKET_PRICE.id })}>
        Verträge hier kündigen
        <small>Otkaži ugovore ovde</small>
      </button>
    </TelOkvir>
  )
}

export function P9Otkaz() {
  const d = useDemo()
  const aktivne = useAktivne()
  // Unapred je izabran samo „Paket Srbija“ (izbor stavke, nije saglasnost).
  const [izabrane, setIzabrane] = useState<string[]>(aktivne.filter((p) => p.id === PAKET_PRICE.id).map((p) => p.id))
  const zaOtkaz = aktivne.filter((p) => izabrane.includes(p.id))
  return (
    <TelOkvir id="P9" naslov="Otkaži ugovor" nazadNa={sastavi('P8')}>
      <div className="tel-kartica">
        {aktivne.map((p) => (
          <label key={p.id} className="tel-kvacica">
            <input
              type="checkbox"
              checked={izabrane.includes(p.id)}
              onChange={(e) => setIzabrane((x) => (e.target.checked ? [...x, p.id] : x.filter((i) => i !== p.id)))}
            />
            <span>
              {p.naziv} — {cenaMesecno(p.cena)}
            </span>
          </label>
        ))}
      </div>
      {zaOtkaz.length > 0 && (
        <p>
          Otkazuješ: {zaOtkaz.map((p) => `${p.naziv} — ${cenaMesecno(p.cena)}`).join('; ')}. Gledaš do kraja plaćenog perioda (primer).
        </p>
      )}
      {zaOtkaz.length === 0 && <p className="tel-napomena">Izaberi bar jednu pretplatu.</p>}
      <button
        type="button"
        className="tel-dugme tel-dugme--otkaz"
        disabled={zaOtkaz.length === 0}
        data-radnja="jetzt-kundigen"
        onClick={() => {
          const ids = zaOtkaz.map((x) => x.id)
          const slobodno = () => {
            for (const i of ids) d.operacija('otkazi', i)
            d.idiTel(sastavi('P10', { id: ids.join('+') }))
          }
          // u priči „jetzt kündigen“ otkazuje ono što je štiklirano: Paket Srbija je radnja priče, a svaka druga štiklirana stavka se otkazuje u sloju
          if (!ids.includes(PAKET_PRICE.id)) return slobodno()
          const ishod = d.radnja('jetzt-kundigen', undefined, 'tel', PAKET_PRICE.id)
          if (ishod === 'nije') slobodno()
          else if (ishod === 'ok') for (const i of ids.filter((x) => x !== PAKET_PRICE.id)) d.operacija('otkazi', i)
        }}
      >
        jetzt kündigen
        <small>Otkaži sada</small>
      </button>
      <button type="button" className="tel-veza" onClick={() => d.idiTel(sastavi('P8'))}>
        Nazad
      </button>
    </TelOkvir>
  )
}

export function P10Otkazano({ parametri }: Svojstva) {
  const d = useDemo()
  // id može da nosi više otkazanih stavki („a+b“): prikazuju se sve
  const svi = parametri.id.split('+').map((id) => proizvod(id)!).filter(Boolean)
  return (
    <TelOkvir id="P10" naslov="Otkazano">
      <div className="tel-potvrda">
        <span className="tel-krug">
          <Check className="ic" aria-hidden="true" strokeWidth={3} />
        </span>
        <h2>Otkazano: {svi.map((x) => x.naziv).join(', ')}</h2>
        <p className="tel-napomena">Dobićeš potvrdu mejlom (prikaz)</p>
      </div>
      <button
        type="button"
        className="tel-dugme"
        onClick={() => d.postaviUredjaj('tv')}
      >
        Vrati se na televizor
      </button>
      <button type="button" className="tel-dugme tel-dugme--sporedno" onClick={() => d.idiTel(sastavi('P8'))}>
        Moje pretplate
      </button>
    </TelOkvir>
  )
}
