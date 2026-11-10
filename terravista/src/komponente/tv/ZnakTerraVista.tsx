// Znak TerraVista (tamna varijanta, za televizor) kao inline SVG iz dizajn/logo/ — bez izmene oblika i boja (BREND 5).
import { useId } from 'react'
import znak from '../../assets/terravista-znak-tamno.svg?raw'

export function ZnakTerraVista({ klasa = 'tv-znak' }: { klasa?: string }) {
  // Svaki prikaz znaka dobija svoj id (SVG ima id „t“ za naslov; dva znaka na stranici ne smeju da dele id).
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const svg = znak.replace(/id="t"/, `id="t${id}"`).replace(/aria-labelledby="t"/, `aria-labelledby="t${id}"`)
  // Sadržaj je naš sopstveni, statički SVG fajl iz projekta (ne tuđi unos).
  return <span className={klasa} dangerouslySetInnerHTML={{ __html: svg }} />
}
