// Red korisnika: avatar, korisničko ime (link na profil), Verifikovan i Građanin / Firma.
import { Inicijali } from './Inicijali'
import { Veza } from './Veza'
import { Znacka } from './Znacka'
import { KORISNIK_PO_ID } from '../scenario/svet'

export function KorisnikRed({ id, velicina = 40, bezZnacki = false }: { id: string; velicina?: number; bezZnacki?: boolean }) {
  const postoji = Object.hasOwn(KORISNIK_PO_ID, id)
  return (
    <span className="flex items-center gap-3">
      <Inicijali ime={id} velicina={velicina} />
      <span>
        {postoji ? (
          <Veza ekran="N1" parametri={{ korisnik: id }} className="font-extrabold">
            {id}
          </Veza>
        ) : (
          <b>{id}</b>
        )}
        {!bezZnacki && (
          <span className="znacke mt-1">
            <Znacka vrsta="verifikovan" />
            <Znacka vrsta="gradjanin" />
          </span>
        )}
      </span>
    </span>
  )
}
