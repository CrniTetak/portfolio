// P4 — Opcije: prva/druga (mesto u redu za isti termin), rok 72 h, osporavanje 24 h.
import { Bell, TriangleAlert } from 'lucide-react'
import { DugmeRadnje } from '../../komponente/DugmeRadnje'
import { OznakaOpcije } from '../../komponente/Faze'
import { Odbrojavanje } from '../../komponente/Odbrojavanje'
import { NaslovnaSlika } from '../../komponente/Slika'
import { Dugme, DugmeLink, Kartica, Naslov, Natpis, PraznoStanje, Stranica } from '../../komponente/osnovno'
import { SATI_OPCIJA, SATI_OSPORAVANJE } from '../../logika/konstante'
import { efektivniRok, jeZiva, pozicija, stanjeOpcije } from '../../logika/opcije'
import { terminTekst } from '../../logika/prikaz'
import { nadjiLokaciju } from '../../podaci/lokacije'
import { briefDelte, izborDelte, opcijeDelte, proveriTerminZaDeltu, zauzetiDani } from '../../stanje/izvedeno'
import { useStanje } from '../../stanje/StanjeProvider'

export default function Opcije() {
  const { stanje, salji } = useStanje()
  const brief = briefDelte(stanje)
  const izbor = izborDelte(stanje)
  // Prikazuju se žive i istekle opcije; otpuštene i pretvorene u zahtev nestaju iz liste
  const opcije = opcijeDelte(stanje)
    .filter((o) => o.stanje === 'aktivna')
    .sort((a, b) => (pozicija(stanje.opcije, a, stanje.sati) ?? 99) - (pozicija(stanje.opcije, b, stanje.sati) ?? 99) || a.postavljena - b.postavljena)

  const nasaPrvaNaLoftu = opcije.find((o) => o.lokacijaId === 'industrijski-loft' && jeZiva(o, stanje.sati))
  const moguSimulacija = !!nasaPrvaNaLoftu && pozicija(stanje.opcije, nasaPrvaNaLoftu, stanje.sati) === 1 && !nasaPrvaNaLoftu.osporavanje

  return (
    <Stranica>
      <Naslov podnaslov="Opcija drži termin 72 sata. Ako druga produkcija zatraži isti termin, imate 24 sata da potvrdite ili odustanete.">
        Opcije za: {brief ? `${brief.vrsta}, ${brief.grad}` : 'vaš zahtev'}
      </Naslov>

      {opcije.length === 0 ? (
        <PraznoStanje ikona={Bell} naslov="Nemate aktivnih opcija" tekst="U izboru kliknite „Traži opciju“.">
          <DugmeLink to={izbor ? `/izbor/${izbor.id}` : '/lokacije'}>{izbor ? 'Otvori izbor' : 'Pogledaj lokacije'}</DugmeLink>
        </PraznoStanje>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {opcije.map((o) => {
            const l = nadjiLokaciju(o.lokacijaId)
            if (!l) return null
            const st = stanjeOpcije(o, stanje.sati)
            const poz = pozicija(stanje.opcije, o, stanje.sati)
            const slobodan = proveriTerminZaDeltu(stanje, l.id, o.termin, zauzetiDani(stanje, l)).slobodan
            return (
              <div key={o.id} className="flex flex-col gap-2">
                {st === 'osporena' && (
                  <div className="rounded-dugme border-l-4 border-opasno bg-[#FDECEC] p-4" role="alert">
                    <p className="flex items-center gap-2 font-bold text-opasno"><TriangleAlert size={18} aria-hidden /> Druga produkcija traži isti termin.</p>
                    <p className="mt-1 text-mastilo">Imate 24 h: potvrdite rezervaciju ili odustanite.</p>
                    {o.osporavanje && <div className="mt-2 text-mastilo"><Odbrojavanje rok={o.osporavanje.rok} sada={stanje.sati} ukupno={SATI_OSPORAVANJE} prefiks="Preostalo" /></div>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {slobodan
                        ? <DugmeLink to={`/produkcija/zahtev/${l.id}`}>Potvrdi i zatraži rezervaciju</DugmeLink>
                        : <Dugme disabled zasto="Termin više nije slobodan.">Potvrdi i zatraži rezervaciju</Dugme>}
                      <Dugme vanPrice varijanta="opasno" onClick={() => salji({ tip: 'OTPUSTI_OPCIJU', opcijaId: o.id })}>Odustani od opcije</Dugme>
                    </div>
                  </div>
                )}
                <Kartica className={`overflow-hidden ${st === 'istekla' ? 'opacity-90' : ''}`}>
                  <div className="aspect-[16/7]"><NaslovnaSlika lokacija={l} /></div>
                  <div className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold">{l.naziv}</h2>
                      <OznakaOpcije stanje={st} pozicija={poz} />
                    </div>
                    <p className="text-sm text-sek">Termin: {terminTekst(o.termin)}</p>
                    {st === 'istekla' ? (
                      <>
                        <p className="font-semibold text-sek">{slobodan ? 'Istekla — termin je ponovo slobodan.' : 'Istekla.'}</p>
                        <div><Dugme vanPrice onClick={() => salji({ tip: 'OTPUSTI_OPCIJU', opcijaId: o.id })} varijanta="sekundarno">Ukloni</Dugme>{' '}
                          <Dugme vanPrice onClick={() => { salji({ tip: 'OTPUSTI_OPCIJU', opcijaId: o.id }); salji({ tip: 'TRAZI_OPCIJU', lokacijaId: l.id, termin: o.termin }) }} disabled={!slobodan}>Zatraži opet</Dugme></div>
                      </>
                    ) : (
                      <>
                        <Odbrojavanje rok={efektivniRok(o)} sada={stanje.sati} ukupno={st === 'osporena' ? SATI_OSPORAVANJE : SATI_OPCIJA} istekloTekst="Opcija je istekla" />
                        {poz === 2 && <p className="text-sm text-sek">Druga ste u redu za ovaj termin. Ako prva opcija istekne ili bude otpuštena, vi postajete prva.</p>}
                        {st === 'aktivna' && (
                          <div className="flex flex-wrap gap-2">
                            <DugmeLink to={`/produkcija/zahtev/${l.id}`}>Zatraži rezervaciju</DugmeLink>
                            <Dugme vanPrice varijanta="opasno" onClick={() => salji({ tip: 'OTPUSTI_OPCIJU', opcijaId: o.id })}>Otpusti opciju</Dugme>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Kartica>
              </div>
            )
          })}
        </div>
      )}

      {/* Samo za demonstratora: NIJE deo proizvoda */}
      <div className="mt-10 rounded-kartica border-2 border-dashed border-linija-j p-4">
        <Natpis>Za demonstratora (nije deo proizvoda)</Natpis>
        <DugmeRadnje id="osporavanje" varijanta="sekundarno" disabled={!moguSimulacija} zasto={!moguSimulacija ? 'Potrebna je vaša PRVA opcija na Industrijskom loftu bez osporavanja.' : null}
          slobodno={() => salji({ tip: 'SIMULIRAJ_DRUGU_PRODUKCIJU', lokacijaId: 'industrijski-loft' })}>
          Simuliraj: Produkcija Sigma traži isti termin
        </DugmeRadnje>
      </div>
    </Stranica>
  )
}
