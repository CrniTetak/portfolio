// Galerija fotografija (UI-v2 5): mreža 1 velika + do 4 manje (telefon: jedna slika sa brojačem), uvećanje preko celog ekrana.
// Radi i kad lokacija nema slika (siva pločica sa tipom prostora).
import { ChevronLeft, ChevronRight, Grid2x2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { MIN_FOTOGRAFIJA_ZA_OBJAVU } from '../logika/konstante'
import type { Lokacija } from '../podaci/lokacije'
import { fotografijeLokacije, Ploca, putanjaSlike, Slika } from './Slika'

/** Uvećanje preko celog ekrana kao pravi <dialog>: zarobljen fokus, Escape zatvara, fokus se vraća na dugme za uvećanje. */
function Uvecana({ onZatvori, children }: { onZatvori: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    return () => { if (d?.open) d.close() }
  }, [])
  return (
    <dialog
      ref={ref} aria-label="Uvećana fotografija"
      onCancel={(e) => { e.preventDefault(); onZatvori() }}
      className="tamno m-0 h-full max-h-none w-full max-w-none items-center justify-center bg-black/90 p-4 open:flex backdrop:bg-black/90"
    >
      <button type="button" aria-label="Zatvori" onClick={onZatvori} className="absolute right-4 top-4 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-mastilo"><X size={20} /></button>
      {children}
    </dialog>
  )
}

export function Galerija({ lokacija }: { lokacija: Lokacija }) {
  const foto = fotografijeLokacije(lokacija.id)
  const [i, setI] = useState(0)
  const [uvecano, setUvecano] = useState(false)

  useEffect(() => {
    if (!uvecano) return
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((x) => (x + 1) % foto.length)
      if (e.key === 'ArrowLeft') setI((x) => (x - 1 + foto.length) % foto.length)
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [uvecano, foto.length])

  if (foto.length === 0) {
    return (
      <div>
        <div className="aspect-[3/2] overflow-hidden rounded-kartica">
          <Ploca tekst={`${lokacija.tip} — fotografije stižu`} />
        </div>
        <p className="mt-1 text-[13px] text-prig">Prototip: 0 fotografija; za objavu prave lokacije potrebno je najmanje {MIN_FOTOGRAFIJA_ZA_OBJAVU} (enterijer, eksterijer, razvodna tabla, prilaz).</p>
      </div>
    )
  }

  const trenutna = foto[i]
  const otvori = (k: number) => { setI(k); setUvecano(true) }
  // Mreža (od 640 px): velika slika levo + do 4 manje desno (tablet 1+2). Telefon: jedna slika sa brojačem i strelicama.
  const male = foto.length >= 5 ? foto.slice(1, 5) : foto.length >= 3 ? foto.slice(1, 3) : foto.slice(1)
  const klasaMale = (k: number) => {
    if (foto.length >= 5) return k < 2 ? 'col-span-2 lg:col-span-1' : 'hidden lg:block'
    return male.length === 1 ? 'col-span-2 row-span-2' : 'col-span-2'
  }
  const dugmeSlike = 'block h-full w-full cursor-pointer overflow-hidden bg-linija'
  return (
    <div>
      {/* telefon: jedna slika, brojač 1/N */}
      <div className="relative aspect-[3/2] overflow-hidden rounded-kartica bg-linija sm:hidden">
        <button type="button" onClick={() => otvori(i)} aria-label="Uvećaj fotografiju" className={dugmeSlike}>
          <Slika foto={trenutna} prva sizes="100vw" />
        </button>
        {foto.length > 1 && (
          <>
            <button type="button" aria-label="Prethodna fotografija" onClick={() => setI((i - 1 + foto.length) % foto.length)} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-mastilo"><ChevronLeft size={20} aria-hidden /></button>
            <button type="button" aria-label="Sledeća fotografija" onClick={() => setI((i + 1) % foto.length)} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-mastilo"><ChevronRight size={20} aria-hidden /></button>
          </>
        )}
        <span className="cifre absolute bottom-3 right-3 rounded-full bg-mastilo/80 px-2.5 py-0.5 text-[13px] font-semibold text-white" aria-label={`Fotografija ${i + 1} od ${foto.length}`}>{i + 1}/{foto.length}</span>
      </div>

      {/* tablet i računar: mreža */}
      <div className="relative hidden aspect-[2/1] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-kartica sm:grid">
        <div className={`row-span-2 ${male.length ? 'col-span-2' : 'col-span-4'}`}>
          <button type="button" onClick={() => otvori(0)} aria-label="Uvećaj fotografiju" className={dugmeSlike}><Slika foto={foto[0]} prva sizes="(min-width: 1024px) 560px, 50vw" /></button>
        </div>
        {male.map((f, k) => (
          <div key={f.fajl} className={klasaMale(k)}>
            <button type="button" onClick={() => otvori(k + 1)} aria-label={`Fotografija ${k + 2} od ${foto.length}`} className={dugmeSlike}>
              <img src={putanjaSlike(f.fajl, 800)} alt={f.alt} loading="lazy" className="h-full w-full object-cover" />
            </button>
          </div>
        ))}
        {foto.length > 1 && (
          <button type="button" onClick={() => otvori(0)} className="absolute bottom-3 right-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-mastilo bg-white px-4 text-sm font-semibold text-mastilo shadow-pilula hover:bg-traka">
            <Grid2x2 size={16} aria-hidden /> Prikaži sve fotografije ({foto.length})
          </button>
        )}
      </div>
      <p className="mt-2 text-[13px] text-prig">Ilustrativne fotografije.</p>
      {/* B10: diskretna napomena o broju fotografija potrebnih za objavu prave lokacije */}
      <p className="text-[13px] text-prig">Prototip: {foto.length} fotografija; za objavu prave lokacije potrebno je najmanje {MIN_FOTOGRAFIJA_ZA_OBJAVU} (enterijer, eksterijer, razvodna tabla, prilaz).</p>

      {uvecano && (
        <Uvecana onZatvori={() => setUvecano(false)}>
          {foto.length > 1 && (
            <>
              <button type="button" aria-label="Prethodna" onClick={() => setI((i - 1 + foto.length) % foto.length)} className="absolute left-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-mastilo"><ChevronLeft size={20} /></button>
              <button type="button" aria-label="Sledeća" onClick={() => setI((i + 1) % foto.length)} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white text-mastilo"><ChevronRight size={20} /></button>
            </>
          )}
          <img
            src={putanjaSlike(trenutna.fajl, 1600)} srcSet={`${putanjaSlike(trenutna.fajl, 800)} 800w, ${putanjaSlike(trenutna.fajl, 1600)} 1600w`} sizes="100vw"
            alt={trenutna.alt} className="max-h-full max-w-full object-contain"
          />
        </Uvecana>
      )}
    </div>
  )
}
