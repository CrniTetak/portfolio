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

// Meta CSP u index.html je rezerva za build; razvojni server (React Refresh ubacuje inline skriptu) je ne sme imati.
function bezMetaCspURazvoju() {
  return {
    name: 'bez-meta-csp-u-razvoju',
    apply: 'serve' as const,
    transformIndexHtml: (h: string) => h.replace(/<meta http-equiv="Content-Security-Policy"[^>]*>\s*/, ''),
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), bezMetaCspURazvoju()],
  preview: { headers: zaglavljaIzFajla() },
  // Deljenje paketa (talas 4): biblioteke (React, ruter, ikonice) idu u poseban fajl koji se retko menja, pa se kešira zasebno; ekrani su lenji (src/ekrani/index.tsx).
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) return 'biblioteke-react'
          if (id.includes('node_modules/react-router') || id.includes('node_modules/lucide-react')) return 'biblioteke-ruter-ikone'
        },
      },
    },
  },
  test: {
    // Testovi su čist TypeScript (bez pregledača), pa nije potreban jsdom.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
