import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Fontovi su u samom prototipu (bez Google servera): Plus Jakarta Sans (jedini font, i u traci priče); latin + latin-ext (č, ć, š, ž, đ).
import '@fontsource-variable/plus-jakarta-sans/wght.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
