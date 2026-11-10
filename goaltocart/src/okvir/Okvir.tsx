// Okvir aplikacije: zaglavlje, navigacija, sadržaj, traka demoa, toast, panel, restart.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { DockProvider } from './DockKontekst'
import { BocnaNavigacija, DonjaNavigacija, Meni } from './Navigacija'
import { PanelOdDole, TrakaTelefon } from './TrakaTelefon'
import { TrakaDemoa } from './TrakaDemoa'
import { Zaglavlje } from './Zaglavlje'
import { Ikona } from '../komponente/Ikona'
import { usePrica } from '../prica/PricaProvider'

/** Tiha poruka (npr. "Simulated action — nothing was sent"); sadržaj je i u regionu za čitače ekrana. */
function Toast() {
  const { poruka } = usePrica()
  return (
    <div role="status" aria-live="polite" data-toast-region>
      {poruka && (
        <div className="toast" key={poruka.id} data-toast>
          <Ikona ime="info" sm />
          <span>
            {poruka.glavna}
            {poruka.dodatak ? ` · ${poruka.dodatak}` : ''}
          </span>
        </div>
      )}
    </div>
  )
}

/** Potvrda za Restart: "Restart the demo from step 1?" Yes / Cancel. */
function RestartProzor() {
  const { restartOtvoren, setRestartOtvoren, restart } = usePrica()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (restartOtvoren && !d.open) d.showModal()
    if (!restartOtvoren && d.open) d.close()
  }, [restartOtvoren])
  return (
    <dialog ref={ref} className="confirm" aria-labelledby="restart-naslov" onClose={() => setRestartOtvoren(false)}>
      <h3 id="restart-naslov">Restart the demo from step 1?</h3>
      <p className="muted">Your place in the story will be reset. The role you are viewing as stays the same.</p>
      <div className="btnrow">
        <button type="button" className="btn btn-secondary" onClick={() => setRestartOtvoren(false)}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={restart} data-restart-da>Yes</button>
      </div>
    </dialog>
  )
}

export function Okvir() {
  const { rezim, telefon } = usePrica()
  const loc = useLocation()
  const donjiRef = useRef<HTMLDivElement>(null)
  const glavniRef = useRef<HTMLElement>(null)

  // Visina donje trake kao CSS promenljiva (da toast stoji tačno iznad trake)
  useLayoutEffect(() => {
    const el = donjiRef.current
    if (!el) return
    const postavi = () => document.documentElement.style.setProperty('--bar-h', `${el.offsetHeight}px`)
    postavi()
    const ro = new ResizeObserver(postavi)
    ro.observe(el)
    return () => ro.disconnect()
  }, [telefon, rezim])

  // Nov ekran = vrh strane
  useEffect(() => {
    glavniRef.current?.scrollTo?.(0, 0)
  }, [loc.pathname])

  return (
    <DockProvider>
      <div className="app" data-rezim={rezim} data-telefon={telefon ? 'da' : 'ne'}>
        <a className="skip" href="#sadrzaj" onClick={(e) => { e.preventDefault(); glavniRef.current?.focus() }}>Skip to content</a>
        <Zaglavlje />
        <BocnaNavigacija />
        <main id="sadrzaj" className="main" ref={glavniRef} tabIndex={-1}>
          <Outlet />
        </main>
        <div className="bottom" ref={donjiRef}>
          {telefon ? rezim === 'guided' ? <TrakaTelefon /> : <DonjaNavigacija /> : <TrakaDemoa />}
        </div>
        <Toast />
        <PanelOdDole />
        <Meni />
        <RestartProzor />
      </div>
    </DockProvider>
  )
}
