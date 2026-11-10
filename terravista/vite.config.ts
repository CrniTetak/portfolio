import { readFileSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
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

// Prekidač prikaziLogotipe=false (src/podaci/podesavanja.ts) gasi i FAJLOVE: build ne sme da sadrži public/logotipi/.
function bezLogotipaKadJeIskljuceno() {
  let izlaz = 'dist'
  return {
    name: 'bez-logotipa-kad-je-iskljuceno',
    apply: 'build' as const,
    configResolved: (c: { build: { outDir: string }; root: string }) => {
      izlaz = resolve(c.root, c.build.outDir)
    },
    closeBundle: () => {
      const podesavanja = readFileSync(new URL('./src/podaci/podesavanja.ts', import.meta.url), 'utf8')
      if (/export\s+const\s+prikaziLogotipe\s*=\s*false/.test(podesavanja)) rmSync(resolve(izlaz, 'logotipi'), { recursive: true, force: true })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), bezMetaCspURazvoju(), bezLogotipaKadJeIskljuceno()],
  preview: { headers: zaglavljaIzFajla() },
  // Deljenje paketa: biblioteke (React, ruter, ikonice) idu u poseban fajl koji se retko menja, pa se kešira zasebno.
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
