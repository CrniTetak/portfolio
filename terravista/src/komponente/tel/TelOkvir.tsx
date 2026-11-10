// Okvir telefonskog ekrana (UX 5.3, UI 7): pilula „Demo“, gornja traka (nazad + naslov), telo i napomena.
// Donja traka kartica (Početna · Pretplate · Paketi · Nalog) je u vođenom režimu na uskom ekranu u meniju „≡“ (dole najviše jedan fiksni sloj).
import type { ReactNode } from 'react'
import { ArrowLeft } from '../../okvir/Ikone'
import { UPIT_SIROKO } from '../../okvir/mere'
import { useMedia } from '../../okvir/useMedia'
import { useDemo } from '../../okvir/stanje'
import { useToast } from '../../okvir/Toast'
import { sastavi } from '../../pravila/ekrani'

export function TelOkvir({ id, naslov, nazadNa, napomena, children }: { id: string; naslov: string; nazadNa?: string; napomena?: string; children: ReactNode }) {
  const d = useDemo()
  const siroko = useMedia(UPIT_SIROKO)
  const { poruka, akcija } = useToast()
  const tabovi = siroko || d.rezim === 'slobodno'
  const kartice = [
    { naziv: 'Početna', putanja: sastavi('P1') },
    { naziv: 'Pretplate', putanja: sastavi('P8') },
    { naziv: 'Paketi', putanja: sastavi('P6') },
    { naziv: 'Nalog', putanja: sastavi('P14') },
  ]
  return (
    <div className="tel-ekran" data-ekran={id}>
      <div className="tel-pilula">
        <span>Demo</span>
      </div>
      <div className="tel-gornja">
        {nazadNa && (
          <button type="button" className="tel-ikona" aria-label="Nazad" onClick={() => d.idiTel(nazadNa)}>
            <ArrowLeft className="ic" aria-hidden="true" />
          </button>
        )}
        <h1>{naslov}</h1>
      </div>
      <div className="tel-telo">{children}</div>
      {/* napomena i „Skenirano“ nisu u živom regionu; živa je samo poruka (a u širokom rasporedu je čita televizor) */}
      <div className="tel-napomena tel-poruka">
        {d.sija ?? ''} <span id="tel-napomena">{napomena ?? ''}</span>
        <span role={siroko ? undefined : 'status'} aria-live={siroko ? undefined : 'polite'}> {poruka ?? ''}</span>
        {akcija && (
          <button type="button" className="tel-poruka-dugme" onClick={akcija.onClick}>
            {akcija.tekst}
          </button>
        )}
      </div>
      {tabovi && (
        <nav className="tel-tabovi" aria-label="Glavna navigacija telefona">
          {kartice.map((k) => (
            <button key={k.naziv} type="button" className={d.telPutanja === k.putanja ? 'tel-tab tel-tab--trenutni' : 'tel-tab'} aria-current={d.telPutanja === k.putanja ? 'page' : undefined} onClick={() => d.idiTel(k.putanja)}>
              {k.naziv}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
