// Z1 „Isticanje oglasa“ i Z2 „Paketi aukcija“ (UX 6.9): plaćene usluge platforme (LAŽNI prikaz). Isticanje daje oznaku „Istaknuto · plaćeno“; paket aukcija
// otključava javne aukcije. Cene su u dinarima sa PDV-om. Oba ekrana vode na isti ekran plaćanja (Z3), a posle potvrde (Z4) stanje se vidi u O6 i J3.
import { useNavigate } from 'react-router'
import { useState } from 'react'
import { useStanjePrice } from '../../demo/useStanje'
import { KarticaOglasa } from '../../komponente/KarticaOglasa'
import { Pilule } from '../../komponente/Kontrole'
import { Obavestenje } from '../../komponente/Obavestenje'
import { Veza, useLink } from '../../komponente/Veza'
import { Znacka } from '../../komponente/Znacka'
import { useEkran } from '../../okvir/kontekst'
import { broj, din } from '../../scenario/format'
import { CENE, DANI_ISTICANJA, PAKETI_AUKCIJA, PODRAZUMEVANI_PAKET_AUKCIJA, PODRAZUMEVANO_ISTICANJE_DANA, jeRezervisan, nadjiOglas } from '../../scenario/svet'
import { PREDMET_PRICE } from '../../tekstovi/okvir'
import { NemaStranice } from '../NemaStranice'

const aukcijaTekst = (n: number): string => (n === 1 ? 'aukcija' : n < 5 ? 'aukcije' : 'aukcija')

export function Z1() {
  const navigate = useNavigate()
  const l = useLink()
  const { parametri } = useEkran()
  const { s, tokovi, ja } = useStanjePrice()
  const [dana, setDana] = useState<number>(PODRAZUMEVANO_ISTICANJE_DANA)
  const trazeni = nadjiOglas(s, parametri.oglas, tokovi)
  const moji = s.oglasi.filter((o) => o.vlasnik === ja && !o.aukcija && !jeRezervisan(o)) // K1: predmet priče se ne ističe
  const [izbor, setIzbor] = useState<string>(trazeni && trazeni.vlasnik === ja && !trazeni.aukcija && !jeRezervisan(trazeni) ? trazeni.id : (moji[0]?.id ?? ''))
  if (parametri.oglas && !trazeni) return <NemaStranice />
  const oglas = moji.find((o) => o.id === izbor)
  const vecIstaknut = !!oglas && !!oglas.istaknuto
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="Z1">
      <h1>Isticanje oglasa</h1>
      {moji.length === 0 ? (
        <div className="stog" data-nema-oglasa>
          <Obavestenje>Nemaš oglas koji možeš da istakneš. Objavi oglas pa se vrati.</Obavestenje>
          <Veza ekran="O2" upit={{ novi: '1' }} className="dugme dugme-zeleno self-start">
            Novi oglas
          </Veza>
        </div>
      ) : (
        <>
          {trazeni && trazeni.vlasnik !== ja && <Obavestenje stanje="upozorenje">Možeš da istakneš samo svoj oglas. Izaberi jedan od svojih.</Obavestenje>}
          {trazeni && trazeni.vlasnik === ja && jeRezervisan(trazeni) && <Obavestenje stanje="upozorenje">{PREDMET_PRICE}. Izaberi drugi oglas za isticanje.</Obavestenje>}
          {moji.length > 1 && (
            <div className="grupa-polja">
              <span className="polje-oznaka">Oglas</span>
              <Pilule oznaka="Oglas za isticanje" vrednost={izbor} onChange={setIzbor} opcije={moji.map((o) => ({ v: o.id, naziv: o.naslov }))} />
            </div>
          )}
          <div className="grupa-polja">
            <span className="polje-oznaka">Koliko dana</span>
            <Pilule<string>
              oznaka="Trajanje isticanja"
              vrednost={String(dana)}
              onChange={(v) => setDana(Number(v))}
              opcije={DANI_ISTICANJA.map((d) => ({ v: String(d), naziv: `${broj(d)} dana — ${din(CENE.isticanje[d])}` }))}
            />
            <span className="pomocni-tekst">Cene su sa PDV-om.</span>
          </div>
          {oglas && (
            <div className="stog-sm" data-pregled-oznake>
              <p className="polje-oznaka">Tako će oglas izgledati</p>
              <KarticaOglasa oglas={{ ...oglas, istaknuto: oglas.istaknuto ?? 'red' }} />
              <div>
                <Znacka vrsta="istaknuto" />
              </div>
            </div>
          )}
          {vecIstaknut && <Obavestenje>Ovaj oglas je već istaknut. Novo plaćanje ga ističe iznova.</Obavestenje>}
          <div className="red-dugmad">
            <button
              type="button"
              className="dugme dugme-zeleno"
              aria-disabled={(!oglas) || undefined}
              onClick={() => {
                if (!oglas) return
                navigate(`${l('Z3', { svrha: 'isticanje', ref: oglas.id })}?dana=${dana}`)
                window.scrollTo(0, 0)
              }}
            >
              Nastavi
            </button>
            {!oglas && <span className="razlog-neaktivno">Izaberi oglas koji ističeš</span>}
            <Veza ekran="O6" className="dugme dugme-tekst">
              Moji oglasi
            </Veza>
          </div>
        </>
      )}
    </section>
  )
}

export function Z2() {
  const navigate = useNavigate()
  const l = useLink()
  const { tokovi } = useStanjePrice()
  const [paket, setPaket] = useState<number>(PODRAZUMEVANI_PAKET_AUKCIJA)
  return (
    <section className="kartica ekran-srednji stog" data-ekran-sadrzaj="Z2">
      <h1>Paketi aukcija</h1>
      <p>Paket otključava javne aukcije: svaka aukcija troši jednu iz paketa. U paketu imaš: <b className="num" data-u-paketu>{broj(tokovi.paketAukcija)}</b>.</p>
      <div className="paketi" role="group" aria-label="Paketi aukcija" data-paketi>
        {PAKETI_AUKCIJA.map((n) => (
          <button key={n} type="button" className="paket-kartica" aria-pressed={paket === n} data-paket={n} onClick={() => setPaket(n)}>
            <b className="num">{broj(n)}</b>
            <span>{aukcijaTekst(n)}</span>
            <span className="num">{din(CENE.paketiAukcija[n])}</span>
          </button>
        ))}
      </div>
      <p className="pomocni-tekst">Cene su sa PDV-om.</p>
      <div className="red-dugmad">
        <button
          type="button"
          className="dugme dugme-zeleno"
          onClick={() => {
            navigate(l('Z3', { svrha: 'paket', ref: String(paket) }))
            window.scrollTo(0, 0)
          }}
        >
          Kupi
        </button>
        <Veza ekran="J1" className="dugme dugme-tekst">
          Javne aukcije
        </Veza>
      </div>
    </section>
  )
}
