// P6 — Predračun (produkcija): naknada za rezervaciju ili izbor van kataloga. Nema dugmeta "Plati".
import { useParams } from 'react-router'
import { PredracunKartica } from '../../komponente/PredracunKartica'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { NedostajeObjekat } from '../../komponente/KorakNijePoceo'
import { Dugme, DugmeLink, Kartica, Naslov, Natpis, Stranica } from '../../komponente/osnovno'
import { opisTermina } from '../../logika/prikaz'
import { nazivAktera } from '../../podaci/akteri'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { useIdiKao } from '../../stanje/hooks'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Predracun() {
  const { id = '' } = useParams()
  const { stanje, salji, vodjeno } = useStanje()
  const idiKao = useIdiKao()
  const p = stanje.predracuni.find((x) => x.id === id)
  if (!p || p.kupacId !== 'delta') return <NedostajeObjekat korak={7} ka="/produkcija" />
  const z = p.zahtevId ? stanje.zahtevi.find((x) => x.id === p.zahtevId) : undefined
  const l = z ? nadjiLokaciju(z.lokacijaId) : undefined
  const placeno = p.uplataPotvrdjena !== null
  const naknada = p.vrsta === 'naknada' && !!z
  const otkazano = z?.stanje === 'otkazao-vlasnik'

  return (
    <Stranica uzak>
      <Naslov>Vaš predračun</Naslov>
      <PredracunKartica predracun={p} kupac={nazivAktera(p.kupacId)} lokacija={l?.naziv ?? ''} opisCene={z ? opisTermina(z.termin) : ''} />
      <Kartica className="mx-auto mt-6 flex max-w-[720px] flex-col items-start gap-3 p-5">
        {otkazano ? (
          <>
            <p className="font-semibold text-mastilo">Rezervacija je otkazana (vlasnik); naknada se vraća (izmišljeno).</p>
            <DugmeLink to={`/produkcija/rezervacija/${z!.id}`}>Pogledaj otkazanu rezervaciju</DugmeLink>
          </>
        ) : placeno ? (
          <>
            <p className="font-semibold">{naknada ? 'Uplata je potvrđena. Adresa i kontakt vlasnika su otvoreni.' : 'Uplata je potvrđena.'}</p>
            {naknada && <DugmeLink to={`/produkcija/rezervacija/${z!.id}`}>Otvori rezervaciju</DugmeLink>}
          </>
        ) : (
          <>
            <p className="font-semibold text-mastilo">{naknada ? 'Adresa i kontakt vlasnika otvaraju se kad potvrdimo uplatu.' : 'Uplata se potvrđuje u ulozi Admin (u prototipu).'}</p>
            {naknada && <DugmeLink to={`/produkcija/rezervacija/${z!.id}`} varijanta="sekundarno">Pogledaj rezervaciju</DugmeLink>}
          </>
        )}
      </Kartica>
      {/* Samo za demonstratora: u prototipu nema "Plati", uplatu potvrđuje Admin */}
      {!placeno && !otkazano && (
        <div className="mx-auto mt-6 max-w-[720px] rounded-kartica border-2 border-dashed border-linija-j p-4">
          <Natpis>Za demonstratora (nije deo proizvoda)</Natpis>
          <p className="mb-3 text-sm text-sek">{vodjeno ? 'Uplatu potvrđuje Nasetu tim; u prototipu se to simulira jednim klikom.' : 'Uplata se potvrđuje u ulozi Admin (u prototipu), ili jednim klikom ovde.'}</p>
          <div className="flex flex-wrap items-start gap-3">
            {naknada && (
              <DugmeRadnje id="uplata" primarno varijanta="sekundarno" slobodno={() => salji({ tip: 'POTVRDI_UPLATU', predracunId: p.id })}>
                Simuliraj: Nasetu potvrđuje uplatu
              </DugmeRadnje>
            )}
            {!vodjeno && <Dugme varijanta="sekundarno" onClick={() => idiKao('admin', `/admin/predracun/${p.id}`)}>Idi u Admin</Dugme>}
          </div>
        </div>
      )}
    </Stranica>
  )
}
