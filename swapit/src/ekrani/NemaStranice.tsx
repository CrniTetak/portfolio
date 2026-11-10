// „Nema te stranice“: nepoznata adresa u linku nikad ne daje prazan ekran, nego jasnu poruku i povratak na početnu ugla.
import { Compass } from 'lucide-react'
import { Logo } from '../komponente/Logo'
import { Veza } from '../komponente/Veza'
import { useEkran } from '../okvir/kontekst'
import { KUCA } from '../pravila/rute'

export function NemaStranice() {
  const { ugao } = useEkran()
  return (
    <section className="kartica mx-auto max-w-xl text-center" data-ekran-sadrzaj="NEMA" data-nema-stranice>
      <div className="mb-4 flex justify-center">
        <Logo sirina={160} />
      </div>
      <Compass size={40} strokeWidth={1.5} aria-hidden className="mx-auto" />
      <h1 className="mt-2">Nema te stranice</h1>
      <p className="mx-auto mt-3 max-w-md">Adresa koju si otvorio ne postoji u ovom demou. Možda je link pogrešno prepisan.</p>
      <div className="mt-6 flex justify-center">
        <Veza ekran={KUCA[ugao]} className="dugme dugme-zeleno">
          Nazad na početnu
        </Veza>
      </div>
    </section>
  )
}
