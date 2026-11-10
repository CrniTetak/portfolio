// JEDINO PRAVO POLJE U CELOM DEMOU (PLAN B4.5, B7): pretraga. Samo filtrira oglase demoa; ništa se ne šalje.
// Postoji JEDNA komponenta (zaglavlje na računaru, P4 i P6). Bez <form>, bez name, bez autocomplete-a osim „off“.
// Enter ili dugme „Traži“ menja link u #/<ugao>/pretraga?q=… (P5). Sam upit ostaje u linku. Jedino što se čuva je „Sačuvaj pretragu“ (tokovi.pretrage, najviše 10),
// i to samo u sessionStorage ovog prozora; ništa ne napušta pregledač, a zatvaranjem prozora se briše.
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useEkran } from '../okvir/kontekst'
import { link } from '../pravila/rute'
import { NAJVISE_ZNAKOVA } from '../pretraga/normalizuj'

export function PoljePretrage({ saDetaljima = true }: { saDetaljima?: boolean }) {
  const { id, ugao } = useEkran()
  const navigate = useNavigate()
  const { search } = useLocation()
  const upitIzLinka = id === 'P5' ? (new URLSearchParams(search).get('q') ?? '') : ''
  const [tekst, setTekst] = useState(upitIzLinka)
  // upit u linku je izvor istine na P5 (osvežavanje i „nazad“ ga čuvaju)
  useEffect(() => setTekst(upitIzLinka), [upitIzLinka])

  const trazi = () => {
    const q = tekst.trim()
    navigate(link('P5', ugao, {}, q ? { q } : undefined))
    window.scrollTo(0, 0)
  }
  return (
    <div className="polje-pretrage" role="search">
      <input
        type="search"
        aria-label="Pretraga oglasa"
        placeholder="Pretraga…"
        value={tekst}
        maxLength={NAJVISE_ZNAKOVA}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        data-jedino-polje="pretraga"
        onChange={(e) => setTekst(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && trazi()}
      />
      <button type="button" className="ikona-dugme" aria-label="Traži" onClick={trazi}>
        <Search size={18} strokeWidth={1.75} aria-hidden />
      </button>
      {saDetaljima && (
        <a href={`#${link('P4', ugao)}`} className="hide-m">
          više detalja
        </a>
      )}
    </div>
  )
}
