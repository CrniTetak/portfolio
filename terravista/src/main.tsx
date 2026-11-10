import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { App } from './App'
import { Greska } from './okvir/Greska'
import './index.css'

// Hash ruta (#/tv/pocetna): radi na svakom statičkom hostingu bez podešavanja; osvežavanje nikad ne daje 404.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Greska>
      <HashRouter>
        <App />
      </HashRouter>
    </Greska>
  </StrictMode>,
)
