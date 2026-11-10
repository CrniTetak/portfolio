// S8: ekran koji u priči radi drugi ugao nikad nije prazan: kaže ko ga radi i nudi „Gledaj kao …“ (ostaje na istom ekranu).
import { useEkran, usePromenaUgla } from '../okvir/kontekst'
import { NAZIV_UGLA, type Ugao } from '../prica/tipovi'
import { Obavestenje } from './Obavestenje'
import { Veza } from './Veza'

export function OvoRadi({ ko, naslov, opis, nazad }: { ko: Ugao; naslov: string; opis?: string; nazad?: { ekran: string; naziv: string } }) {
  const promeniUgao = usePromenaUgla()
  const { ugao } = useEkran()
  return (
    <section className="kartica ekran-uzak stog" data-ekran-sadrzaj="ovo-radi" data-ovo-radi={ko}>
      <h1>{naslov}</h1>
      <Obavestenje>
        <b>
          Ovo radi {NAZIV_UGLA[ko]} — Gledaj kao {NAZIV_UGLA[ko]}.
        </b>{' '}
        {opis}
      </Obavestenje>
      <div className="red-dugmad">
        <button type="button" className="dugme dugme-plavo" onClick={() => promeniUgao(ko, true)}>
          Gledaj kao {NAZIV_UGLA[ko]}
        </button>
        {nazad && (
          <Veza ekran={nazad.ekran} className="dugme dugme-linija">
            {nazad.naziv}
          </Veza>
        )}
      </div>
      <p className="pomocni-tekst">Sada gledaš kao: {NAZIV_UGLA[ugao]}.</p>
    </section>
  )
}
