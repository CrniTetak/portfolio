// A4 — Šta produkcija plaća VLASNIKU: za vlasnika fizičko lice tri reda (bruto, porez po odbitku, iznos vlasniku), za firmu jedna napomena.
// Računa logika/novac.ts (obracunZaProdukciju); ovde se samo prikazuje.
import { KURS_RSD } from '../logika/konstante'
import { POREZ_FIZICKO_EFEKTIVNO_PROCENAT } from '../logika/konstante'
import { eur, kursTekst, obracunZaProdukciju, uPare, type TipVlasnika } from '../logika/novac'
import { Iznos } from './Iznos'

interface Props {
  osnovicaCenti: number
  tip: TipVlasnika
  /** 'rsd' = dinari glavni (zahtev, rezervacija); 'eur' = evri (katalog, strana lokacije; uz napomenu da se fakturiše u dinarima) */
  valuta?: 'rsd' | 'eur'
  kurs?: number
}

export function ObracunVlasniku({ osnovicaCenti, tip, valuta = 'rsd', kurs = KURS_RSD }: Props) {
  const o = obracunZaProdukciju(osnovicaCenti, tip)
  // dinari: bruto i porez se preračunavaju po jednom, a neto je njihova razlika u PARAMA (zbir uvek tačan, bez dvostrukog zaokruživanja)
  const brutoPare = uPare(o.brutoCenti, kurs)
  const porezPare = uPare(o.porezCenti, kurs)
  const pare: Record<string, number> = { bruto: brutoPare, porez: porezPare, neto: brutoPare - porezPare }
  const iznos = (centi: number, kljuc: 'bruto' | 'porez' | 'neto') =>
    valuta === 'rsd' ? <Iznos centi={centi} kurs={kurs} pare={pare[kljuc]} /> : <span>{eur(centi)}</span>
  return (
    <div className="text-sm">
      <table className="cifre w-full">
        <caption className="sr-only">Šta se plaća vlasniku</caption>
        <tbody>
          <tr className="border-b border-linija"><td className="py-2 pr-3">Cena lokacije (bruto)</td><td className="py-2 text-right font-semibold">{iznos(o.brutoCenti, 'bruto')}</td></tr>
          {!o.vlasnikIzdajeFakturu && (
            <>
              <tr className="border-b border-linija"><td className="py-2 pr-3">Porez po odbitku {POREZ_FIZICKO_EFEKTIVNO_PROCENAT}% (plaća ga produkcija državi)</td><td className="py-2 text-right">−{iznos(o.porezCenti, 'porez')}</td></tr>
              <tr><td className="pt-2 pr-3 font-bold">Iznos koji ide vlasniku</td><td className="pt-2 text-right font-bold">{iznos(o.netoCenti, 'neto')}</td></tr>
            </>
          )}
        </tbody>
      </table>
      {o.vlasnikIzdajeFakturu
        ? <p className="mt-2 text-sek">Vlasnik je firma: vlasnik izdaje fakturu na punu cenu.</p>
        : <p className="mt-2 text-sek">Vlasnik je fizičko lice: produkcija zadržava porez po odbitku i uplaćuje ga državi. Nasetu daje šablon i računicu; orijentaciono, nije poreski savet.</p>}
      {valuta === 'eur' && <p className="mt-1 text-sek">Vlasnik fakturiše u dinarima (izmišljen kurs {kursTekst(kurs)}).</p>}
    </div>
  )
}
