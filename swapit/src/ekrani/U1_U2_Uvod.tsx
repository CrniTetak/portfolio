// U1 „Šta je ovo“ i U2 „Uđi u demo“ (UX 1.2, 6.1). Link otvaraju i ljudi bez vlasnika, pa prvo vide U1, tek onda U2.
// U2: izbor režima („Vođena priča“ / „Slobodno klikanje“) i ugla (Ana · Marko · Prodavnica · Moderacija).
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useDemo } from '../demo/DemoProvider'
import { Logo } from '../komponente/Logo'
import { Dijalog } from '../okvir/Dijalozi'
import { useEkran } from '../okvir/kontekst'
import { link } from '../pravila/rute'
import { NAZIV_UGLA, UGLOVI, type Rezim, type Ugao } from '../prica/tipovi'
import { broj } from '../scenario/format'
import { svet } from '../scenario/svet'
import { U1_KORACI, U1_NASLOV, U1_OD_CEGA_ZIVI, U1_PODNASLOV, U1_STA_JE_OVO, U1_STA_RESAVA } from '../scenario/stranice'

const OPIS_UGLA: Record<Ugao, string> = {
  ana: 'Nova na SWAPIT-u: nalog, oglas, ponuda, lanac razmene, primopredaja i poeni.',
  marko: 'Stari član: prima ponudu, odbija je i vidi kako se iz odbijanja rađa lanac.',
  prodavnica: 'Firma: poslovni nalog, akcija „staro za novo“ i reklama „Sponzorisano“.',
  moderacija: 'Moderatorka: prijava oglasa, odluka i obrazloženje koje korisnik vidi.',
}

export function U1() {
  const { ugao } = useEkran()
  const demo = useDemo()
  const s = svet(demo.poz, demo.tokovi)
  return (
    <section className="kartica mx-auto max-w-4xl stog" data-ekran-sadrzaj="U1">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Logo sirina={200} />
        </div>
        <h1>{U1_NASLOV}</h1>
        <p className="mx-auto mt-3 max-w-xl">{U1_PODNASLOV}</p>
      </div>
      <ol className="u1-koraci" aria-label="Tri koraka" data-u1-koraci>
        {U1_KORACI.map((k, i) => (
          <li key={k.naslov} className="u1-korak">
            <span className="u1-broj" aria-hidden>
              {i + 1}
            </span>
            <h2>{k.naslov}</h2>
            <p className="pomocni-tekst">{k.opis}</p>
          </li>
        ))}
      </ol>
      <div className="dva-stupca dva-stupca-jednaka">
        <section className="kartica kartica-mirna stog-sm" aria-label="Šta je ovo" data-u1-sta-je-ovo>
          <h2>Šta je ovo?</h2>
          <p>{U1_STA_JE_OVO}</p>
          <p className="text-ink-2">
            Razmenjeno stvari: <b className="num">{broj(s.razmenjenoStvari)}</b> <span className="znacka znacka-model">ilustrativno, izmišljeno</span>
          </p>
        </section>
        <section className="kartica kartica-mirna stog-sm" aria-label="Šta rešava" data-u1-sta-resava>
          <h2>Šta rešava</h2>
          <ul className="lista-pravila">
            {U1_STA_RESAVA.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="kartica kartica-mirna stog-sm" aria-label="Od čega platforma živi" data-u1-od-cega>
        <h2>Od čega platforma živi</h2>
        <p>{U1_OD_CEGA_ZIVI}</p>
      </section>
      <div className="flex flex-wrap justify-center gap-3">
        <a className="dugme dugme-zeleno" href={`#${link('U2', ugao)}`}>
          Pogledaj demo
        </a>
        <a className="dugme dugme-linija" href={`#${link('U3', ugao)}`}>
          Šta demo jeste, a šta nije
        </a>
      </div>
    </section>
  )
}

export function U2() {
  const demo = useDemo()
  const navigate = useNavigate()
  const { ugao: ugaoIzLinka } = useEkran()
  const [rezim, setRezim] = useState<Rezim>(demo.rezim)
  const [ugao, setUgao] = useState<Ugao>(ugaoIzLinka)
  const [potvrda, setPotvrda] = useState(false)
  const udji = () => {
    const ekran = demo.ulaz(ugao, rezim)
    navigate(link(ekran, ugao))
    window.scrollTo(0, 0)
  }
  return (
    <section className="kartica mx-auto max-w-3xl" data-ekran-sadrzaj="U2">
      <h1>Uđi u demo</h1>
      <h2 className="mt-4">Kako želiš da gledaš?</h2>
      <div className="mt-2 flex flex-wrap gap-3" role="group" aria-label="Režim">
        {(
          [
            ['vodjena', 'Vođena priča', 'Traka vodi korak po korak, od oglasa do recenzije.'],
            ['slobodno', 'Slobodno klikanje', 'Sve je otvoreno; traka priče ostaje sažeta.'],
          ] as const
        ).map(([id, naziv, opis]) => (
          <button key={id} type="button" className={`dugme ${rezim === id ? 'dugme-plavo' : 'dugme-linija'}`} aria-pressed={rezim === id} onClick={() => setRezim(id)}>
            {naziv}
            <span className="sr-only"> — {opis}</span>
          </button>
        ))}
      </div>
      <h2 className="mt-6">Čije oči?</h2>
      <div className="mt-2 grid gap-3 md:grid-cols-2" role="group" aria-label="Ugao">
        {UGLOVI.map((u) => (
          <button key={u} type="button" className={`kartica text-left ${ugao === u ? 'outline outline-2 outline-blue' : ''}`} aria-pressed={ugao === u} onClick={() => setUgao(u)}>
            <h3>{NAZIV_UGLA[u]}</h3>
            <span className="pomocni-tekst">{OPIS_UGLA[u]}</span>
          </button>
        ))}
      </div>
      <div className="mt-6">
        <button
          type="button"
          className="dugme dugme-zeleno"
          onClick={() => (demo.imaNapredak ? setPotvrda(true) : udji())}
        >
          Uđi u demo
        </button>
      </div>
      {/* PK11: usred priče ulazak briše napredak, pa se traži potvrda kao kod Restarta; prvi ulaz je bez potvrde */}
      {potvrda && (
        <Dijalog naslov="Početi demo iz početka?" onZatvori={() => setPotvrda(false)}>
          <p className="mb-4">Tvoje mesto u priči i sve što si probao slobodno biće obrisano. Izabrani režim i ugao važe od novog početka.</p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="dugme dugme-zeleno"
              onClick={() => {
                setPotvrda(false)
                udji()
              }}
            >
              Da, počni iz početka
            </button>
            <button type="button" className="dugme dugme-linija" data-prvi-fokus onClick={() => setPotvrda(false)}>
              Odustani
            </button>
          </div>
        </Dijalog>
      )}
    </section>
  )
}
