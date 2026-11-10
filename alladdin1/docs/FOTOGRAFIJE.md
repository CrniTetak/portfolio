# Fotografije u demou AllAddIn1 — izvori i licence

> Fotografije su ilustrativne i ne prikazuju stvarna mesta ni ljude. Slika bez upisane licence ne može da uđe u build (test `src/podaci/fotografije.test.ts`).

STATUS LICENCE: POTVRĐENA (2026-10-18).

**Sadržaj obe slike ponovo pregledan (18. 10. 2026):** nema lica ni ljudi, nema natpisa, logoa ni kazino znakova, nema žetona ni novca. Vidljivi su samo tipični AI detalji (iskrivljen ukras ograde i geometrija stepenica na prvoj, nejasni predmeti na stočiću i panorama grada na drugoj). Za ilustrativni demo je prihvatljivo.

**800 naspram 1600:** `-800.webp` je verzija za telefon i kartice (budžet ≤ 150 KB, to meri `e2e:tezina`); `-1600.webp` se šalje samo širokim ekranima kroz `srcset` (hero) i nije pod budžetom telefona.

**Budžet težine:** proverava `npm run e2e:tezina` (360×640): prvi prikaz bilo kog ekrana ≤ 1 MB (tekst kao gzip), slika ≤ 150 KB. Poslednji rezultat: najteži ekran G2 398 KB, najteža slika 82 KB.

**Spisak koji čita kod:** `src/podaci/fotografije.ts`. Svaka slika iz spiska mora imati red ovde (test proverava po `id` u kosim navodnicima).

**Licence:**
- **StockCake, CC0 (Creative Commons Zero)** — sajt https://stockcake.com/. Slike su slobodne za upotrebu bez navođenja autora (po oznaci koju nosi slojevi iz Figme: „StockCake-…“). **Tekst uslova NIJE proveren u ovom okruženju (nema pretrage interneta); proveriti na dan preuzimanja i ponovo pred objavu.** StockCake slike su verovatno pravljene veštačkom inteligencijom, pa se svaka pregleda i zbog izmišljenog teksta, lažnih logoa i iskrivljenih detalja.
- Pexels i Unsplash licence (kao u Nasetuu) koriste se samo ako zatreba druga slika; tada se tekst licence upisuje ovde sa datumom provere.

**Obrada:** (PNG iz Figme je poluprovidan, pa se pre izvoza postavlja na neprozirnu pozadinu.) `npm run slike` pravi iz originala (`izvor-slika/<id>.png`, van git-a i van builda) središnje isečen WebP odnosa 16 : 9 u širinama 800 i 1600 px (2400 samo ako original ima dovoljno piksela; širina se nikad ne uvećava), kvalitet ~78, lokalnim Chrome-om (puppeteer-core). Zatamnjenje i gradijent (UI.md 5) su CSS, nisu ugrađeni u fajl.

**Budžet težine (B6):** pojedinačna slika za telefon najviše ~150 KB.

## Spisak slika

| id | Fajlovi | Ekran(i) | Izvor | Link | Autor | Licenca | Preuzeto | Napomena |
|---|---|---|---|---|---|---|---|---|
| `mermerne-stepenice` | public/slike/mermerne-stepenice-800.webp (82 KB), -1600.webp (214 KB) | probni ekran temelja (faza 0); kasnije hero/početna | StockCake | https://stockcake.com/ (samo početna; tačnu stranicu slike utvrditi pred objavu pretragom naziva „Majestic Marble Staircase“) | nepoznat (StockCake, verovatno generisano veštačkom inteligencijom) | CC0 | 2026-10-17 | Original iz Figma izvoza, sloj „StockCake-Majestic_Marble_Staircase_1763664575“, 1636 × 935 px (zato nema 2400 verzije). Bez ljudi, bez natpisa i logoa, bez znakova kazina. Pogledati pred objavu: AI detalji (ukrasi na ogradi, odsjaj prozora). |
| `hotel-apartman` | public/slike/hotel-apartman-800.webp (31 KB) | G2 (smeštaj), S2 (kartica) | StockCake | https://stockcake.com/ (samo početna; tačnu stranicu utvrditi pred objavu, naziv „monte carlo hotels Images and Photos") | nepoznat (StockCake, verovatno generisano veštačkom inteligencijom) | CC0 | 2026-10-17 | Original iz Figma izvoza, sloj „StockCake-monte_carlo_hotels_Images_and_Photos_1763219544“, 855 × 855 px (samo 800 verzija). Bez ljudi, natpisa i logoa. Pogledati pred objavu: AI detalji (predmeti na stolu, panorama grada). |
