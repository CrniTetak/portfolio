import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { PricaProvider } from './prica/PricaProvider'
import { App } from './App'
import './index.css'

// Hash ruta (#/selling/offers): radi na svakom statičkom hostingu bez podešavanja i osvežavanje nikad ne daje 404.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PricaProvider>
        <App />
      </PricaProvider>
    </HashRouter>
  </StrictMode>,
)
