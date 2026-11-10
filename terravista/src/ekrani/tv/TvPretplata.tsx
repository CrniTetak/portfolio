// T13 QR, T14 Kanal je otključan, T15 Paketi, T16 Stranica paketa, T19 Moje pretplate, T20 Otkaz izvršen,
// T25 Zemlja (demo izbor), T26 Dobrodošao u Grčku, T27 Dobrodošao u Srbiju (talas 1).
import { Play } from '../../okvir/Ikone'
import { useAkcija } from '../../okvir/akcija'
import { useDemo } from '../../okvir/stanje'
import { useToast } from '../../okvir/Toast'
import { KarticaPaketa } from '../../komponente/tv/Kartice'
import { PlocicaLogotipa } from '../../komponente/tv/PlocicaLogotipa'
import { QrDemo } from '../../komponente/tv/QrDemo'
import { Red } from '../../komponente/tv/Red'
import { TvGrupa, TvStrana } from '../../komponente/tv/TvStrana'
import { Znacka } from '../../komponente/tv/Znacka'
import { cenaMesecno } from '../../podaci/format'
import { CENA_ZAVISI_OD_ZEMLJE, NEDOSTUPNO, SA_PDV } from '../../podaci/stalni-tekstovi'
import {
  DEMO_KODOVI,
  KANALI,
  KANAL_GLAVNI,
  PAKET_PRICE,
  PAKETI,
  ZEMLJE,
  dostupan,
  kanal,
  nedostupniU,
  paket,
  proizvod,
  zemlja,
} from '../../podaci/svet'
import { sastavi, type Parametri } from '../../pravila/ekrani'
import { TvFokus } from '../../tv-navigacija/fokus'
import { useTvRuta } from '../../tv-navigacija/ruta'

type Svojstva = { parametri: Parametri }

export function T13Qr({ parametri }: Svojstva) {
  const akcija = useAkcija()
  const d = useDemo()
  const { nazad } = useTvRuta()
  const p = proizvod(parametri.proizvod)!
  return (
    <TvStrana id="T13" trenutni="T5">
      <TvGrupa klasa="qr-strana">
        <div className="qr-leva">
          <QrDemo />
          <p className="tv-napomena">
            ili idi na {DEMO_KODOVI.adresaZaKod} i unesi kod {DEMO_KODOVI.tvKod}
          </p>
        </div>
        <div className="qr-desna">
          <ol className="qr-koraci">
            <li>Skeniraj kod telefonom</li>
            <li>Potvrdi pretplatu</li>
            <li>Kanal se otključava ovde</li>
          </ol>
          <p className="meta">
            Pretplata: {p.naziv} — {cenaMesecno(p.cena)}, sa PDV-om. Otkaz bilo kad.
          </p>
          <div className="kanal-dugmad">
            <TvFokus
              id="qr-skeniraj"
              etiketa="Skeniraj telefonom (demo)"
              className="tv-dugme tv-dugme--glavno"
              data-radnja="skeniraj"
              onAktiviraj={() => akcija('skeniraj', () => d.otvoriNaTelefonu(sastavi('P2', { proizvod: p.id })), { proizvod: p.id })}
            >
              Skeniraj telefonom (demo)
            </TvFokus>
            <TvFokus id="qr-nazad" etiketa="Nazad" className="tv-dugme tv-dugme--sporedno" onAktiviraj={nazad}>
              Nazad
            </TvFokus>
          </div>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T14Otkljucano({ parametri }: Svojstva) {
  const { idi } = useTvRuta()
  const d = useDemo()
  const k = kanal(parametri.id)
  // kanal više nije pretplaćen (npr. otkazan pa „Nazad“): umesto potvrde prikazuje se stranica kanala
  if (!d.jePretplacenKanal(k.id, k.paket)) return null // preusmerava ruter (ekrani/index.tsx)
  return (
    <TvStrana id="T14" trenutni="T5">
      <TvGrupa klasa="potvrda">
        <PlocicaLogotipa kanalId={k.id} velicina="kartica" />
        <h1 className="tv-naslov-ekrana">{k.naziv} je otključan</h1>
        <p className="meta">Pretplata aktivna · {cenaMesecno(proizvod(k.id)!.cena)} · otkaz bilo kad</p>
        <div className="kanal-dugmad">
          <TvFokus id="otkljucano-gledaj" etiketa="Gledaj sada" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T9', { id: k.id }))}>
            <Play className="ic" aria-hidden="true" />
            Gledaj sada
          </TvFokus>
          <TvFokus id="otkljucano-pretplate" etiketa="Moje pretplate" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T19'))}>
            Moje pretplate
          </TvFokus>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T15Paketi() {
  const akcija = useAkcija()
  const d = useDemo()
  const { idi } = useTvRuta()
  const prikazi = (vrsta: 'zemlja' | 'zanr', naslov: string, napomena: string) => (
    <Red naslov={naslov} napomena={napomena}>
      {PAKETI.filter((p) => p.vrsta === vrsta).map((p, i) => (
        <KarticaPaketa
          key={p.id}
          paketId={p.id}
          pretplacen={d.pretplate.paketi.includes(p.id)}
          fokusId={`paket-${p.id}`}
          red={`paketi-${vrsta}`}
          indeks={i}
          radnja={p.id === PAKET_PRICE.id ? 'otvori-paket-price' : undefined}
          onAktiviraj={() => {
            const dalje = () => idi(sastavi('T16', { id: p.id }))
            if (p.id === PAKET_PRICE.id) akcija('otvori-paket-price', dalje)
            else dalje()
          }}
        />
      ))}
    </Red>
  )
  return (
    <TvStrana id="T15" trenutni="T15">
      {prikazi('zemlja', 'Po zemlji', 'mesečno')}
      {prikazi('zanr', 'Po žanru', 'mesečno')}
      <TvGrupa>
        <p className="tv-napomena">
          {CENA_ZAVISI_OD_ZEMLJE} {SA_PDV} Otkaz bilo kad.
        </p>
      </TvGrupa>
    </TvStrana>
  )
}

export function T16Paket({ parametri }: Svojstva) {
  const akcija = useAkcija()
  const d = useDemo()
  const { idi } = useTvRuta()
  const { pokazi } = useToast()
  const p = paket(parametri.id)
  const jeGlavni = p.id === PAKET_PRICE.id
  const pretplacen = d.pretplate.paketi.includes(p.id)
  const radi = ZEMLJE.filter((z) => p.kanali.every((k) => dostupan(k, z.kod))).map((z) => z.naziv)
  return (
    <TvStrana id="T16" trenutni="T15">
      <TvGrupa klasa="kanal-strana">
        <div className="kanal-leva">
          <h1 className="tv-naslov-ekrana">{p.naziv}</h1>
          <span className="kartica-paketa-cena">{cenaMesecno(proizvod(p.id)!.cena)}</span>
          <p className="tv-napomena">
            {CENA_ZAVISI_OD_ZEMLJE} {SA_PDV}
          </p>
          {pretplacen ? <Znacka vrsta="pretplacen">Pretplaćen</Znacka> : <Znacka vrsta="besplatno">Otkaz bilo kad</Znacka>}
        </div>
        <div className="kanal-sredina">
          <div className="paket-kanali">
            {p.kanali.map((k) => (
              <div key={k.id} className="paket-kanal">
                <PlocicaLogotipa kanalId={k.id} velicina="vodic" />
                <span className="meta">Uživo · Gledanje unazad: {k.gledanjeUnazad ? 'da' : 'ne'} (primer)</span>
              </div>
            ))}
          </div>
          <p className="meta">Radi u: {radi.join(', ')} (primer)</p>
          <div className="kanal-dugmad">
            {pretplacen ? (
              <TvFokus id="paket-glavno" etiketa="Gledaj" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T9', { id: p.kanali[0].id }))}>
                <Play className="ic" aria-hidden="true" />
                Gledaj
              </TvFokus>
            ) : (
              <TvFokus
                id="paket-glavno"
                etiketa="Pretplati se"
                className="tv-dugme tv-dugme--glavno"
                data-radnja={jeGlavni ? 'pretplati-paket' : undefined}
                onAktiviraj={() => {
                  const dalje = () => {
                    d.otvoriNaTelefonu(sastavi('P3', { proizvod: p.id }))
                    pokazi('Nastavi na telefonu')
                  }
                  if (jeGlavni) akcija('pretplati-paket', dalje)
                  else dalje()
                }}
              >
                Pretplati se
              </TvFokus>
            )}
          </div>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T19Pretplate() {
  const akcija = useAkcija()
  const d = useDemo()
  const { idi } = useTvRuta()
  const redovi = [...d.pretplate.kanali, ...d.pretplate.paketi].map((id) => proizvod(id)!).filter(Boolean)
  return (
    <TvStrana id="T19" trenutni="T19">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Moje pretplate</h1>
        {redovi.length === 0 ? (
          <>
            <p>Nemaš plaćenih pretplata. Besplatni kanali rade bez pretplate.</p>
            <TvFokus id="pretplate-prvi" etiketa="Kanali" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T5'))}>
              Kanali
            </TvFokus>
          </>
        ) : (
          <ul className="pretplate-lista">
            {redovi.map((r, i) => (
              <li key={r.id} className="pretplata-red">
                <span className="pretplata-logo">
                  {r.kanali.map((k) => (
                    <PlocicaLogotipa key={k.id} kanalId={k.id} velicina="mala" />
                  ))}
                </span>
                <span className="pretplata-tekst">
                  <span className="vodic-naziv">{r.naziv}</span>
                  <span className="meta">
                    {r.vrsta === 'kanal' ? 'Kanal' : 'Paket'} · {cenaMesecno(r.cena)} · Sledeće plaćanje: kraj meseca (primer)
                  </span>
                </span>
                <TvFokus
                  id={i === 0 ? 'pretplate-prvi' : `pretplata-otkazi-${r.id}`}
                  etiketa={`Otkaži: ${r.naziv}`}
                  className="tv-dugme tv-dugme--glavno"
                  data-radnja={r.vrsta === 'kanal' ? 'otkazi-kanal' : undefined}
                  onAktiviraj={() => {
                    if (r.vrsta === 'paket') {
                      // paket se otkazuje na telefonu: telefon se otvara na „Moje pretplate“
                      d.otvoriNaTelefonu(sastavi('P8'))
                      return
                    }
                    const otkazi = () => {
                      d.operacija('otkazi', r.id)
                      idi(sastavi('T20', { id: r.id }))
                    }
                    if (r.id === KANAL_GLAVNI.id) akcija('otkazi-kanal', otkazi)
                    else otkazi()
                  }}
                >
                  Otkaži
                </TvFokus>
              </li>
            ))}
          </ul>
        )}
        <p className="tv-napomena">Kanal otkazuješ jednim klikom ovde; paket na telefonu. Bez dodatnih pitanja.</p>
      </TvGrupa>
    </TvStrana>
  )
}

export function T20Otkazano({ parametri }: Svojstva) {
  const akcija = useAkcija()
  const { idi } = useTvRuta()
  const p = proizvod(parametri.id)!
  return (
    <TvStrana id="T20" trenutni="T19">
      <TvGrupa klasa="potvrda">
        <h1 className="tv-naslov-ekrana">Otkazano: {p.naziv}</h1>
        <p>Gledaš do kraja plaćenog perioda (primer). Posle toga kanal više nije dostupan.</p>
        <p className="meta">Bez dodatnih koraka i bez ponuda.</p>
        <div className="kanal-dugmad">
          <TvFokus
            id="otkazano-u-redu"
            etiketa="U redu"
            className="tv-dugme tv-dugme--glavno"
            data-radnja="u-redu"
            onAktiviraj={() => akcija('u-redu', () => idi(sastavi('T19')))}
          >
            U redu
          </TvFokus>
          <TvFokus id="otkazano-pocetna" etiketa="Početna" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T2'), { koren: true })}>
            Početna
          </TvFokus>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}

export function T25Zemlja() {
  const d = useDemo()
  const opis: Record<string, string> = { DE: 'kod kuće', GR: 'na letovanju', RS: 'kod rodbine' }
  const izbor = ['DE', 'GR', 'RS'] as const
  return (
    <TvStrana id="T25" trenutni="T21">
      <TvGrupa>
        <h1 className="tv-naslov-ekrana">Gde gledaš?</h1>
        <div className="zemlje-kartice">
          {izbor.map((kod) => {
            const radnja = kod === 'GR' ? 'izaberi-grcku' : kod === 'RS' ? 'izaberi-srbiju' : undefined
            return (
              <TvFokus
                key={kod}
                id={`zemlja-${kod === 'DE' ? 'nemacka' : kod === 'GR' ? 'grcka' : 'srbija'}`}
                red="zemlje"
                indeks={izbor.indexOf(kod)}
                etiketa={zemlja(kod).naziv}
                className="zemlja-kartica"
                data-radnja={radnja}
                onAktiviraj={() => d.izaberiZemlju(kod)}
              >
                {zemlja(kod).naziv} ({opis[kod]})
              </TvFokus>
            )
          })}
        </div>
        <p className="tv-napomena">Demo: ovde menjaš zemlju da vidiš kako se menja ponuda.</p>
      </TvGrupa>
    </TvStrana>
  )
}

export function T26Grcka() {
  const { idi } = useTvRuta()
  return (
    <TvStrana id="T26" trenutni="T21">
      <TvGrupa klasa="potvrda">
        <h1 className="tv-naslov-ekrana">Dobrodošao u {zemlja('GR').akuzativ}</h1>
        <p>Tvoje pretplate rade kao kod kuće (primer).</p>
        <p className="meta">
          Radi: {KANAL_GLAVNI.naziv}, {PAKET_PRICE.naziv}, besplatni kanali
        </p>
        <TvFokus id="grcka-pocetni" etiketa="Na početni ekran" className="tv-dugme tv-dugme--glavno" onAktiviraj={() => idi(sastavi('T2'), { koren: true })}>
          Na početni ekran
        </TvFokus>
      </TvGrupa>
    </TvStrana>
  )
}

export function T27Srbija() {
  const akcija = useAkcija()
  const { idi } = useTvRuta()
  const rade = [PAKET_PRICE.naziv, ...KANALI.filter((k) => k.deo === 'besplatni' && dostupan(k, 'RS')).map((k) => k.naziv)]
  const nijeDostupno = nedostupniU('RS').map((k) => k.naziv)
  return (
    <TvStrana id="T27" trenutni="T21">
      <TvGrupa klasa="potvrda">
        <h1 className="tv-naslov-ekrana">Dobrodošao u {zemlja('RS').akuzativ}</h1>
        <p>Deo kanala nije dostupan. {NEDOSTUPNO}</p>
        <div className="dve-liste">
          <p className="meta">Radi: {rade.join(', ')}, …</p>
          <p className="meta">Nije dostupno: {nijeDostupno.join(', ')} (primer)</p>
        </div>
        <div className="kanal-dugmad">
          <TvFokus
            id="srbija-doma"
            etiketa={`Pogledaj ${KANAL_GLAVNI.naziv}`}
            className="tv-dugme tv-dugme--glavno"
            data-radnja="pogledaj-nedostupan"
            onAktiviraj={() => akcija('pogledaj-nedostupan', () => idi(sastavi('T12', { id: KANAL_GLAVNI.id })))}
          >
            Pogledaj {KANAL_GLAVNI.naziv}
          </TvFokus>
          <TvFokus id="srbija-pocetni" etiketa="Na početni ekran" className="tv-dugme tv-dugme--sporedno" onAktiviraj={() => idi(sastavi('T2'), { koren: true })}>
            Na početni ekran
          </TvFokus>
        </div>
      </TvGrupa>
    </TvStrana>
  )
}
