// Zahtev koji pripada drugom vlasniku (pravno/fizičko lice) automatski prebacuje prikaz na pravog vlasnika,
// da zahtev ne bi bio „nevidljiv" zbog prekidača Pravno/Fizičko.
import { useEffect } from 'react'
import { TIP_VLASNIKA } from '../../podaci/akteri'
import { useStanje } from '../../stanje/StanjeProvider'

export function PrebaciPrikaz({ vlasnikId }: { vlasnikId: string }) {
  const { salji } = useStanje()
  useEffect(() => {
    const tip = TIP_VLASNIKA[vlasnikId]
    if (tip) salji({ tip: 'PROMENI_PRIKAZ_VLASNIKA', prikaz: tip })
  }, [vlasnikId, salji])
  return null
}
