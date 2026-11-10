// Okvir svakog ekrana: oznaka demoa, zaglavlje, sadržaj, podnožje sa 18+, traka priče (računar) ili traka/panel (telefon), toast, dijalozi.
// Na ulazu (S1) i prijavi (S3/S4) traka priče se skuplja u malu pločicu "Demo"; gost nema traku priče, samo pločicu "Demo · Enter as a role".
import type { ReactNode } from 'react'
import { useDemo } from '../demo/DemoProvider'
import { Dugme } from '../komponente/Dugme'
import { Dijalozi } from './Dijalozi'
import { useEkran } from './kontekst'
import { OznakaDemoa } from './OznakaDemoa'
import { Podnozje } from './Podnozje'
import { PanelPrice, TrakaTelefon } from './TrakaTelefon'
import { TrakaPrice } from './TrakaPrice'
import { PrelazEkrana } from './PrelazEkrana'
import { SkipLinkovi } from './SkipLinkovi'
import { Toast } from './Toast'
import { useMedia, useTelefon } from './useMedia'
import { Zaglavlje } from './Zaglavlje'

export function Okvir({ children }: { children: ReactNode }) {
  const { id, uloga } = useEkran()
  const demo = useDemo()
  const telefon = useTelefon()
  const tablet = useMedia('(max-width: 1023px)')
  const ulaz = id === 'S1' || id === 'S3' || id === 'S4'
  const saPricom = !ulaz && uloga !== 'guest'
  const gost = !ulaz && uloga === 'guest'
  const razmak = saPricom ? (demo.rezim === 'guided' ? (telefon ? 'pb-28' : tablet ? 'pb-72' : 'pb-36') : telefon ? 'pb-8' : tablet ? 'pb-56' : 'pb-24') : ''

  return (
    <div className={`flex min-h-screen flex-col ${razmak}`} data-uloga={uloga}>
      <SkipLinkovi saTrakom={saPricom} />
      <PrelazEkrana />
      <OznakaDemoa />
      {!ulaz && <Zaglavlje />}
      <main className="flex-1" id="sadrzaj" tabIndex={-1}>
        {children}
      </main>
      {gost && (
        <section aria-label="Demo role" className="wrap flex justify-center py-4" data-pilula-gost>
          <div className="flex items-center gap-3 rounded-pill border border-gold-600 bg-story-bar px-4 py-2 shadow-xl">
            <span className="text-[12px] font-semibold tracking-[.06em] text-gold-400 uppercase">Demo · Enter as a role</span>
            <Dugme mala onClick={() => demo.otvoriUlaz({ cekaRadnja: null })}>
              Enter
            </Dugme>
          </div>
        </section>
      )}
      {ulaz && (
        <aside aria-label="Demo" className="mx-auto mb-4 w-max rounded-pill border border-gold-800 bg-bg-1 px-3 py-1 text-[12px] font-semibold tracking-[.1em] text-gold-500 uppercase" data-pilula-demo>
          Demo
        </aside>
      )}
      <Podnozje />
      {saPricom && (telefon ? <TrakaTelefon /> : <TrakaPrice />)}
      {saPricom && telefon && <PanelPrice />}
      <Toast />
      <Dijalozi />
    </div>
  )
}
