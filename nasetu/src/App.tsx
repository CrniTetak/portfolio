// Spisak linkova (ruta). Hash linkovi (#/…) rade na svakom statičkom hostingu bez podešavanja.
import { HashRouter, Navigate, Route, Routes } from 'react-router'
import { GreskaOkvir } from './okvir/GreskaOkvir'
import { Okvir } from './okvir/Okvir'
import { StanjeProvider } from './stanje/StanjeProvider'

import Brief from './ekrani/javno/Brief'
import Katalog from './ekrani/javno/Katalog'
import Lokacija from './ekrani/javno/Lokacija'
import Pocetna from './ekrani/javno/Pocetna'
import Pravno from './ekrani/javno/Pravno'
import Ulaz from './ekrani/javno/Ulaz'
import PrimalacIzbora from './ekrani/javno/PrimalacIzbora'

import DeljenjeIzbora from './ekrani/produkcija/DeljenjeIzbora'
import Izbor from './ekrani/produkcija/Izbor'
import Izvidjanje from './ekrani/produkcija/Izvidjanje'
import Opcije from './ekrani/produkcija/Opcije'
import Predracun from './ekrani/produkcija/Predracun'
import Primeri from './ekrani/produkcija/Primeri'
import Rezervacija from './ekrani/produkcija/Rezervacija'
import Tabla from './ekrani/produkcija/Tabla'
import ZahtevRezervacije from './ekrani/produkcija/ZahtevRezervacije'

import VlasnikIzvidjanje from './ekrani/vlasnik/Izvidjanje'
import NovaLokacija from './ekrani/vlasnik/NovaLokacija'
import VlasnikPredracun from './ekrani/vlasnik/Predracun'
import VlasnikTabla from './ekrani/vlasnik/Tabla'
import VlasnikZahtev from './ekrani/vlasnik/Zahtev'

import PartnerTabla from './ekrani/partner/Tabla'

import AdminPredracun from './ekrani/admin/Predracun'
import AdminPregled from './ekrani/admin/Pregled'

export default function App() {
  return (
    <GreskaOkvir>
    <HashRouter>
      <StanjeProvider>
        <Routes>
          {/* ulazni ekran (izbor uloge i načina rada) je van okvira: nema trake priče */}
          <Route index element={<Ulaz />} />
          <Route element={<Okvir />}>
            {/* javni deo */}
            <Route path="pocetna" element={<Pocetna />} />
            <Route path="lokacije" element={<Katalog />} />
            <Route path="lokacije/:id" element={<Lokacija />} />
            <Route path="brief" element={<Brief />} />
            <Route path="izbor/:id" element={<Izbor />} />
            <Route path="izbor/:id/deljenje" element={<DeljenjeIzbora />} />
            <Route path="izbor/:id/primalac" element={<PrimalacIzbora />} />
            <Route path="primeri" element={<Primeri />} />
            <Route path="pravno" element={<Pravno />} />
            {/* produkcija */}
            <Route path="produkcija" element={<Tabla />} />
            <Route path="produkcija/opcije" element={<Opcije />} />
            <Route path="produkcija/zahtev/:lokacijaId" element={<ZahtevRezervacije />} />
            <Route path="produkcija/rezervacija/:id" element={<Rezervacija />} />
            <Route path="produkcija/predracun/:id" element={<Predracun />} />
            <Route path="produkcija/izvidjanje/:id" element={<Izvidjanje />} />
            {/* vlasnik */}
            <Route path="vlasnik" element={<VlasnikTabla />} />
            <Route path="vlasnik/zahtev/:id" element={<VlasnikZahtev />} />
            <Route path="vlasnik/izvidjanje/:id" element={<VlasnikIzvidjanje />} />
            <Route path="vlasnik/predracun/:id" element={<VlasnikPredracun />} />
            <Route path="vlasnik/nova-lokacija" element={<NovaLokacija />} />
            {/* partner (novi izbor koristi isti ekran kao deljenje izbora) */}
            <Route path="partner" element={<PartnerTabla />} />
            {/* admin */}
            <Route path="admin" element={<AdminPregled />} />
            <Route path="admin/predracun/:id" element={<AdminPredracun />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </StanjeProvider>
    </HashRouter>
    </GreskaOkvir>
  )
}
