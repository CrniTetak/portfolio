// Okvir jednog ekrana: breadcrumb, naslov, pločica statusa transfera, kartice transfera, napomena u podnožju.
// Svaki ekran dobija data-ekran i data-stanje (za e2e proveru: pravi ekran, pravo stanje).
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Chip } from './Chip'
import { Ikona } from './Ikona'
import { usePrica } from '../prica/PricaProvider'
import { nazivKoraka } from '../prica/koraci'
import { sledecaRadnja } from '../prica/reducer'
import type { EkranId } from '../prica/tipovi'
import { stanjeEkrana } from '../pravila/stanjeEkrana'
import type { StanjeEkrana } from '../pravila/stanjeEkrana'
import { sledeciRok } from '../pravila/izvedeno'
import { TABLA, TABOVI_TRANSFERA, putZa } from '../pravila/rute'
import { IGRAC } from '../scenario/strane'
import { CEKA_ULOGU, NAPOMENA_DEMO } from '../tekstovi/prica'
import { Napomena } from './Kartica'

export function useStanjeEkrana(id: EkranId): StanjeEkrana {
  const { uloga, poz } = usePrica()
  return stanjeEkrana(id, uloga, poz)
}

interface Props {
  id: EkranId
  naslov: ReactNode
  podnaslov?: ReactNode
  /** Ekran pripada glavnom transferu (breadcrumb, pločica faze, kartice transfera). */
  transfer?: boolean
  /** Naziv ekrana u breadcrumb-u (podrazumevano: naslov). */
  crumb?: string
  akcije?: ReactNode
  /** Ekran još nije izgrađen (uredno prazno stanje); e2e to prijavljuje da posle talasa 2 ne ostane nijedan. */
  stub?: boolean
  children: ReactNode
}

export function Ekran({ id, naslov, podnaslov, transfer, crumb, akcije, stub, children }: Props) {
  const { uloga, poz, rezim, uvodFree, odbaciUvod, telefon, setGrana, setPanel } = usePrica()
  const stanje = stanjeEkrana(id, uloga, poz)
  const tabovi = transfer ? TABOVI_TRANSFERA[uloga] : undefined
  const sl = sledecaRadnja(poz)
  const naRedu = !sl ? 'Step complete.' : sl.uloga === uloga ? sl.pazi : sl.uloga === 'sustav' ? (sl.ceka ?? 'Waiting') : CEKA_ULOGU[sl.uloga]

  return (
    <div className="page" data-ekran={id} data-stanje={stanje} data-stub={stub ? 'da' : undefined} data-grana={poz.grana}>
      {/* Indikator grane (ne stanje odbijanja): finansijer ne sme da sazna ishod, pa mu se ne prikazuje. */}
      {poz.grana === 'rejected' && poz.korak >= 6 && uloga !== 'financier' && (
        <div className="note" role="note" data-racva-traka="da">
          <Ikona ime="undo" sm />
          <div className="grow">
            <span className="dugo"><b>What-if branch:</b> in this example, the association refuses the registration. This is a what-if example, not the main story.</span>
            <span className="kratko"><b>What-if branch:</b> registration refused</span>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setGrana('approved')}>Back to the main story</button>
        </div>
      )}
      {telefon && poz.korak === 6 && poz.grana === 'approved' && uloga !== 'financier' && (
        <div className="note" role="note" data-racva-nagovestaj="da">
          <Ikona ime="info" sm />
          <div className="grow"><b>What-if:</b> try a refused registration</div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPanel(true)}>Open</button>
        </div>
      )}
      {rezim === 'free' && uvodFree && (
        <div className="note" role="note" data-uvod-free="da">
          <Ikona ime="info" sm />
          <div className="grow">
            {telefon
              ? "You're now exploring freely. The story step stays in the header: tap it any time."
              : "You're now exploring freely. The story bar stays at the bottom — use it any time."}
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={odbaciUvod}>Got it</button>
        </div>
      )}

      {transfer && (
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to={putZa(TABLA[uloga])}>Transfers</Link> <span aria-hidden="true">&rsaquo;</span>{' '}
          <Link to={putZa(uloga === 'selling' ? 'S2' : 'B2')}>{IGRAC.kratko}</Link> <span aria-hidden="true">&rsaquo;</span>{' '}
          <span aria-current="page">{crumb ?? (typeof naslov === 'string' ? naslov : 'Overview')}</span>
        </nav>
      )}

      <div className="pagehead">
        <div>
          <h1>{naslov}</h1>
          {podnaslov && <p className="sub">{podnaslov}</p>}
        </div>
        <div className="actions">{akcije}</div>
      </div>

      {transfer && (
        <>
          <div className="card body statusrow" aria-label="Transfer status">
            <div>
              <div className="eyebrow">Phase</div>
              <Chip v="story">Step {poz.korak} · {nazivKoraka(poz.korak, poz.grana, 'kratak')}</Chip>
            </div>
            <div className="grow">
              <div className="eyebrow">Next action</div>
              <div>{naRedu}</div>
            </div>
            <div>
              <div className="eyebrow">Deadline</div>
              <div className="num">{sledeciRok(poz)}</div>
            </div>
          </div>
          {tabovi && (
            <nav className="tabs" aria-label="Transfer sections">
              {tabovi.map((t) => (
                <Link key={t.ekran} to={putZa(t.ekran)} aria-current={t.ekran === id ? 'page' : undefined}>
                  {t.oznaka}
                </Link>
              ))}
            </nav>
          )}
        </>
      )}

      {children}

      <footer className="legal">
        <span>{NAPOMENA_DEMO}</span>
        <Link to="/about">About this demo</Link>
      </footer>
    </div>
  )
}

/** Poruka kad uloga nema ništa da radi ili vidi u trenutnom koraku. */
export function NemaNista({ children }: { children: ReactNode }) {
  return <Napomena>{children}</Napomena>
}
