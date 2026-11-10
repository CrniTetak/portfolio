// S7. Security / escrow status: da li je kupac obezbedio prvu ratu u escrow-u.
import { Ekran, useStanjeEkrana } from '../../komponente/Ekran'
import { EscrowKartica, fazaEscrow } from '../../komponente/Escrow'
import { PraznoStanje } from '../../komponente/Kartica'
import { usePrica } from '../../prica/PricaProvider'
import { korakEkrana } from '../../pravila/stanjeEkrana'
import { pogled } from '../../pravila/vidljivost'
import { DATUM } from '../../scenario/datumi'

export default function S7Sigurnost() {
  const { poz } = usePrica()
  const stanje = useStanjeEkrana('S7')
  const p = pogled('selling')
  if (stanje === 'nije-pocelo') {
    return (
      <Ekran id="S7" naslov="Security" transfer>
        <PraznoStanje opis="The buying club secures the first installment in escrow before anything is registered. You will see the status here." korak={korakEkrana('S7', 'selling')} />
      </Ekran>
    )
  }
  const faza = fazaEscrow(poz)
  return (
    <Ekran id="S7" naslov="Security" transfer podnaslov={`${p.igrac.ime} → ${p.protivStrana.naziv}`}>
      <EscrowKartica
        faza={faza}
        iznos={p.escrow.iznos}
        naslovIznosa={faza === 'ceka' ? 'First installment expected' : faza === 'isplaceno' ? 'First installment released' : faza === 'odbijeno' ? 'First installment: refund to follow' : faza === 'povrat' ? 'First installment: refund to the buyer' : faza === 'vraceno' ? 'First installment returned to the buyer' : 'First installment secured in escrow'}
        redovi={[
          ['Status', faza === 'ceka' ? 'Waiting for buyer' : faza === 'isplaceno' ? 'Released to the parties' : faza === 'odbijeno' ? 'Registration refused' : faza === 'povrat' ? 'Refund initiated' : faza === 'vraceno' ? 'Returned to the buyer' : 'Held in escrow'],
          ['Deposit date', faza === 'ceka' ? `Expected by ${DATUM.escrowRok}` : DATUM.uplataEscrow],
          ['Account', <span className="mono" key="acc">{p.escrow.racunMaskiran}</span>],
          ['Payout rule', faza === 'odbijeno' || faza === 'povrat' || faza === 'vraceno' ? 'In this illustration, nothing is paid out because the registration was not completed' : 'Released when registration is confirmed (in this illustration)'],
          ['Amount', "Your installment 1. The buyer's deposit also covered its own costs."],
        ]}
      />
    </Ekran>
  )
}
