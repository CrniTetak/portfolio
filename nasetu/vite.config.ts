import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Vite podešavanje. base './' znači da build radi iz bilo kog foldera (npr. na Netlify-u ili otvoren sa diska).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { open: true },
  // Fontovi se nikad ne ugrađuju kao data: adresa u CSS (CSP font-src 'self' to blokira): uvek zasebni fajlovi
  build: { assetsInlineLimit: (file) => (/.woff2?$/.test(file) ? false : undefined) },
  // Isti sigurnosni zaglavlja kao u netlify.toml, da `npm run preview` pokaže ponašanje kao na hostingu
  preview: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy':
        "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    },
  },
  test: {
    // Testovi su čist TypeScript (bez pregledača), pa nije potreban jsdom.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
