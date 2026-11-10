// S6 Legal & responsible play (UX 7.1): četiri jezička, nacrt teksta uz oznaku "Demo text — not a legal document."
import { useNavigate } from 'react-router'
import { Strana } from '../../komponente/Strana'
import { useEkran } from '../../okvir/kontekst'
import { link } from '../../pravila/rute'
import { PODNOZJE_TEKST } from '../../tekstovi/kartice'

const SEKCIJE = [
  { k: 'terms', naziv: 'Terms & Conditions (draft)' },
  { k: 'privacy', naziv: 'Privacy Policy (draft)' },
  { k: 'responsible', naziv: 'Responsible play' },
  { k: 'contact', naziv: 'Contact' },
] as const

const TEKST: Record<string, string[]> = {
  terms: [
    'This is an illustrative demo. Nothing shown here is an offer, a booking or a contract.',
    'Group quotes, deposits and installments in the demo only illustrate how a real process could work.',
    'Cancellation terms shown in the demo are invented examples and are not legal advice.',
  ],
  privacy: [
    'The demo collects no personal data. Every name, e-mail and number you see is fictional.',
    'Your place in the story is kept only in your browser while this window is open, and is cleared when you close it.',
    'There are no cookies, no analytics and no connections to other servers.',
  ],
  responsible: [
    'You must be 18 or over to use this demo.',
    PODNOZJE_TEKST,
    'Casino offers shown in the demo are offered by the partner casino under its own licence and terms.',
    'If gambling is causing you or someone close to you harm, please seek help from a local support service.',
  ],
  contact: ['This is a demo, so there is no real contact address or telephone number.', 'In a real product, your advisor and the support team would be reachable from here.'],
}

export function S6Pravno() {
  const { sekcija, uloga } = useEkran()
  const navigate = useNavigate()
  const aktivna = SEKCIJE.some((s) => s.k === sekcija) ? sekcija! : 'terms'
  const naslov = SEKCIJE.find((s) => s.k === aktivna)!.naziv
  return (
    <Strana naslov="Legal & responsible play" stanje={aktivna}>
      <div role="tablist" aria-label="Legal sections" className="flex flex-wrap gap-x-6 gap-y-1 border-b border-gold-800">
        {SEKCIJE.map((s) => (
          <button
            key={s.k}
            type="button"
            role="tab"
            aria-selected={s.k === aktivna}
            onClick={() => navigate(link('S6', uloga, s.k))}
            className={`min-h-11 border-b-2 text-[13px] font-semibold tracking-[.12em] uppercase ${s.k === aktivna ? 'border-gold-500 text-gold-500' : 'border-transparent text-ink-2 hover:text-gold-300'}`}
          >
            {s.naziv}
          </button>
        ))}
      </div>
      <section className="card flex flex-col gap-3" role="tabpanel" aria-label={naslov}>
        <p className="text-[13px] font-semibold tracking-[.1em] text-warn uppercase">Demo text — not a legal document.</p>
        <h2 className="naslov-kartice">{naslov}</h2>
        {TEKST[aktivna].map((t) => (
          <p key={t} className="text-ink-2">
            {t}
          </p>
        ))}
      </section>
    </Strana>
  )
}
