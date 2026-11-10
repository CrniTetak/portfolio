// E2E slobodnih tokova (UX 4, tokovi 1–12): svaki tok od početka do kraja, na računaru i na telefonu.
import { izvestaj } from './_zajednicko.mjs'
import { napraviSesiju } from './_sesija.mjs'
import { UREDJAJI, lista, sesije } from './_tokovi-zajednicko.mjs'
import { tok1, tok2i3 } from './tokovi-1.mjs'
import { tok4, tok5i6 } from './tokovi-2.mjs'
import { tok7i12, tok8 } from './tokovi-3.mjs'
import { tok9, tok10, tok11, opste, obilazak } from './tokovi-4.mjs'
import { tokZavrsna } from './tokovi-5.mjs'

const TOKOVI = [tok1, tok2i3, tok4, tok5i6, tok7i12, tok8, tok9, tok10, tok11, opste, tokZavrsna]
for (const u of UREDJAJI) {
  const S = await napraviSesiju(u)
  sesije.push(S)
  for (const t of TOKOVI) await t(S)
  await obilazak(S, ['/ana/pocetna', '/marko/pocetna', '/prodavnica/tabla', '/moderacija/moderacija'])
}
const problemi = sesije.flatMap((s) => s.problemi)
const spoljni = sesije.flatMap((s) => s.spoljni)
for (const s of sesije) await s.browser.close()
process.exit(izvestaj('e2e-tokovi', lista, problemi, spoljni) ? 0 : 1)
