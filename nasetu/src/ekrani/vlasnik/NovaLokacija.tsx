// V5 — Unos lokacije (vlasnik): tehnički list, cenovnik po veličini ekipe, fotografije (samo brojač), "dokaz prava na izdavanje"
// (samo probni naziv) i opciona usluga fotografisanja. Tačna adresa se NE čuva (polje je samo ilustracija).
import { ChevronDown, Paperclip } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Iznos } from '../../komponente/Iznos'
import { Dugme, Kartica, KLASA_POLJA, Naslov, Oznaka, Polje, Stranica, NapomenaNeSalje, fokusirajGresku } from '../../komponente/osnovno'
import { FOTOGRAFISANJE_CENTI, MAX_TEKST_UNOSA, MIN_FOTOGRAFIJA_ZA_OBJAVU, UDEO_DANA_PRIPREME } from '../../logika/konstante'
import { eur } from '../../logika/novac'
import { POLJA_TEHNICKOG, TIPOVI } from '../../podaci/lokacije'
import { useStanje } from '../../stanje/StanjeProvider'

function Sekcija({ naslov, otvoreno = true, children }: { naslov: string; otvoreno?: boolean; children: ReactNode }) {
  return (
    <details open={otvoreno} className="group rounded-kartica border border-linija bg-white">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 font-semibold">
        {naslov} <ChevronDown size={18} aria-hidden className="transition group-open:rotate-180" />
      </summary>
      <div className="flex flex-col gap-4 border-t border-linija p-5">{children}</div>
    </details>
  )
}

/** Evro iz polja za unos u cente, ili null ako je prazno. */
const uCente = (v: string): number | null => (v.trim() === '' ? null : Math.round(Number(v) * 100))

export default function NovaLokacija() {
  const { stanje, probaj, vodjeno } = useStanje()
  const [naziv, setNaziv] = useState('')
  const [tip, setTip] = useState<string>(TIPOVI[0])
  const [kvadratura, setKvadratura] = useState('')
  const [opstina, setOpstina] = useState('')
  const [adresa, setAdresa] = useState('')
  const [tehnicki, setTehnicki] = useState<Record<string, string>>(() => Object.fromEntries(POLJA_TEHNICKOG.map((p) => [p.kljuc, p.primer])))
  const [sati, setSati] = useState('10')
  const [cenaDo10, setCenaDo10] = useState('')
  const [cenaDo30, setCenaDo30] = useState('')
  const [cenaPreko30, setCenaPreko30] = useState('')
  const [priprema, setPriprema] = useState<string | null>(null)
  const [prekovremeni, setPrekovremeni] = useState('')
  const [najkrace, setNajkrace] = useState('1 snimajući dan')
  const [troskovi, setTroskovi] = useState('')
  const [dokaz, setDokaz] = useState('')
  const [fotografije, setFotografije] = useState(0)
  const [fotografisanje, setFotografisanje] = useState(false)
  const [pokusao, setPokusao] = useState(false)
  const [poslato, setPoslato] = useState(false)
  const [greskaSlanja, setGreskaSlanja] = useState<string | null>(null)
  // predračun za fotografisanje BAŠ ove prijave (ID se čita iz novog stanja posle slanja)
  const [fotoPredracunId, setFotoPredracunId] = useState<string | null>(null)

  const cene = [uCente(cenaDo10), uCente(cenaDo30), uCente(cenaPreko30)]
  const imaCenu = cene.some((c) => c !== null && c > 0)
  // dan pripreme: podrazumevano pola cene za ekipu 11–30 ako je upisana, inače pola prve upisane cene;
  // vlasnik može da upiše svoju cenu (jedna cena za sve veličine ekipe)
  const cenaZaPripremu = (cene[1] !== null && cene[1] > 0 ? cene[1] : cene.find((c) => c !== null && c > 0)) ?? 0
  const pripremaPrikaz = priprema ?? (cenaZaPripremu ? String(Math.round(cenaZaPripremu * UDEO_DANA_PRIPREME) / 100) : '')

  const greske = {
    naziv: !naziv.trim() ? 'Unesite naziv lokacije' : null,
    kvadratura: !(Number(kvadratura) > 0) ? 'Unesite kvadraturu' : null,
    opstina: !opstina.trim() ? 'Unesite opštinu' : null,
    cena: !imaCenu || cene.some((c) => c !== null && !(c > 0)) ? 'Unesite cenu snimajućeg dana za bar jednu veličinu ekipe' : null,
    dokaz: !dokaz ? 'Dodajte dokaz prava na izdavanje' : null,
  }
  const imaGresku = Object.values(greske).some(Boolean)

  if (poslato) {
    const foto = stanje.predracuni.find((p) => p.id === fotoPredracunId)
    return (
      <Stranica uzak>
        <Kartica className="flex flex-col items-start gap-3 p-6 md:p-8">
          <Oznaka vrsta="ceka-vlasnika" velika>Čeka odobrenje admina</Oznaka>
          <h1 className="text-[26px] md:text-[32px]">Lokacija je poslata na odobrenje.</h1>
          <p className="text-sek">Admin proverava tehnički list, fotografije i dokaz prava na izdavanje pre objave. Kad ih odobri, lokacija ulazi u katalog (u prototipu bez fotografija).</p>
          {fotografisanje && foto && (
            <p className="rounded-dugme bg-prototip-s px-4 py-3 text-sm font-semibold text-prototip-tekst">
              Fotografisanje prostora: nastao je izmišljen predračun od <Iznos centi={FOTOGRAFISANJE_CENTI} uRedu />. <Link to={`/vlasnik/predracun/${foto.id}`} className="underline">Pogledaj predračun</Link>
            </p>
          )}
          <NapomenaNeSalje />
          <Link to="/vlasnik" className="font-semibold text-akcent hover:underline">← Nazad na tablu</Link>
        </Kartica>
      </Stranica>
    )
  }

  const posalji = () => {
    if (stanje.uloga !== 'vlasnik' || vodjeno) return // Enter u polju ne sme da pošalje lokaciju iz tuđe uloge (ni u vođenoj priči)
    setPokusao(true)
    setGreskaSlanja(null)
    if (imaGresku) { fokusirajGresku(); return }
    const novo = probaj({
      tip: 'POSALJI_LOKACIJU',
      lokacija: {
        naziv, tip, opstina, kvadratura: Number(kvadratura), tehnicki,
        cenovnik: {
          do10: cene[0], do30: cene[1], preko30: cene[2], satiDana: Number(sati) > 0 ? Number(sati) : 10,
          pripremaCenti: uCente(pripremaPrikaz) ?? 0, prekovremeniCenti: uCente(prekovremeni) ?? 0, najkrace, troskovi,
        },
        brojFotografija: fotografije, dokaz, fotografisanje,
      },
    })
    // radnja koju pravila odbiju ne menja stanje: ne pokazujemo "poslato", nego razlog
    if (!novo) { setGreskaSlanja('Lokacija nije poslata. Proverite unete vrednosti (cene, sati i kvadratura moraju biti veći od nule).'); return }
    const prijava = novo.prijaveLokacija.at(-1)
    setFotoPredracunId(novo.predracuni.find((p) => p.vrsta === 'fotografisanje' && p.prijavaId === prijava?.id)?.id ?? null)
    setPoslato(true)
  }
  const g = (k: keyof typeof greske) => (pokusao ? greske[k] : null)
  const grupa = (naziv: 'Tehnika' | 'Logistika' | 'Pravila') => POLJA_TEHNICKOG.filter((p) => p.grupa === naziv).map((p) => (
    <Polje key={p.kljuc} naziv={p.naziv} htmlFor={`t-${p.kljuc}`}>
      <input id={`t-${p.kljuc}`} autoComplete="off" className={KLASA_POLJA} value={tehnicki[p.kljuc] ?? ''} onChange={(e) => setTehnicki({ ...tehnicki, [p.kljuc]: e.target.value })} />
    </Polje>
  ))

  return (
    <Stranica uzak>
      <Naslov podnaslov="Upis je besplatan. Vaša tačna adresa se ne prikazuje produkcijama dok ne uplate naknadu.">Dodaj lokaciju</Naslov>
      {stanje.uloga !== 'vlasnik' && <p className="mb-4 rounded-dugme bg-prototip-s p-3 text-sm text-prototip-tekst">Lokaciju unosi Vlasnik. Prebacite ulogu na gornjoj traci.</p>}
      <div className="mb-4"><NapomenaNeSalje /></div>
      <form onSubmit={(e) => { e.preventDefault(); posalji() }} noValidate className="flex flex-col gap-4">
        <fieldset disabled={vodjeno} className="contents">
        <Sekcija naslov="Osnovno">
          <Polje naziv="Naziv" obavezno htmlFor="naziv" greska={g('naziv')}><input id="naziv" autoComplete="off" maxLength={MAX_TEKST_UNOSA} className={KLASA_POLJA} value={naziv} onChange={(e) => setNaziv(e.target.value)} /></Polje>
          <Polje naziv="Tip prostora" htmlFor="tip"><select id="tip" className={KLASA_POLJA} value={tip} onChange={(e) => setTip(e.target.value)}>{TIPOVI.map((t) => <option key={t}>{t}</option>)}</select></Polje>
          <div className="grid gap-4 sm:grid-cols-2">
            <Polje naziv="Kvadratura (m²)" obavezno htmlFor="kv" greska={g('kvadratura')}><input id="kv" type="number" min={1} inputMode="numeric" className={KLASA_POLJA} value={kvadratura} onChange={(e) => setKvadratura(e.target.value)} /></Polje>
            <Polje naziv="Opština" obavezno htmlFor="op" greska={g('opstina')}><input id="op" autoComplete="off" maxLength={MAX_TEKST_UNOSA} className={KLASA_POLJA} value={opstina} onChange={(e) => setOpstina(e.target.value)} /></Polje>
          </div>
          <Polje naziv="Tačna adresa" htmlFor="adresa" pomoc="Ne prikazuje se produkcijama. U prototipu se ne čuva.">
            <input id="adresa" className={KLASA_POLJA} value={adresa} onChange={(e) => setAdresa(e.target.value)} autoComplete="off" />
          </Polje>
        </Sekcija>
        <Sekcija naslov="Tehnički list: tehnika" otvoreno={false}>
          <p className="text-sm text-sek">Unapred upisani su izmišljeni primeri; izmenite ih po potrebi.</p>
          {grupa('Tehnika')}
        </Sekcija>
        <Sekcija naslov="Tehnički list: logistika" otvoreno={false}>{grupa('Logistika')}</Sekcija>
        <Sekcija naslov="Tehnički list: pravila" otvoreno={false}>{grupa('Pravila')}</Sekcija>
        <Sekcija naslov="Cenovnik">
          <Polje naziv="Snimajući dan: broj sati" htmlFor="sati-dana"><input id="sati-dana" type="number" min={1} max={24} inputMode="numeric" className={`${KLASA_POLJA} max-w-32`} value={sati} onChange={(e) => setSati(e.target.value)} /></Polje>
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-1 font-semibold">Cena snimajućeg dana po veličini ekipe (€)</legend>
            <div className="grid gap-4 sm:grid-cols-3">
              <Polje naziv="Do 10 ljudi" htmlFor="c10"><input id="c10" type="number" min={1} inputMode="numeric" className={KLASA_POLJA} value={cenaDo10} onChange={(e) => setCenaDo10(e.target.value)} /></Polje>
              <Polje naziv="11–30 ljudi" htmlFor="c30"><input id="c30" type="number" min={1} inputMode="numeric" className={KLASA_POLJA} value={cenaDo30} onChange={(e) => setCenaDo30(e.target.value)} /></Polje>
              <Polje naziv="Preko 30 ljudi" htmlFor="c31"><input id="c31" type="number" min={1} inputMode="numeric" className={KLASA_POLJA} value={cenaPreko30} onChange={(e) => setCenaPreko30(e.target.value)} /></Polje>
            </div>
            {g('cena') && <p className="font-semibold text-opasno" role="alert">{g('cena')}</p>}
            <p className="text-sm text-sek">Ostavite prazno za veličinu ekipe koju prostor ne prima. Cene su izmišljene.</p>
          </fieldset>
          <Polje naziv="Dan pripreme i raspremanja (€)" htmlFor="priprema" pomoc="Podrazumevano pola cene snimajućeg dana; možete upisati svoju cenu. Jedna cena važi za sve veličine ekipe.">
            <input id="priprema" type="number" min={0} inputMode="decimal" className={`${KLASA_POLJA} max-w-48`} value={pripremaPrikaz} onChange={(e) => setPriprema(e.target.value)} />
          </Polje>
          <div className="grid gap-4 sm:grid-cols-2">
            <Polje naziv="Prekovremeni sat (€)" htmlFor="prek"><input id="prek" type="number" min={0} inputMode="numeric" className={KLASA_POLJA} value={prekovremeni} onChange={(e) => setPrekovremeni(e.target.value)} /></Polje>
            <Polje naziv="Najkraće trajanje" htmlFor="najkrace"><input id="najkrace" autoComplete="off" maxLength={MAX_TEKST_UNOSA} className={KLASA_POLJA} value={najkrace} onChange={(e) => setNajkrace(e.target.value)} /></Polje>
          </div>
          <Polje naziv="Posebno naplaćeni troškovi" htmlFor="troskovi"><input id="troskovi" autoComplete="off" maxLength={MAX_TEKST_UNOSA} className={KLASA_POLJA} value={troskovi} onChange={(e) => setTroskovi(e.target.value)} placeholder="npr. čišćenje, obezbeđenje" /></Polje>
        </Sekcija>
        <Sekcija naslov="Fotografije" otvoreno={false}>
          <p className="text-sm text-sek">Za objavu je potrebno najmanje {MIN_FOTOGRAFIJA_ZA_OBJAVU} fotografija (enterijer, eksterijer, razvodna tabla, prilaz). Ovde klik samo dodaje probnu sliku; ništa se ne otprema.</p>
          <div><Dugme varijanta="sekundarno" onClick={() => setFotografije(Math.min(MIN_FOTOGRAFIJA_ZA_OBJAVU, fotografije + 1))}>Dodaj probnu sliku</Dugme> <span className="ml-2 text-sm" aria-live="polite">Dodato: {fotografije} / {MIN_FOTOGRAFIJA_ZA_OBJAVU}</span></div>
        </Sekcija>
        <Sekcija naslov="Dokaz prava na izdavanje">
          <Polje naziv="Dokument" obavezno greska={g('dokaz')} pomoc="Admin proverava pre objave. Prava datoteka se ne šalje — upisuje se samo probni naziv.">
            <div className="flex flex-wrap items-center gap-3">
              <Dugme varijanta="sekundarno" ikona={Paperclip} onClick={() => setDokaz('dokaz-primer.pdf')}>Dodaj dokument</Dugme>
              {dokaz && <span className="font-semibold">{dokaz}</span>}
            </div>
          </Polje>
        </Sekcija>
        <Sekcija naslov="Usluge Nasetua (opciono)" otvoreno={false}>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[#C8401E]" checked={fotografisanje} onChange={(e) => setFotografisanje(e.target.checked)} />
            <span><b>Profesionalno fotografisanje</b> — {eur(FOTOGRAFISANJE_CENTI)} (izmišljeno; raspon 50–100 €)<br />
              <span className="text-sm text-sek">Plaća ga vlasnik. Posle slanja dobijate izmišljen predračun u dinarima, a admin ga vidi među uplatama. Ne ispunjava automatski uslov od {MIN_FOTOGRAFIJA_ZA_OBJAVU} fotografija.</span></span>
          </label>
        </Sekcija>
        </fieldset>
        {pokusao && imaGresku && <p className="font-semibold text-opasno" role="alert">Proverite polja označena iznad.</p>}
        {greskaSlanja && <p className="font-semibold text-opasno" role="alert">{greskaSlanja}</p>}
        <div><Dugme vanPrice type="submit" disabled={stanje.uloga !== 'vlasnik'} zasto={stanje.uloga !== 'vlasnik' ? 'Lokaciju unosi Vlasnik.' : null}>Pošalji na odobrenje</Dugme></div>
      </form>
    </Stranica>
  )
}
