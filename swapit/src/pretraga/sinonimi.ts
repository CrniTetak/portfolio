// Kratka lista sinonima za pretragu (PLAN B4.5). Ključ i vrednosti su VEĆ normalizovani (bez kvačica, malim slovima).
// Sinonim se dodaje kao ALTERNATIVA reči iz upita: oglas se poklapa ako sadrži bilo koju od njih.
export const SINONIMI: Record<string, string[]> = {
  bajs: ['bicikl'],
  bicikla: ['bicikl'],
  ps: ['playstation'],
  ps2: ['playstation'],
  plejstejsn: ['playstation'],
  plejstejson: ['playstation'],
  knjige: ['udzbenik', 'knjiga'],
  knjiga: ['knjig'],
  kauc: ['garnitura'],
  sofa: ['garnitura'],
  mobilni: ['telefon'],
  laptop: ['racunar'],
  jabuka: ['jabuke'],
}

/** Gotovi upiti (čipovi ispod polja pretrage na P4/P5). */
export const GOTOVI_UPITI: string[] = ['dečji bicikl', 'udžbenici 3. razred', 'konzola', 'servis bicikla', 'jabuke', 'ugaona garnitura']
