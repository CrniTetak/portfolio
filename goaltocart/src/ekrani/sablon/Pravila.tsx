// S5 / B5. Provera pravila: lista od 6 provera (3 od 6 -> 6 od 6). Spisak: krug sa ikonom, naziv, oznaka stanja, "Why this matters".
import { Chip } from '../../komponente/Chip'
import { AkcijaDugme } from '../../komponente/Dugme'
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { Ikona } from '../../komponente/Ikona'
import { Kartica, PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { gotovo } from '../../pravila/izvedeno'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { eur } from '../../scenario/format'
import { IGRAC } from '../../scenario/strane'
import { PROVERE_KUPCA, PROVERE_PRODAVCA } from '../../tekstovi/pravila'

type Klub = 'selling' | 'buying'

export default function Pravila({ uloga }: { uloga: Klub }) {
  const { poz } = usePrica()
  const prodavac = uloga === 'selling'
  const id = prodavac ? 'S5' : 'B5'
  const stanje = useStanjeEkrana(id)
  const p = pogled(uloga)
  const provere = prodavac ? PROVERE_PRODAVCA : PROVERE_KUPCA
  const zavrseno = gotovo(poz, 'r1')
  // Početno stanje koraka: prve 3 provere prošle; završno: svih 6
  const brojProslih = zavrseno ? 6 : 3
  const nazivEkrana = 'Rules check'

  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id={id} naslov={nazivEkrana} transfer crumb={nazivEkrana}>
        <PraznoStanje opis="Before anything is signed, the platform checks the transfer window, the player's age, the 5% share, estimated obligations, KYC and sanctions." korak={korakEkrana(id, uloga)} />
      </Ekran>
    )
  }

  const dopuna: Record<string, string> = {
    share: `${eur(p.udeoIgraca.ukupno)} in total is paid across the three installments.`,
    education: `Estimated at ${eur(p.skolovanjeProcena)}, illustrative only.`,
  }

  return (
    <Ekran
      id={id}
      naslov={nazivEkrana}
      transfer
      crumb={nazivEkrana}
      podnaslov={`${IGRAC.ime} → ${p.protivStrana.naziv}`}
    >
      <Kartica
        id="provere"
        bezTela
        naslov={`${brojProslih} of 6 checks passed`}
        desno={brojProslih === 6 ? <Chip v="paid" ikona="check">Ready to sign</Chip> : <Chip v="nego" ikona="clock">Checks running</Chip>}
      >
        <ul className="checks">
          {provere.map((c, i) => {
            const prosla = i < brojProslih
            return (
              <li key={c.id} data-provera={c.id} data-prosla={prosla ? 'da' : 'ne'}>
                <span className={`tick ${prosla ? 'ok' : 'wait'}`}>
                  <Ikona ime={prosla ? 'check' : 'clock'} />
                </span>
                <div>
                  {c.naziv}
                  <small>{c.opis}</small>
                  <details>
                    <summary>Why this matters</summary>
                    <p>
                      {c.zasto} {dopuna[c.id] ?? ''}
                    </p>
                  </details>
                </div>
                {prosla ? <Chip v="paid" ikona="check">Passed</Chip> : <Chip v="nego" ikona="clock">In progress</Chip>}
              </li>
            )
          })}
        </ul>
      </Kartica>
      {!zavrseno && (
        <div className="btnrow">
          <AkcijaDugme radnja="r1" uloga={uloga} />
        </div>
      )}
    </Ekran>
  )
}
