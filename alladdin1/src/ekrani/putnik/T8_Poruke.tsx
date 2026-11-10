// T8 Messages: 3 unapred napisane poruke (Welcome, Payment reminder, Documents ready); nema stvarnog četa, ništa se ne šalje.
import { useState } from 'react'
import { useStanje } from '../../demo/useStanje'
import { Kartica, PraznoStanje } from '../../komponente/Kartica'
import { Strana } from '../../komponente/Strana'
import { porukePutnika } from '../../tekstovi/poruke'

export function T8Poruke() {
  const { poz, s } = useStanje()
  const poruke = porukePutnika(poz, s)
  const [izabrana, setIzabrana] = useState<string | null>(null)
  const aktivna = poruke.find((p) => p.id === izabrana) ?? poruke.at(-1)
  return (
    <Strana naslov="Messages" stanje={`poruke-${poruke.length}`}>
      {poruke.length === 0 ? (
        <PraznoStanje naslov="No messages yet">Messages from your advisor and organizer will appear here.</PraznoStanje>
      ) : (
        <div className="grid gap-6 md:grid-cols-[1fr_1.6fr]">
          <ul className="flex flex-col gap-3" aria-label="Message list">
            {poruke.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setIzabrana(p.id)}
                  aria-current={aktivna?.id === p.id ? 'true' : undefined}
                  className={`card w-full text-left ${aktivna?.id === p.id ? 'border-gold-400!' : ''}`}
                >
                  <span className="block font-semibold">{p.naslov}</span>
                  <span className="text-[13px] text-ink-3">{p.datum}</span>
                </button>
              </li>
            ))}
          </ul>
          {aktivna && (
            <Kartica naslov={aktivna.naslov}>
              <p className="mb-3 text-[13px] text-ink-3">{aktivna.datum}</p>
              <div className="flex flex-col gap-3 text-ink-2">
                {aktivna.telo.map((t) => (
                  <p key={t}>{t}</p>
                ))}
              </div>
            </Kartica>
          )}
        </div>
      )}
      <p className="text-[13px] text-ink-3">Demo messages — nothing is sent.</p>
    </Strana>
  )
}
