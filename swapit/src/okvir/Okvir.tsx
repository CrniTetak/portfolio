// Okvir svakog ekrana (UX 2.1): oznaka demoa, zaglavlje, levi stub, sadržaj, desna traka, podnožje, traka priče (računar) ili
// traka/panel (telefon), ikonska traka (telefon, slobodno), toast i dijalozi.
// Na U1–U3 i R1–R5 nema zaglavlja, stuba ni trake priče: oznaka demoa ostaje, a dole stoji pločica „Demo“ (UX 8).
import type { ReactNode } from 'react'
import { useDemo } from '../demo/DemoProvider'
import { Dijalozi } from './Dijalozi'
import { useEkran } from './kontekst'
import { LeviStub } from './LeviStub'
import { OznakaDemoa } from './OznakaDemoa'
import { Podnozje } from './Podnozje'
import { ID_NAJAVE_PRICE, PrelazEkrana } from './PrelazEkrana'
import { SkipLinkovi } from './SkipLinkovi'
import { Toast } from './Toast'
import { DesnaTraka, IkonskaTraka } from './Trake'
import { TrakaPrice } from './TrakaPrice'
import { PanelPrice, TrakaTelefon } from './TrakaTelefon'
import { useMedia, useTelefon } from './useMedia'
import { usePrica } from './prica'
import { Zaglavlje } from './Zaglavlje'

/** Ekrani bez okvira (bez zaglavlja i stuba): uvod i ulaz (U1–U3) i registracija (R1–R5). */
/** Oznaka ekrana „Nema te stranice“ (nepoznata adresa); nije u registru ruta. */
export const ID_NEMA_STRANICE = 'NEMA'
export const EKRANI_BEZ_OKVIRA = ['U1', 'U2', 'U3', 'R1', 'R2', 'R3', 'R4', 'R5', ID_NEMA_STRANICE]
/**
 * Ekrani bez trake priče: uvod, ulaz, prijava i „zaboravljena lozinka“. ODSTUPANJE od UX 8 (vidi PLAN B14): R2–R4 su ekrani koraka 1
 * vođene priče, pa ostaju sa trakom — inače „Pokaži mi“ vodi na R2 sa kog se ne može dalje ni nazad.
 */
export const EKRANI_BEZ_TRAKE = ['U1', 'U2', 'U3', 'R1', 'R5', ID_NEMA_STRANICE]

export function Okvir({ children }: { children: ReactNode }) {
  const { id, ugao } = useEkran()
  const demo = useDemo()
  const telefon = useTelefon()
  // P-V2: na 720–1023 px opis koraka ne staje u traku, pa je (kao na telefonu) u panelu odozdo; na računaru traka ima stalnu visinu sa skrolom opisa
  const tablet = useMedia('(min-width: 720px) and (max-width: 1023px)')
  const puni = !EKRANI_BEZ_OKVIRA.includes(id)
  const saTrakom = !EKRANI_BEZ_TRAKE.includes(id)
  const vodjena = demo.rezim === 'vodjena'
  const prica = usePrica()

  return (
    <div className="okvir flex min-h-screen flex-col" data-ugao={ugao} data-okvir={puni ? 'pun' : 'sazet'}>
      <SkipLinkovi saTrakom={saTrakom} />
      <PrelazEkrana />
      <div id={ID_NAJAVE_PRICE} className="sr-only" role="status" aria-live="polite" data-najava-prica />
      <OznakaDemoa />
      {puni && <Zaglavlje />}
      <div className={`okvir-telo flex-1${puni ? ' sa-stubom' : ''}`}>
        {puni && <LeviStub />}
        <main className="strana" id="sadrzaj" tabIndex={-1} data-ekran={id}>
          {demo.poz.grana === 'poeni' && puni && (
            <div className="traka-racve" data-traka-racve role="status">
              <span>Račva: za poene</span>
              <button type="button" onClick={prica.glavniTok}>
                Nazad na glavni tok
              </button>
            </div>
          )}
          {children}
        </main>
      </div>
      {puni && !telefon && <DesnaTraka />}
      {!saTrakom && (
        <aside aria-label="Demo" className="pilula-demo" data-pilula-demo>
          Demo
        </aside>
      )}
      <Podnozje />
      {saTrakom && (telefon ? vodjena || !puni ? <TrakaTelefon /> : <IkonskaTraka /> : tablet && vodjena ? <TrakaTelefon /> : <TrakaPrice />)}
      {saTrakom && (telefon || (tablet && vodjena)) && <PanelPrice />}
      <Toast />
      <Dijalozi />
    </div>
  )
}

