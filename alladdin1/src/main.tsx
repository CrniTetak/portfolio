import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import { App } from './App'
import { DemoProvider } from './demo/DemoProvider'
import './index.css'

// Hash ruta (#/organizer/account/passengers): radi na svakom statičkom hostingu bez podešavanja; osvežavanje nikad ne daje 404.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <DemoProvider>
        <App />
      </DemoProvider>
    </HashRouter>
  </StrictMode>,
)
