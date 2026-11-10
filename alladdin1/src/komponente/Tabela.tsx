// Tabela (UI 7.8) koja na telefonu postaje kartice (UX 10). Ćelije se zadaju jednom; prikazuju se dvaput (tabela i kartice), CSS bira koje.
import type { ReactNode } from 'react'

export type Kolona<T> = { naslov: string; celija: (red: T) => ReactNode; desno?: boolean; glavna?: boolean }

export function Tabela<T>({ kolone, redovi, kljuc, podnozje, naslov }: { kolone: Kolona<T>[]; redovi: T[]; kljuc: (r: T) => string; podnozje?: ReactNode; naslov: string }) {
  return (
    <div>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-[15px]">
          <caption className="sr-only">{naslov}</caption>
          <thead>
            <tr className="border-b border-gold-700 bg-bg-2">
              {kolone.map((k) => (
                <th key={k.naslov} scope="col" className={`px-4 py-3 text-[12px] font-semibold tracking-[.12em] text-gold-500 uppercase ${k.desno ? 'text-right' : 'text-left'}`}>
                  {k.naslov}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {redovi.map((r) => (
              <tr key={kljuc(r)} className="min-h-14 border-b border-gold-800 hover:bg-bg-3">
                {kolone.map((k) => (
                  k.glavna ? (
                    <th key={k.naslov} scope="row" className="px-4 py-3.5 text-left align-middle font-normal">
                      {k.celija(r)}
                    </th>
                  ) : (
                    <td key={k.naslov} className={`px-4 py-3.5 align-middle ${k.desno ? 'num text-right' : ''}`}>
                      {k.celija(r)}
                    </td>
                  )
                ))}
              </tr>
            ))}
          </tbody>
          {podnozje && (
            <tfoot>
              <tr className="border-t border-gold-700 bg-bg-2">
                <td colSpan={kolone.length} className="px-4 py-3">
                  {podnozje}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden" aria-label={naslov}>
        {redovi.map((r) => (
          <li key={kljuc(r)} className="card card-quiet flex flex-col gap-2 p-4!">
            {kolone.map((k) => (
              <div key={k.naslov} className={k.glavna ? 'text-[16px] font-semibold' : 'flex items-start justify-between gap-3 text-[14.5px]'}>
                {!k.glavna && <span className="text-[12px] font-semibold tracking-[.1em] text-ink-3 uppercase">{k.naslov}</span>}
                <span className={k.desno ? 'num text-right' : ''}>{k.celija(r)}</span>
              </div>
            ))}
          </li>
        ))}
        {podnozje && <li className="px-1 text-[14px]">{podnozje}</li>}
      </ul>
    </div>
  )
}
