import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { App } from './App'
import { DemoProvider, primeniTemu } from './demo/DemoProvider'
import { ucitaj } from './demo/cuvanje'
import { predUcitajEkrane } from './ekrani'
import './index.css'

// Tema se primenjuje pre prvog iscrtavanja, da osvežavanje ne „bljesne“ pogrešnom temom.
primeniTemu(ucitaj().tema)

// Hash ruta (#/ana/pocetna): radi na svakom statičkom hostingu bez podešavanja; osvežavanje nikad ne daje 404.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <DemoProvider>
        <App />
      </DemoProvider>
    </HashRouter>
  </StrictMode>,
)

// Ostali moduli ekrana se tiho dovlače u pozadini posle prvog prikaza (deljenje paketa, talas 4).
predUcitajEkrane()
