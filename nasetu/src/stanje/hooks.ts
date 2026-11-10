// Mali pomoćni "hook-ovi" koje koristi više ekrana.
import { useNavigate } from 'react-router'
import { izborTrenutni } from './izvedeno'
import { useStanje } from './StanjeProvider'
import type { Uloga } from './tipovi'

/** Izbor koji uređuje aktivna uloga + prebacivanje lokacije u/iz izbora (samo produkcija i partner). */
export function useIzborLokacije() {
  const { stanje, salji } = useStanje()
  const izbor = izborTrenutni(stanje)
  const mozeDaDodaje = stanje.uloga === 'produkcija' || stanje.uloga === 'partner'
  const uIzboru = (id: string) => !!izbor?.lokacijaIds.includes(id)
  const prebaci = (id: string) => {
    if (uIzboru(id) && izbor) salji({ tip: 'UKLONI_IZ_IZBORA', izborId: izbor.id, lokacijaId: id })
    else salji({ tip: 'DODAJ_U_IZBOR', lokacijaId: id })
  }
  return { izbor, mozeDaDodaje, uIzboru, prebaci }
}

/** Menja ulogu i ide na dati link (npr. "Dodaj lokaciju" vodi vlasnika na unos lokacije). */
export function useIdiKao() {
  const { salji } = useStanje()
  const navigate = useNavigate()
  return (uloga: Uloga, ruta: string) => {
    salji({ tip: 'PROMENI_ULOGU', uloga })
    navigate(ruta)
  }
}
