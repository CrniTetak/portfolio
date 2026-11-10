// Dijalozi (UI 7.14): Restart (Yes/Cancel) i "Enter demo as…" (izbor uloge za gosta i za "Switch role"). Esc zatvara, fokus ostaje unutra.
import { useRef, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { PORUKA_SIMULACIJE, useDemo } from '../demo/DemoProvider'
import { Dugme } from '../komponente/Dugme'
import { KUCA, NAZIV_ULOGE, RUTA_PO_ID, link } from '../pravila/rute'
import { POCETNA_POZICIJA } from '../prica/reducer'
import type { Uloga } from '../prica/tipovi'
import { PORUKE_SAVETNIKU } from '../tekstovi/poruke'
import { useEkran } from './kontekst'
import { useFocusTrap } from './useFocusTrap'

function Dijalog({ naslov, onZatvori, children }: { naslov: string; onZatvori: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  // fokus, Esc, Tab u krug, inertna pozadina i povratak fokusa: jedna implementacija (kao panel priče)
  useFocusTrap(ref, true, onZatvori)
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" data-dijalog>
      <button type="button" tabIndex={-1} aria-hidden="true" className="absolute inset-0 bg-bg-0/62" onClick={onZatvori} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={naslov} className="card relative w-full max-w-md shadow-2xl">
        <h2 className="naslov-kartice">{naslov}</h2>
        {children}
      </div>
    </div>
  )
}

export function Dijalozi() {
  const demo = useDemo()
  const { id, uloga } = useEkran()
  const navigate = useNavigate()

  const idiNa = (u: Uloga, ekran?: string) => {
    const cilj = ekran ?? (RUTA_PO_ID[id]?.uloge.includes(u) && id !== 'S1' ? id : u === 'guest' ? KUCA.guest : demo.ekranZa(u))
    navigate(link(cilj, u))
    window.scrollTo(0, 0)
    if (u !== uloga) demo.obavesti(`Switched to the ${NAZIV_ULOGE[u]} view`)
  }

  if (demo.dijalogPoruka)
    return (
      <Dijalog naslov="Message your advisor" onZatvori={() => demo.otvoriPoruku(false)}>
        <p className="mb-4 text-ink-2">Pick one of the ready-made messages. Nothing is sent in this demo.</p>
        <div className="flex flex-col gap-3">
          {PORUKE_SAVETNIKU.map((t) => (
            <Dugme
              key={t}
              siroko
              varijanta="secondary"
              onClick={() => {
                demo.otvoriPoruku(false)
                demo.obavesti()
              }}
            >
              {t}
            </Dugme>
          ))}
          <Dugme varijanta="text" onClick={() => demo.otvoriPoruku(false)}>
            Cancel
          </Dugme>
        </div>
      </Dijalog>
    )

  if (demo.dijalogRestart)
    return (
      <Dijalog naslov="Restart the demo from step 1?" onZatvori={() => demo.otvoriRestart(false)}>
        <p className="mb-4 text-ink-2">Your place in the story and anything you tried freely will be cleared. Your role and mode stay.</p>
        <div className="flex flex-wrap gap-3">
          <Dugme
            onClick={() => {
              demo.otvoriRestart(false)
              demo.restart()
              if (uloga === 'guest') navigate('/')
              else navigate(link(demo.ekranZaPoz(POCETNA_POZICIJA, uloga), uloga))
              window.scrollTo(0, 0)
            }}
          >
            Yes
          </Dugme>
          <Dugme varijanta="secondary" data-prvi-fokus onClick={() => demo.otvoriRestart(false)}>
            Cancel
          </Dugme>
        </div>
      </Dijalog>
    )

  if (demo.dijalogUlaz) {
    const ceka = demo.dijalogUlaz.cekaRadnja
    const akcija = demo.dijalogUlaz.cekaAkcija
    const izaberi = (u: Uloga) => {
      demo.otvoriUlaz(null)
      if (akcija) {
        // slobodni tok: akcija se izvrši tek ako izabrana uloga sme (savetnik ne kupuje)
        if (akcija.uloge.includes(u)) {
          akcija.izvrsi(u)
          demo.obavesti(PORUKA_SIMULACIJE)
          const cilj = akcija.nakon?.(u)
          if (cilj) {
            navigate(cilj)
            window.scrollTo(0, 0)
          } else idiNa(u)
        } else {
          demo.obavesti('This is for travelers and organizers. Pick one of those roles to try it.')
          idiNa(u)
        }
        return
      }
      if (ceka) {
        if (demo.izvedi(ceka.id, u)) {
          demo.obavesti(PORUKA_SIMULACIJE)
          const cilj = ceka.nakon?.(u)
          if (cilj) {
            navigate(cilj)
            window.scrollTo(0, 0)
          } else idiNa(u)
          return
        }
        demo.obavesti('This step comes later in the story. Showing where the story is now.')
        idiNa(u, demo.ekranZa(u))
        return
      }
      idiNa(u)
    }
    return (
      <Dijalog naslov="Enter demo as…" onZatvori={() => demo.otvoriUlaz(null)}>
        <p className="mb-4 text-ink-2">{ceka || akcija ? 'Choose a role to continue with this action.' : 'Choose a role to view the demo from.'}</p>
        <div className="flex flex-col gap-3">
          <Dugme siroko varijanta="secondary" onClick={() => izaberi('organizer')}>
            Group organizer
          </Dugme>
          <Dugme siroko varijanta="secondary" onClick={() => izaberi('traveler')}>
            Traveler
          </Dugme>
          <Dugme siroko varijanta="secondary" onClick={() => izaberi('advisor')}>
            Advisor
          </Dugme>
          <Dugme varijanta="text" onClick={() => demo.otvoriUlaz(null)}>
            Cancel
          </Dugme>
        </div>
      </Dijalog>
    )
  }
  return null
}
