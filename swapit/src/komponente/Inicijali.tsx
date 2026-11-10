// Avatar bez lica: krug sa inicijalima (korisnik) ili zaobljen kvadrat (firma). PLAN B6.3. Crta se kao SVG (nema inline stila zbog CSP-a).
export function Inicijali({ ime, velicina = 40, firma = false }: { ime: string; velicina?: number; firma?: boolean }) {
  const slova = ime
    .replace(/_.*/, '')
    .split(/[\s—-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((r) => r[0])
    .join('')
  return (
    <svg className="shrink-0" width={velicina} height={velicina} viewBox="0 0 40 40" role="presentation" focusable="false" aria-hidden>
      <rect width="40" height="40" rx={firma ? 10 : 20} fill="#0b4f7c" />
      <text x="20" y="21" textAnchor="middle" dominantBaseline="central" fontSize="16" fontWeight="800" fill="#ffffff" fontFamily="Nunito, sans-serif">
        {slova.toUpperCase()}
      </text>
    </svg>
  )
}
