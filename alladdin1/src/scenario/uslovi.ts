// SAMO ULAZNE VREDNOSTI priče (UX.md 8). Sve ostalo se izračunava u racun.ts / stanjeGrupe.ts.
// Pri promeni cene menja se OVDE (i jedan red u ocekivano.ts). Ekrani ne uvoze ovaj fajl direktno (brava B3).
// Svi iznosi su celi evri.

export const USLOVI = {
  /** Sedišta u bloku Macau. */
  sedista: 120,
  /** Cena po putniku u ponudi v1; v2 dodaje VIP apartmane i gala večeru (dodatak po putniku). */
  cenaV1: 2350,
  dodatakV2: 150,
  /** Avans grupe i rate po putniku, u procentima cene (zbir mora biti 100). */
  avansProc: 20,
  rata2Proc: 40,
  rata3Proc: 40,
  /** Broj VIP apartmana u v2 (ostalo su standardne sobe). */
  vipApartmana: 10,
  /** Upis putnika: CSV uvoz i link (UX 3.3, G9). */
  upis: { redovaUFajlu: 60, spremnoZaUvoz: 57, cekaEmail: 3, nepotpuniPodaci: 8 },
  /** Sedišta sa plaćenom ratom 2 na kraju koraka 6 (ostali plaćaju na dan roka ili ispadaju). */
  rata2PlacenoDoRoka: 96,
  /** Troškovi obrade pri otkazu, procenat avansa grupe (demo uslov, UX 8.3). */
  troskoviObradeProc: 10,
  /** Dve fiksne grupe na tabli organizatora (UX 8.5). Plaćen je samo avans. */
  grupe: {
    vegas: { sedista: 80, cena: 1200, upisano: 80, noci: 4 },
    grandPrix: { sedista: 50, cena: 2000, upisano: 31, noci: 3 },
  },
  /** Macau: najmanja grupa i broj noćenja (kartice paketa). */
  macauMinGrupa: 100,
  nociMacau: 5,
  /** Rokovi i trajanja iz ponuda (dani) i putna dokumenta (meseci važenja pasoša). */
  ponudaVaziDana: 7,
  pasosVaziMeseci: 6,
  /** Broj koraka priče. */
  brojKoraka: 9,
} as const
