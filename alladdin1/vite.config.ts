import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite podešavanje. base './' znači da build radi iz bilo kog foldera.
// Zaglavlja za `preview` se čitaju IZ public/_headers (jedan izvor), da lokalna proba pokaže tačno ono što će slati hosting.
function zaglavljaIzFajla(): Record<string, string> {
  const izlaz: Record<string, string> = {}
  for (const linija of readFileSync(new URL('./public/_headers', import.meta.url), 'utf8').split(/\r?\n/)) {
    const m = /^\s+([A-Za-z-]+):\s*(.+)$/.exec(linija)
    if (m) izlaz[m[1]] = m[2].trim()
  }
  return izlaz
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  preview: { headers: zaglavljaIzFajla() },
  test: {
    // Testovi su čist TypeScript (bez pregledača), pa nije potreban jsdom.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
