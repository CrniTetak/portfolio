// PLOČICA LOGOTIPA (UI 4, PLAN B7.2): neutralna pločica #F6F3EC; pravi logotip (samo 5 pouzdanih) ili naziv kanala kao tekst.
// Logotip je uvek <img> sa natpisom = naziv kanala; centriran, najviše 80 % visine i 85 % širine, bez senke i izobličenja.
import { kanal, logotipSlika } from '../../podaci/svet'

export type VelicinaPlocice = 'kartica' | 'vodic' | 'mala'

// Kad je naziv vidljiv ispod logotipa, slika ima prazan alt (da se naziv ne čita dvaput).
export function PlocicaLogotipa({ kanalId, velicina }: { kanalId: string; velicina: VelicinaPlocice }) {
  const k = kanal(kanalId)
  const slika = logotipSlika(k)
  if (slika) {
    return (
      <div className={`plocica plocica--${velicina}`}>
        <div className={`plocica-sadrzaj ${slika.nazivIspod ? 'plocica-sadrzaj--naziv' : ''}`}>
          <img src={slika.adresa} alt={slika.nazivIspod ? '' : k.naziv} draggable={false} />
          {slika.nazivIspod && <span className="plocica-naziv">{k.naziv}</span>}
        </div>
      </div>
    )
  }
  return (
    <div className={`plocica plocica--${velicina} ${k.naziv.length > 12 ? 'plocica--duga' : ''}`} role="img" aria-label={k.naziv}>
      <span aria-hidden="true">{k.naziv}</span>
    </div>
  )
}
