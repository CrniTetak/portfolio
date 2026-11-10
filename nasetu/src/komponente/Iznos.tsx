// Iznos u dinarima kao GLAVNI iznos, a evro ispod kao "orijentaciono" (A1; blueprint: "Naplata u dinarima, evro samo orijentaciono").
// Jedino mesto koje spaja oba prikaza, da svi ekrani pišu iznos isto: "15.795,00 RSD" / "≈ 135,00 € (orijentaciono)".
import { KURS_RSD } from '../logika/konstante'
import { eurOrijentaciono, rsdPara, uPare } from '../logika/novac'

interface Props {
  /** iznos u evro-centima (računa se u evrima) */
  centi: number
  /** kurs zapisan na predračunu / zahtevu; ako nije dat, važi izmišljeni fiksni kurs prototipa */
  kurs?: number
  /** ako je iznos već u parama (npr. ukupno sa predračuna), daje se i on — tačan zbir bez novog zaokruživanja */
  pare?: number
  className?: string
  /** true: evro ide u istom redu (u tesnim ćelijama ne preporučuje se) */
  uRedu?: boolean
}

export function Iznos({ centi, kurs = KURS_RSD, pare, className = '', uRedu = false }: Props) {
  const p = pare ?? uPare(centi, kurs)
  return (
    <span className={`cifre ${uRedu ? '' : 'inline-block'} ${className}`}>
      <span className="whitespace-nowrap">{rsdPara(p)}</span>
      {uRedu ? ' ' : <br />}
      <span className="text-[13px] font-normal text-sek">{eurOrijentaciono(centi)}</span>
    </span>
  )
}
