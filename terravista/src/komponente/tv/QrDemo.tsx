// LAŽNI QR kod (PLAN B6.4): ručno nacrtana SVG komponenta — tri kvadrata za poravnanje i uvek isti nasumičan raspored polja.
// NIJE ispravan QR i ne vodi nikuda. Tekst ispod je običan tekst, ne link.
const N = 21
/** Određen (ne nasumičan) raspored: isti pri svakom prikazivanju. */
function polje(x: number, y: number): boolean {
  return ((x * 7 + y * 13 + x * y * 3) % 5) < 2
}
const nacrtaj = (x: number, y: number) => {
  const u = (a: number, b: number) => x >= a && x < a + 7 && y >= b && y < b + 7
  for (const [a, b] of [[0, 0], [N - 7, 0], [0, N - 7]] as const) {
    if (u(a, b)) {
      const lx = x - a
      const ly = y - b
      return lx === 0 || ly === 0 || lx === 6 || ly === 6 || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
    }
  }
  return polje(x, y)
}

export function QrDemo() {
  const kocke = []
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (nacrtaj(x, y)) kocke.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
  return (
    <svg className="qr" viewBox={`-1 -1 ${N + 2} ${N + 2}`} role="img" aria-label="Lažni QR kod (demo)" shapeRendering="crispEdges">
      <rect x="-1" y="-1" width={N + 2} height={N + 2} fill="#fff" />
      <g fill="#10243e">{kocke}</g>
    </svg>
  )
}
