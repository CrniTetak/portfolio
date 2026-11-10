// J4 — Brief obrazac: jedna kolona, jedan ekran, unapred popunjen scenarijom.
import { Send } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { Dugme, DugmeLink, fokusirajGresku, Kartica, Kvacice, KLASA_POLJA, NapomenaNeSalje, Naslov, Oznaka, Polje, Stranica } from '../../komponente/osnovno'
import { briefDelte } from '../../stanje/izvedeno'
import { eur, NAZIV_RAZREDA, rsdPara, uPare } from '../../logika/novac'
import { CENA_IZBORA_VAN_KATALOGA_CENTI } from '../../logika/konstante'
import { dodajDane } from '../../logika/vreme'
import { NAZIV_OZNAKE, STILOVI, TIPOVI, type Oznaka as OznakaTip } from '../../podaci/lokacije'
import type { NacrtBriefa } from '../../stanje/akcije'
import { BRIEF_SCENARIO } from '../../stanje/scenario'
import { useIdiKao } from '../../stanje/hooks'
import { useStanje } from '../../stanje/StanjeProvider'

const VRSTE = ['Reklama', 'Spot', 'Foto', 'Serija / film', 'Drugo']
const ZONE = ['Centar', 'Centar-jug', 'Novi Beograd', 'Istok', 'Zapad', 'Zemun-Novi Beograd']

export default function Brief() {
  const { stanje, salji, vodjeno } = useStanje()
  const idiKao = useIdiKao()
  const [params] = useSearchParams()
  const [pokusao, setPokusao] = useState(false)
  const [upravoPoslato, setUpravoPoslato] = useState(false)
  const delta = briefDelte(stanje)
  // "Poslato" čitamo iz globalnog stanja: posle osvežavanja ili „Nazad" se isti zahtev ne nudi ponovo.
  // Drugi zahtev se jasno započinje dugmetom „Novi zahtev" (?novi).
  const noviZahtev = params.has('novi')

  // U prototipu su datum, broj dana i veličina ekipe FIKSIRANI (inače bi se pokvarila priča: termin i cene).
  const b0 = BRIEF_SCENARIO
  const datum = b0.termin.snimanje[0]
  const brojDana = b0.termin.snimanje.length
  const brojPripreme = b0.termin.priprema.length
  const razred = b0.razred
  const [vrsta, setVrsta] = useState(b0.vrsta)
  const [grad, setGrad] = useState(b0.grad)
  const [zone, setZone] = useState(b0.zone)
  const [tipovi, setTipovi] = useState(b0.tipovi)
  const [stilovi, setStilovi] = useState(b0.stilovi)
  const [uslovi, setUslovi] = useState<OznakaTip[]>(b0.uslovi)
  const [budzetOd, setBudzetOd] = useState(String(b0.budzetOd / 100))
  const [budzetDo, setBudzetDo] = useState(String(b0.budzetDo / 100))
  const [napomena, setNapomena] = useState(b0.napomena)
  const [vanKataloga, setVanKataloga] = useState(b0.vanKataloga)
  const [pomocDozvole, setPomocDozvole] = useState(b0.pomocDozvole)

  const greske = { grad: !grad.trim() ? 'Unesite grad' : null }
  const imaGresku = Object.values(greske).some(Boolean)

  const posalji = () => {
    if (stanje.uloga !== 'produkcija' || vodjeno) return // Enter u polju ne sme da pošalje tuđ zahtev (ni u vođenoj priči)
    setPokusao(true)
    if (imaGresku) { fokusirajGresku(); return }
    // Termin se gradi od datuma: snimajući dani redom, a dani pripreme neposredno PRE prvog snimajućeg dana.
    const nacrt: NacrtBriefa = {
      vrsta, grad, zone,
      termin: {
        snimanje: Array.from({ length: brojDana }, (_, i) => dodajDane(datum, i)),
        priprema: Array.from({ length: brojPripreme }, (_, i) => dodajDane(datum, i - brojPripreme)),
      },
      razred, tipovi, stilovi, uslovi,
      budzetOd: Math.round(Number(budzetOd) * 100) || 0,
      budzetDo: Math.round(Number(budzetDo) * 100) || 0,
      napomena, vanKataloga, pomocDozvole,
    }
    salji({ tip: 'POSALJI_BRIEF', brief: nacrt })
    setUpravoPoslato(true)
  }

  if ((delta && !noviZahtev) || upravoPoslato) {
    return (
      <Stranica uzak>
        <Kartica className="flex flex-col items-start gap-4 p-6 md:p-8">
          <Oznaka vrsta={delta?.izborId ? 'aktivna' : 'ceka-vlasnika'} velika>{delta?.izborId ? 'Izbor je spreman' : 'Čeka pripremu izbora'}</Oznaka>
          <h1 className="text-[26px] md:text-[32px]">Zahtev je poslat.</h1>
          <p className="text-sek">Izbor stiže u 24–48 sati. U prototipu izbor šalje Nasetu tim: u priči je to sledeći korak.</p>
          {delta?.vanKataloga && (
            <p className="cifre rounded-dugme bg-prototip-s px-4 py-3 text-sm font-semibold text-prototip-tekst">
              Traženje van kataloga: nastao je predračun od {rsdPara(uPare(CENA_IZBORA_VAN_KATALOGA_CENTI))} (≈ {eur(CENA_IZBORA_VAN_KATALOGA_CENTI)}, orijentaciono). Admin ga potvrđuje u prototipu; iznos se uračunava u naknadu ako rezervišete.
            </p>
          )}
          {delta?.pomocDozvole && <p className="text-sm text-sek">Pomoć oko dozvola: admin vidi vaš zahtev; cena po dogovoru.</p>}
          <NapomenaNeSalje />
          <div className="flex flex-wrap gap-3">
            <DugmeLink to="/produkcija">Otvori moju tablu</DugmeLink>
            <DugmeLink to="/brief?novi=1" varijanta="sekundarno" onClick={() => setUpravoPoslato(false)}>Novi zahtev</DugmeLink>
          </div>
        </Kartica>
      </Stranica>
    )
  }

  return (
    <Stranica uzak>
      <Naslov podnaslov="Opišite šta vam treba. Unapred je popunjen primer iz scenarija.">Pošaljite zahtev (brief)</Naslov>
      <div className="mb-6"><NapomenaNeSalje /></div>
      {vodjeno && <p className="mb-6 rounded-dugme bg-akcent-s px-4 py-3 text-sm" role="note" data-samo-citanje>Polja su popunjena za priču i samo se čitaju. U slobodnom režimu možete menjati polja.</p>}
      {stanje.uloga !== 'produkcija' && (
        <Kartica className="mb-6 flex flex-wrap items-center justify-between gap-3 border-prototip-s !bg-prototip-s p-4 text-prototip-tekst">
          <span>Zahtev šalje Produkcija. Trenutno gledate kao drugu ulogu.</span>
          <Dugme varijanta="sekundarno" onClick={() => idiKao('produkcija', noviZahtev ? '/brief?novi=1' : '/brief')}>Gledaj kao Produkcija</Dugme>
        </Kartica>
      )}
      <form onSubmit={(e) => { e.preventDefault(); posalji() }} noValidate className="flex flex-col gap-6">
        <fieldset disabled={vodjeno} className="contents">
        <Kartica className="flex flex-col gap-5 p-5 md:p-6">
          <Polje naziv="Vrsta projekta" htmlFor="vrsta">
            <select id="vrsta" className={KLASA_POLJA} value={vrsta} onChange={(e) => setVrsta(e.target.value)}>{VRSTE.map((v) => <option key={v}>{v}</option>)}</select>
          </Polje>
          <Polje naziv="Grad" obavezno htmlFor="grad" greska={pokusao ? greske.grad : null}><input id="grad" autoComplete="off" className={KLASA_POLJA} value={grad} onChange={(e) => setGrad(e.target.value)} /></Polje>
          <Polje naziv="Željene zone"><Kvacice vrednosti={ZONE.map((z) => ({ id: z, naziv: z }))} izabrano={zone} onChange={setZone} /></Polje>
        </Kartica>

        <Kartica className="p-5 md:p-6">
          <div className="grid gap-5 sm:grid-cols-3">
            <Polje naziv="Datum snimanja" htmlFor="datum">
              <input id="datum" type="date" readOnly className={`${KLASA_POLJA} bg-traka`} value={datum} />
            </Polje>
            <Polje naziv="Snimajućih dana" htmlFor="dani">
              <input id="dani" readOnly className={`${KLASA_POLJA} bg-traka`} value={brojDana} />
            </Polje>
            <Polje naziv="Dani pripreme / raspremanja" htmlFor="priprema" pomoc="Cena dana pripreme zavisi od lokacije (obično pola cene snimajućeg dana).">
              <input id="priprema" readOnly className={`${KLASA_POLJA} bg-traka`} value={brojPripreme} />
            </Polje>
          </div>
          <p className="mt-4 text-sm text-sek">U prototipu je datum fiksiran radi priče (isto važi za broj dana i veličinu ekipe: {NAZIV_RAZREDA[razred]}).</p>
        </Kartica>

        <Kartica className="flex flex-col gap-5 p-5 md:p-6">
                    <Polje naziv="Tip prostora"><Kvacice vrednosti={TIPOVI.map((t) => ({ id: t, naziv: t }))} izabrano={tipovi} onChange={setTipovi} /></Polje>
          <Polje naziv="Stil"><Kvacice vrednosti={STILOVI.map((s) => ({ id: s, naziv: s }))} izabrano={stilovi} onChange={setStilovi} /></Polje>
          <Polje naziv="Tehnički uslovi">
            <Kvacice vrednosti={(Object.keys(NAZIV_OZNAKE) as OznakaTip[]).map((o) => ({ id: o, naziv: NAZIV_OZNAKE[o] }))} izabrano={uslovi} onChange={setUslovi} />
          </Polje>
        </Kartica>

        <Kartica className="flex flex-col gap-5 p-5 md:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <Polje naziv="Budžet za lokaciju po danu, od (€)" htmlFor="od"><input id="od" type="number" min={0} inputMode="numeric" className={KLASA_POLJA} value={budzetOd} onChange={(e) => setBudzetOd(e.target.value)} /></Polje>
            <Polje naziv="do (€)" htmlFor="do"><input id="do" type="number" min={0} inputMode="numeric" className={KLASA_POLJA} value={budzetDo} onChange={(e) => setBudzetDo(e.target.value)} /></Polje>
          </div>
          <Polje naziv="Napomena" htmlFor="napomena">
            <textarea id="napomena" autoComplete="off" rows={3} className={`${KLASA_POLJA} h-auto py-2`} value={napomena} onChange={(e) => setNapomena(e.target.value)} />
          </Polje>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[#C8401E]" checked={vanKataloga} onChange={(e) => setVanKataloga(e.target.checked)} />
            <span><b>Treba mi i traženje van kataloga</b><br />
              <span className="text-sm text-sek">Izbor iz kataloga je besplatan. Ako tražite lokacije van kataloga, to ide uz predračun od {eur(CENA_IZBORA_VAN_KATALOGA_CENTI)} po zahtevu (u dinarima), koji se uračunava u naknadu ako rezervišete. Posle slanja zahteva nastaje predračun koji admin potvrđuje.</span></span>
          </label>
          <label className="flex min-h-11 cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 accent-[#C8401E]" checked={pomocDozvole} onChange={(e) => setPomocDozvole(e.target.checked)} />
            <span><b>Treba mi pomoć oko dozvola (cena po dogovoru)</b><br />
              <span className="text-sm text-sek">Admin vidi ovu oznaku uz zahtev; iznos se ne računa u prototipu.</span></span>
          </label>
          <p className="rounded-dugme bg-traka px-3 py-2 text-sm">Rezervacije prave samo firme i preduzetnici (PIB i matični broj).</p>
        </Kartica>

        </fieldset>
        {pokusao && imaGresku && <p className="font-semibold text-opasno" role="alert">Proverite polja označena iznad.</p>}
        <div>
          <DugmeRadnje id="brief" type="submit" primarno ikona={Send} disabled={stanje.uloga !== 'produkcija'} zasto={stanje.uloga !== 'produkcija' ? 'Zahtev šalje Produkcija.' : null} className="w-full sm:w-auto">Pošalji zahtev</DugmeRadnje>
        </div>
      </form>
    </Stranica>
  )
}
