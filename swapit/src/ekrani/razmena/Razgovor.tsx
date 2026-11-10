// C2 „Razgovor“ (UX 6.6, PLAN B5.9): samo prikaz. Poruke su unapred napisane; „polje za pisanje“ su čipovi brzih odgovora.
// U priči (korak 7) troje se dogovara u zajedničkom razgovoru; čip „Dogovoreno“ je radnja priče. Ništa se ne šalje.
import { useState } from 'react'
import { useLocation } from 'react-router'
import { useStanjePrice } from '../../demo/useStanje'
import { JosNijePocelo } from '../../komponente/JosNijePocelo'
import { Inicijali } from '../../komponente/Inicijali'
import { Obavestenje } from '../../komponente/Obavestenje'
import { RadnjaDugme } from '../../komponente/RadnjaDugme'
import { Veza } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { PODRSKA_NAZIV } from '../../scenario/strane'
import { ANA_ID, FIRMA_PO_ID, JOVANA_ID, MARKO_ID } from '../../scenario/svet'
import { CIPOVI_ODGOVORA, ODGOVOR_DOGOVORENO, POZDRAV_PITANJE_O_PONUDI, POZDRAV_RAZGOVORA, PORUKE_LANCA, PREDLOZI_RAZGOVORA } from '../../scenario/prica'

type Poruka = { od: string; tekst: string }

export function C2() {
  const { parametri, ugao } = useEkran()
  const { grana, uradjeno } = useStanjePrice()
  const [dodate, setDodate] = useState<string[]>([])
  // S4: ko pita određuje pozdrav; odakle je razgovor otvoren stoji u linku (?iz=ponuda | profil), a bez toga je iz oglasa
  const iz = new URLSearchParams(useLocation().search).get('iz')
  const ja = ugao === 'ana' ? ANA_ID : ugao === 'marko' ? MARKO_ID : 'ti'
  const lanac = parametri.razgovor === 'lanac'
  if (lanac && grana === 'lanac' && !uradjeno('6.jovana'))
    return <JosNijePocelo naslov="Razgovor" opis="Kad sve troje prihvate lanac, dogovarate se u zajedničkom razgovoru." korak={7} />

  const sagovornik = parametri.razgovor === 'podrska' ? PODRSKA_NAZIV : (FIRMA_PO_ID[parametri.razgovor]?.naziv ?? parametri.razgovor)
  // iz ponude: pita primalac ponude, pa pozdrav piše on; sa profila korisnika: prazan razgovor sa predlozima; iz oglasa: vlasnik odgovara
  const pocetne: Poruka[] = iz === 'ponuda' ? [{ od: ja, tekst: POZDRAV_PITANJE_O_PONUDI }] : iz === 'profil' ? [] : [{ od: sagovornik, tekst: POZDRAV_RAZGOVORA }]
  const poruke: Poruka[] = lanac ? [...PORUKE_LANCA] : pocetne
  if (lanac && uradjeno('7.c2') && ODGOVOR_DOGOVORENO[ja]) poruke.push({ od: ja, tekst: ODGOVOR_DOGOVORENO[ja] })
  for (const t of dodate) poruke.push({ od: ja, tekst: t })
  const naslov = lanac ? 'Razgovor: lanac razmene' : `Razgovor sa ${sagovornik}`
  const ucesnici = lanac ? [ANA_ID, MARKO_ID, JOVANA_ID] : [sagovornik]

  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="C2">
      <div className="naslov-reda">
        <h1>{naslov}</h1>
        <div className="znacke">
          <Znacka vrsta="verifikovan" />
          {lanac && <Veza ekran="X8" parametri={{ razmena: 'lanac' }} className="dugme dugme-linija">Nazad na dogovor</Veza>}
        </div>
      </div>
      <p className="flex flex-wrap items-center gap-2 pomocni-tekst">
        {ucesnici.map((u) => (
          <span key={u} className="inline-flex items-center gap-1">
            <Inicijali ime={u} velicina={24} /> {u}
          </span>
        ))}
      </p>
      <div className="razgovor" role="log" aria-label="Poruke" data-poruke>
        <span className="sistemska">Telefon se otkriva tek posle prihvaćene ponude.</span>
        {poruke.length === 0 && (
          <span className="sistemska" data-prazan-razgovor>
            Još nema poruka. Izaberi predlog ispod da započneš razgovor.
          </span>
        )}
        {poruke.map((p, i) => (
          <div key={i} className={`mehur${p.od === ja ? ' mehur-moja' : ''}`} data-od={p.od}>
            <b>{p.od === ja ? 'Ti' : p.od}</b>
            {p.tekst}
          </div>
        ))}
      </div>
      <div className="stog-sm">
        <p className="polje-oznaka">{poruke.length === 0 ? 'Predlozi za početak razgovora' : 'Brzi odgovori'}</p>
        <div className="cipovi">
          {(lanac ? CIPOVI_ODGOVORA : PREDLOZI_RAZGOVORA).map((c, i) =>
            i === 0 && lanac ? (
              <RadnjaDugme key={c} id="7.c2" varijanta="linija" poruka={false}>
                {c}
              </RadnjaDugme>
            ) : (
              <button
                key={c}
                type="button"
                className="pilula"
                disabled={dodate.includes(c)}
                onClick={() => setDodate((d) => (d.includes(c) ? d : [...d, c]))}
              >
                {c}
              </button>
            ),
          )}
        </div>
      </div>
      <Obavestenje>Novac se između korisnika nikad ne razmenjuje. Telefon deli tek posle prihvaćene ponude. Demo poruke — ništa se ne šalje.</Obavestenje>
      {lanac && uradjeno('7.c2') && (
        <div className="red-dugmad">
          <Veza ekran="X8" parametri={{ razmena: 'lanac' }} className="dugme dugme-zeleno">
            Nazad na dogovor
          </Veza>
        </div>
      )}
    </section>
  )
}
