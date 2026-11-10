// Club profile (SP / BP): stavka navigacije koja nije među 49 ekrana iz UX.md. Samo izmišljeni podaci kluba i osoba za odobrenja.
import { Ekran } from '../../komponente/Ekran'
import { Kartica, Napomena, Red } from '../../komponente/Kartica'
import { ESCROW, KUPAC, PRODAVAC } from '../../scenario/strane'

export default function ProfilKluba({ uloga }: { uloga: 'selling' | 'buying' }) {
  const klub = uloga === 'selling' ? PRODAVAC : KUPAC
  return (
    <Ekran id={uloga === 'selling' ? 'SP' : 'BP'} naslov="Club profile" podnaslov={`${klub.naziv} · ${klub.zemlja}`}>
      <div className="grid g-1-1">
        <Kartica naslov="People with approval roles" id="osobe">
          {Object.values(klub.osobe).map((o) => (
            <Red key={o.uloga} naziv={o.uloga} opis={o.ime} />
          ))}
          <Napomena>All names are fictional. Payouts and account changes need two approvals from different people.</Napomena>
        </Kartica>
        <Kartica naslov="Escrow partner" id="partner">
          <Red naziv={ESCROW.naziv} opis={ESCROW.napomena} />
          <Red naziv="Account" opis={ESCROW.racunMaskiran} />
        </Kartica>
      </div>
    </Ekran>
  )
}
