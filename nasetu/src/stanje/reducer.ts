// Jedna funkcija koja primenjuje radnju na stanje i vraća NOVO stanje.
// Sva pravila (rokovi, red opcija, preklapanje termina, naknada) zovu se iz src/logika/.
// Nedozvoljena radnja ne menja ništa (vraća ISTO stanje) — tako ni greška na ekranu ne može da
// proizvede dvostruku potvrdu istog termina ili preskoči korak.
import { osnovicaZaTermin } from '../logika/cenovnik'
import { MAX_BELESKA, MAX_PREKOVREMENIH_SATI, MAX_TEKST_UNOSA, SATI_OSPORAVANJE } from '../logika/konstante'
import { mozeLiBlokirati } from '../logika/kalendar'
import { mozeLiObjaviti, proveriNacrtLokacije } from '../logika/objava'
import {
  mozeLiOdobriti, mozeLiOtkazatiVlasnik, mozeLiPotvrditiUplatu, napraviPredracunNaknade, napraviPredracunUsluge,
  noviZahtev, stanjeZahteva,
} from '../logika/rezervacije'
import { novaOpcija, pozicija, jeZiva } from '../logika/opcije'
import { pokreniOsporavanje, RAZLOG_AUTO_ODBIJANJA, zahteviZaAutoOdbijanje } from '../logika/red'
import { preklapaju, proveriTermin } from '../logika/termini'
import { istekao } from '../logika/vreme'
import { akterUloge, DELTA, kratakNaziv, MILA, SIGMA } from '../podaci/akteri'
import { cenaDana, nadjiLokaciju, POLJA_TEHNICKOG } from '../podaci/lokacije'
import { briefDelte, zauzetiDani } from './izvedeno'
import type { Akcija } from './akcije'
import type { Glas, Izbor, Stanje } from './tipovi'

/** Sledeći ID s prefiksom ("z-3"); brojač se uvećava u novom stanju. */
function noviId(s: Stanje, prefiks: string): [string, Stanje] {
  return [`${prefiks}-${s.brojac}`, { ...s, brojac: s.brojac + 1 }]
}

function zabelezi(s: Stanje, tekst: string, ref?: string): Stanje {
  return { ...s, dnevnik: [...s.dnevnik, ref ? { sati: s.sati, tekst, ref } : { sati: s.sati, tekst }] }
}

const linkIstice = (i: Izbor) => i.linkOd + i.trajanje

/** Izbor koji trenutno uređuje aktivna uloga (produkcija ili partner): poslednji njen. */
export function izborAktera(s: Stanje, akterId: string): Izbor | undefined {
  return [...s.izbori].reverse().find((i) => i.akterId === akterId)
}

export function reducer(s: Stanje, a: Akcija): Stanje {
  switch (a.tip) {
    case 'UCITAJ':
      return a.stanje

    case 'PROMENI_ULOGU':
      return { ...s, uloga: a.uloga }

    case 'PROMENI_PRIKAZ_VLASNIKA':
      return { ...s, prikazVlasnika: a.prikaz }

    case 'SAKRIJ_DEMO':
      return { ...s, demoSakriven: a.sakriven }

    case 'PREMOTAJ':
      // Vreme ide samo napred (za povratak služe Reset i "Skoči na…").
      return a.sati > 0 ? { ...s, sati: s.sati + a.sati } : s

    case 'POSALJI_BRIEF': {
      const b = a.brief
      if (b.termin.snimanje.length < 1) return s
      const [id, s1] = noviId(s, 'b')
      let cur: Stanje = {
        ...s1,
        briefovi: [...s1.briefovi, { ...b, id, produkcijaId: DELTA, izvor: 'Direktno', poslat: s.sati, izborId: null }],
      }
      // "Izbor van kataloga": posle slanja briefa nastaje predračun od 50 € (u dinarima) koji admin potvrđuje
      if (b.vanKataloga) {
        const [pid, s2] = noviId(cur, 'p')
        cur = { ...s2, predracuni: [...s2.predracuni, napraviPredracunUsluge(
          pid, s2.predracuni.length + 1, { vrsta: 'izbor-van-kataloga', kupacId: DELTA, briefId: id }, s.sati)] }
      }
      return zabelezi(cur, 'Produkcija Delta poslala zahtev (brief)')
    }

    case 'ADMIN_POSALJI_IZBOR': {
      const brief = s.briefovi.find((b) => b.id === a.briefId)
      if (!brief || brief.izborId) return s
      const nacrt = izborAktera(s, brief.produkcijaId)
      // Scenario izbor (Loft, Hala, Studio) je UVEK u izboru; lokacije iz nacrta se dodaju uz njih.
      const SCENARIO_IZBOR = ['industrijski-loft', 'brutalisticka-hala', 'foto-studio']
      const izNacrta = nacrt && nacrt.poslatProdukciji === null ? nacrt.lokacijaIds : []
      const lokacijaIds = [...SCENARIO_IZBOR, ...izNacrta.filter((x) => !SCENARIO_IZBOR.includes(x))]
      const zasto: Record<string, string> = {
        'industrijski-loft': 'Svetao industrijski prostor, trofazna struja i lift za opremu — odgovara reklami.',
        'brutalisticka-hala': 'Visok plafon i prazan prostor za velike kadrove; dobar ton.',
        'foto-studio': 'Zamračenje i ciklorama za kontrolisano osvetljenje.',
      }
      const [id, s1] = noviId(s, 'izb')
      const novi: Izbor = {
        id, akterId: brief.produkcijaId, uloga: 'produkcija', naziv: `Izbor za: ${brief.vrsta}, ${brief.grad}`,
        zaKoga: 'Agencija i klijent', briefId: brief.id, lokacijaIds, zasto, trajanje: 48, linkOd: s.sati,
        poslatProdukciji: s.sati,
      }
      // Ako je produkcija već imala nacrt izbora iz kataloga, on se zamenjuje ovim (jedan izbor po briefu).
      const izbori = s1.izbori.filter((i) => i.id !== nacrt?.id || nacrt?.poslatProdukciji !== null).concat(novi)
      return zabelezi({
        ...s1, izbori,
        briefovi: s1.briefovi.map((b) => (b.id === brief.id ? { ...b, izborId: id } : b)),
      }, 'Admin poslao izbor produkciji')
    }

    case 'DODAJ_U_IZBOR': {
      if (!nadjiLokaciju(a.lokacijaId)) return s
      if (s.uloga !== 'produkcija' && s.uloga !== 'partner') return s
      const akter = akterUloge(s.uloga, s.prikazVlasnika)
      let cur = s
      let izbor = izborAktera(cur, akter)
      if (!izbor) {
        const [id, s1] = noviId(cur, 'izb')
        izbor = {
          id, akterId: akter, uloga: s.uloga, naziv: s.uloga === 'partner' ? 'Novi izbor' : 'Moj izbor',
          zaKoga: '', briefId: null, lokacijaIds: [], zasto: {}, trajanje: 48, linkOd: s.sati, poslatProdukciji: null,
        }
        cur = { ...s1, izbori: [...s1.izbori, izbor] }
      }
      if (izbor.lokacijaIds.includes(a.lokacijaId)) return cur
      const id = izbor.id
      return { ...cur, izbori: cur.izbori.map((i) => (i.id === id ? { ...i, lokacijaIds: [...i.lokacijaIds, a.lokacijaId] } : i)) }
    }

    case 'UKLONI_IZ_IZBORA': {
      // Ako lokacije nema u izboru, ništa se ne menja (vraća se ISTO stanje; vodi se računa o odstupanju od priče)
      if (!s.izbori.some((i) => i.id === a.izborId && i.lokacijaIds.includes(a.lokacijaId))) return s
      return {
        ...s,
        izbori: s.izbori.map((i) =>
          i.id === a.izborId ? { ...i, lokacijaIds: i.lokacijaIds.filter((l) => l !== a.lokacijaId) } : i),
      }
    }

    case 'AZURIRAJ_IZBOR': {
      const stari = s.izbori.find((i) => i.id === a.izborId)
      if (!stari) return s
      const promenaTrajanja = !!a.trajanje && a.trajanje !== stari.trajanje
      if ((a.naziv === undefined || a.naziv === stari.naziv) && (a.zaKoga === undefined || a.zaKoga === stari.zaKoga) && !promenaTrajanja) return s
      return {
        ...s,
        izbori: s.izbori.map((i) => {
          if (i.id !== a.izborId) return i
          return {
            ...i,
            naziv: a.naziv ?? i.naziv,
            zaKoga: a.zaKoga ?? i.zaKoga,
            // nova dužina linka znači i novi početak odbrojavanja
            ...(a.trajanje && a.trajanje !== i.trajanje ? { trajanje: a.trajanje, linkOd: s.sati } : {}),
          }
        }),
      }
    }

    case 'NOVI_IZBOR': {
      const [id, s1] = noviId(s, 'izb')
      return {
        ...s1,
        izbori: [...s1.izbori, {
          id, akterId: MILA, uloga: 'partner', naziv: 'Novi izbor', zaKoga: '', briefId: null,
          lokacijaIds: [], zasto: {}, trajanje: 48, linkOd: s.sati, poslatProdukciji: null,
        }],
      }
    }

    case 'GLASAJ': {
      const izbor = s.izbori.find((i) => i.id === a.izborId)
      const ime = a.ime.trim()
      if (!izbor || !ime || !izbor.lokacijaIds.includes(a.lokacijaId)) return s
      if (istekao(linkIstice(izbor), s.sati)) return s // link je istekao
      const isti = s.glasovi.find(
        (g) => g.izborId === a.izborId && g.lokacijaId === a.lokacijaId && g.ime.toLowerCase() === ime.toLowerCase())
      // isti glas sa istim komentarom ponovo: ništa se ne menja (ne pravi se lažna promena stanja)
      if (isti && isti.sud === a.sud && isti.komentar === a.komentar.trim()) return s
      const ostali = s.glasovi.filter((g) => g !== isti)
      return { ...s, glasovi: [...ostali, { izborId: a.izborId, lokacijaId: a.lokacijaId, ime, sud: a.sud, komentar: a.komentar.trim(), vreme: s.sati }] }
    }

    case 'KOMENTARISI': {
      const izbor = s.izbori.find((i) => i.id === a.izborId)
      const ime = a.ime.trim()
      const komentar = a.komentar.trim()
      if (!izbor || !ime || !komentar || !izbor.lokacijaIds.includes(a.lokacijaId)) return s
      if (istekao(linkIstice(izbor), s.sati)) return s
      const isti = (g: Glas) => g.izborId === a.izborId && g.lokacijaId === a.lokacijaId && g.ime.toLowerCase() === ime.toLowerCase()
      const postojeci = s.glasovi.find(isti)
      if (postojeci && postojeci.komentar === komentar) return s // isti komentar ponovo: bez promene
      // komentar bez glasa: sud ostaje prazan; postojeći glas se čuva
      const novi: Glas = { izborId: a.izborId, lokacijaId: a.lokacijaId, ime, sud: postojeci?.sud ?? null, komentar, vreme: s.sati }
      return { ...s, glasovi: [...s.glasovi.filter((g) => !isti(g)), novi] }
    }

    case 'PREGLEDAN_PREDRACUN': {
      const p = s.predracuni.find((x) => x.id === a.predracunId)
      if (!p || p.pregledan) return s
      return { ...s, predracuni: s.predracuni.map((x) => (x.id === p.id ? { ...x, pregledan: true } : x)) }
    }

    case 'TRAZI_OPCIJU': {
      const l = nadjiLokaciju(a.lokacijaId)
      if (!l || a.termin.snimanje.length < 1) return s
      // ista provera veličine ekipe kao kod rezervacije
      const razredBriefa = briefDelte(s)?.razred
      if (razredBriefa && cenaDana(l, razredBriefa) === null) return s
      if (!proveriTermin(l.id, a.termin, s.zahtevi, zauzetiDani(s, l)).slobodan) return s
      // jedna produkcija ne drži dve žive opcije za isti termin na istoj lokaciji
      const vecDrzi = s.opcije.some(
        (o) => o.lokacijaId === l.id && o.produkcijaId === DELTA && jeZiva(o, s.sati) && preklapaju(o.termin, a.termin))
      if (vecDrzi) return s
      const [id, s1] = noviId(s, 'o')
      return zabelezi(
        { ...s1, opcije: [...s1.opcije, novaOpcija(id, l.id, DELTA, a.termin, s.sati)] },
        `Produkcija Delta postavila opciju: ${l.naziv}`)
    }

    case 'OTPUSTI_OPCIJU':
      if (!s.opcije.some((o) => o.id === a.opcijaId && o.stanje === 'aktivna')) return s
      return {
        ...s,
        opcije: s.opcije.map((o) => (o.id === a.opcijaId && o.stanje === 'aktivna' ? { ...o, stanje: 'otpustena' } : o)),
      }

    case 'SIMULIRAJ_DRUGU_PRODUKCIJU': {
      // Delta mora biti PRVA u redu na toj lokaciji; Sigma staje iza nje i traži potvrdu (rezervaciju).
      const l = nadjiLokaciju(a.lokacijaId)
      const deltina = s.opcije.find((o) => o.lokacijaId === a.lokacijaId && o.produkcijaId === DELTA && jeZiva(o, s.sati))
      if (!l || !deltina || pozicija(s.opcije, deltina, s.sati) !== 1 || deltina.osporavanje) return s
      const [oid, s1] = noviId(s, 'o')
      let opcije = [...s1.opcije, novaOpcija(oid, l.id, SIGMA, deltina.termin, s.sati)]
      // Sigma nije prva: njena opcija i zahtev pokreću osporavanje prve opcije (24 h)
      opcije = pokreniOsporavanje(opcije, s1.zahtevi, l.id, deltina.termin, SIGMA, s.sati, SATI_OSPORAVANJE)
      let cur: Stanje = { ...s1, opcije }
      // Sigma uz to šalje i zahtev za rezervaciju istog termina (vlasnik će videti oba)
      const brief = [...s.briefovi].reverse().find((b) => b.produkcijaId === DELTA)
      const razred = brief?.razred ?? 'do30'
      const osnovica = osnovicaZaTermin(l, deltina.termin, razred) ?? osnovicaZaTermin(l, deltina.termin, 'do10')
      if (osnovica !== null) {
        const [zid, s2] = noviId(cur, 'z')
        cur = { ...s2, zahtevi: [...s2.zahtevi, noviZahtev({
          id: zid, lokacijaId: l.id, produkcijaId: SIGMA, briefId: null, termin: deltina.termin, razred,
          prekovremeniSati: 0, osnovicaCenti: osnovica, sada: s.sati, opcijaId: oid })] }
      }
      return zabelezi(cur, `Druga produkcija traži isti termin: ${l.naziv}`)
    }

    case 'POSALJI_ZAHTEV': {
      const l = nadjiLokaciju(a.lokacijaId)
      if (!l) return s
      // zaštita: prekovremeni sati moraju biti ceo broj u razumnim granicama (pravila ne smeju da bace grešku usred reducera)
      if (!Number.isInteger(a.prekovremeniSati) || a.prekovremeniSati < 0 || a.prekovremeniSati > MAX_PREKOVREMENIH_SATI) return s
      const osnovica = osnovicaZaTermin(l, a.termin, a.razred, a.prekovremeniSati)
      if (osnovica === null) return s
      if (!proveriTermin(l.id, a.termin, s.zahtevi, zauzetiDani(s, l)).slobodan) return s
      const vecCeka = s.zahtevi.some(
        (z) => z.lokacijaId === l.id && z.produkcijaId === DELTA && stanjeZahteva(z, s.sati) === 'ceka' && preklapaju(z.termin, a.termin))
      if (vecCeka) return s
      const [id, s1] = noviId(s, 'z')
      const brief = [...s.briefovi].reverse().find((b) => b.produkcijaId === DELTA)
      const zahtev = noviZahtev({
        id, lokacijaId: l.id, produkcijaId: DELTA, briefId: brief?.id ?? null, termin: a.termin, razred: a.razred,
        prekovremeniSati: a.prekovremeniSati, osnovicaCenti: osnovica, sada: s.sati, domacin: a.domacin === true,
        // zahtev nasleđuje mesto u redu SAMO od opcije iz koje nastaje
        opcijaId: s.opcije.find((o) => o.produkcijaId === DELTA && o.lokacijaId === l.id && jeZiva(o, s.sati) && preklapaju(o.termin, a.termin))?.id ?? null })
      // A2: ako Delta nije prva u redu za taj termin, njen zahtev pokreće osporavanje prve opcije (pre pretvaranja njene opcije)
      const sOspor = pokreniOsporavanje(s1.opcije, s1.zahtevi, l.id, a.termin, DELTA, s.sati, SATI_OSPORAVANJE)
      return zabelezi({
        ...s1,
        zahtevi: [...s1.zahtevi, zahtev],
        // Deltina opcija na toj lokaciji postaje zahtev (prestaje da drži termin kao opcija)
        opcije: sOspor.map((o) =>
          o.produkcijaId === DELTA && o.lokacijaId === l.id && jeZiva(o, s.sati) && preklapaju(o.termin, a.termin)
            ? { ...o, stanje: 'pretvorena' } : o),
      }, `Produkcija Delta poslala zahtev za rezervaciju: ${l.naziv}`)
    }

    case 'ODOBRI_ZAHTEV': {
      const z = s.zahtevi.find((x) => x.id === a.zahtevId)
      if (!z) return s
      const l = nadjiLokaciju(z.lokacijaId)
      if (!l || !mozeLiOdobriti(z, s.zahtevi, zauzetiDani(s, l), s.sati, s.opcije).moze) return s
      const [pid, s1] = noviId(s, 'p')
      // Termin je potvrđen: svi ostali zahtevi na čekanju za preklopljeni termin se odbijaju, a tuđe žive opcije se otpuštaju
      const odbijaju = zahteviZaAutoOdbijanje(z, s.zahtevi, s.sati)
      const odbijajuId = new Set(odbijaju.map((x) => x.id))
      let cur: Stanje = {
        ...s1,
        zahtevi: s1.zahtevi.map((x) =>
          x.id === z.id ? { ...x, stanje: 'odobren' }
            : odbijajuId.has(x.id) ? { ...x, stanje: 'odbijen', razlog: RAZLOG_AUTO_ODBIJANJA } : x),
        opcije: s1.opcije.map((o) =>
          o.lokacijaId === z.lokacijaId && o.produkcijaId !== z.produkcijaId && o.stanje === 'aktivna' && jeZiva(o, s.sati) && preklapaju(o.termin, z.termin)
            ? { ...o, stanje: 'otpustena' } : o),
        predracuni: [...s1.predracuni, napraviPredracunNaknade(pid, s1.predracuni.length + 1, z, s1.predracuni, s.sati)],
      }
      cur = zabelezi(cur, `Vlasnik odobrio zahtev: ${l.naziv}`, pid)
      for (const x of odbijaju) cur = zabelezi(cur, `Zahtev automatski odbijen (${RAZLOG_AUTO_ODBIJANJA.toLowerCase()}): ${l.naziv}, ${kratakNaziv(x.produkcijaId)}`)
      return cur
    }

    case 'ODBIJ_ZAHTEV': {
      const z = s.zahtevi.find((x) => x.id === a.zahtevId)
      if (!z || stanjeZahteva(z, s.sati) !== 'ceka') return s
      return zabelezi({
        ...s,
        zahtevi: s.zahtevi.map((x) => (x.id === z.id ? { ...x, stanje: 'odbijen', razlog: a.razlog } : x)),
      }, `Vlasnik odbio zahtev: ${nadjiLokaciju(z.lokacijaId)?.naziv}`)
    }

    case 'POTVRDI_UPLATU': {
      const p = s.predracuni.find((x) => x.id === a.predracunId)
      const z = p?.zahtevId ? s.zahtevi.find((x) => x.id === p.zahtevId) : undefined
      if (!mozeLiPotvrditiUplatu(z, p).moze) return s
      return zabelezi({
        ...s,
        predracuni: s.predracuni.map((x) => (x.id === a.predracunId ? { ...x, uplataPotvrdjena: s.sati } : x)),
      }, 'Admin potvrdio uplatu', p!.id)
    }

    case 'ZATRAZI_IZVIDJANJE': {
      const osoba = a.osoba.trim()
      if (!nadjiLokaciju(a.lokacijaId) || !osoba || a.brojLjudi < 1 || a.kada <= s.sati) return s
      const [id, s1] = noviId(s, 'i')
      return zabelezi({
        ...s1,
        izvidjanja: [...s1.izvidjanja, {
          id, lokacijaId: a.lokacijaId, produkcijaId: DELTA, kada: a.kada, osoba, brojLjudi: a.brojLjudi,
          stanje: 'ceka', poslat: s.sati }],
      }, `Zatraženo izviđanje: ${nadjiLokaciju(a.lokacijaId)?.naziv}`)
    }

    case 'POTVRDI_IZVIDJANJE':
    case 'ODBIJ_IZVIDJANJE': {
      const novo = a.tip === 'POTVRDI_IZVIDJANJE' ? 'potvrdjeno' : 'odbijeno'
      if (!s.izvidjanja.some((i) => i.id === a.id && i.stanje === 'ceka')) return s
      return { ...s, izvidjanja: s.izvidjanja.map((i) => (i.id === a.id ? { ...i, stanje: novo } : i)) }
    }

    case 'POSALJI_LOKACIJU': {
      const p = a.lokacija
      const c = p.cenovnik
      if (proveriNacrtLokacije(p) !== null) return s
      const vlasnikId = akterUloge('vlasnik', s.prikazVlasnika)
      const [id, s1] = noviId(s, 'pl')
      let cur: Stanje = {
        ...s1,
        prijaveLokacija: [...s1.prijaveLokacija, {
          id, izvor: 'vlasnik', podnosilacId: vlasnikId, vlasnikId, vlasnikNaziv: '', saglasnostVlasnika: true,
          naziv: p.naziv.trim().slice(0, MAX_TEKST_UNOSA), tip: p.tip.slice(0, MAX_TEKST_UNOSA), opstina: p.opstina.trim().slice(0, MAX_TEKST_UNOSA), kvadratura: p.kvadratura,
          cenovnik: { ...c, najkrace: c.najkrace.trim().slice(0, 100), troskovi: c.troskovi.trim().slice(0, 200) },
          tehnicki: ociscenTehnicki(p.tehnicki),
          brojFotografija: Math.max(0, Math.min(10, Math.floor(p.brojFotografija))),
          dokaz: p.dokaz.trim().slice(0, 100), fotografisanje: p.fotografisanje, stanje: 'ceka', odluka: null, poslat: s.sati,
        }],
      }
      // Fotografisanje prostora (75 €): vlasnik dobija izmišljen predračun, admin ga vidi među uplatama
      if (p.fotografisanje) {
        const [pid, s2] = noviId(cur, 'p')
        cur = { ...s2, predracuni: [...s2.predracuni, napraviPredracunUsluge(
          pid, s2.predracuni.length + 1, { vrsta: 'fotografisanje', kupacId: vlasnikId, prijavaId: id }, s.sati)] }
      }
      return zabelezi(cur, `Vlasnik poslao lokaciju na odobrenje: ${p.naziv.trim()}`)
    }

    case 'POSALJI_PREPORUKU': {
      // B4: partner preporučuje lokaciju uz saglasnost vlasnika; stiže adminu u "Lokacije na čekanju"
      const p = a.preporuka
      if (!p.naziv.trim() || !p.opstina.trim() || !p.saglasnostVlasnika) return s
      const [id, s1] = noviId(s, 'pl')
      return zabelezi({
        ...s1,
        prijaveLokacija: [...s1.prijaveLokacija, {
          id, izvor: 'partner', podnosilacId: MILA, vlasnikId: '', vlasnikNaziv: p.vlasnikNaziv.trim().slice(0, 100) || 'Vlasnik prostora (izmišljeno)',
          saglasnostVlasnika: true, naziv: p.naziv.trim().slice(0, MAX_TEKST_UNOSA), tip: p.tip.slice(0, MAX_TEKST_UNOSA), opstina: p.opstina.trim().slice(0, MAX_TEKST_UNOSA), kvadratura: 0,
          cenovnik: { do10: null, do30: null, preko30: null, satiDana: 10, pripremaCenti: 0, prekovremeniCenti: 0, najkrace: '', troskovi: '' },
          tehnicki: {}, brojFotografija: 0, dokaz: '', fotografisanje: false, stanje: 'ceka', odluka: null, poslat: s.sati,
        }],
      }, `Partner preporučio lokaciju: ${p.naziv.trim()}`)
    }

    case 'ODOBRI_OBJAVU': {
      const p = s.prijaveLokacija.find((x) => x.id === a.prijavaId)
      if (!p || !mozeLiObjaviti(p).moze) return s
      return zabelezi({
        ...s,
        prijaveLokacija: s.prijaveLokacija.map((x) => (x.id === p.id ? { ...x, stanje: 'objavljena', odluka: s.sati } : x)),
      }, `Admin odobrio objavu lokacije: ${p.naziv}`)
    }

    case 'ODBIJ_PRIJAVU': {
      const p = s.prijaveLokacija.find((x) => x.id === a.prijavaId)
      if (!p || p.stanje !== 'ceka') return s
      return zabelezi({
        ...s,
        prijaveLokacija: s.prijaveLokacija.map((x) => (x.id === p.id ? { ...x, stanje: 'odbijena', odluka: s.sati } : x)),
      }, `Admin odbio prijavu lokacije: ${p.naziv}`)
    }

    case 'ODOBRI_NALOG':
    case 'ODBIJ_NALOG': {
      // Odluka samo nad nalogom koji čeka; ne dodaje aktere ni prava (odluka O16)
      const n = s.nalozi.find((x) => x.id === a.nalogId)
      if (!n || n.stanje !== 'ceka') return s
      const novo = a.tip === 'ODOBRI_NALOG' ? 'odobren' : 'odbijen'
      return zabelezi({
        ...s,
        nalozi: s.nalozi.map((x) => (x.id === n.id ? { ...x, stanje: novo } : x)),
      }, `Admin ${novo === 'odobren' ? 'odobrio' : 'odbio'} nalog: ${n.naziv}`)
    }

    case 'DODAJ_BELESKU': {
      const tekst = a.tekst.trim()
      if (!tekst || tekst.length > MAX_BELESKA || !s.zahtevi.some((z) => z.id === a.zahtevId)) return s
      const [id, s1] = noviId(s, 'bel')
      return { ...s1, beleske: [...s1.beleske, { id, zahtevId: a.zahtevId, tekst, sati: s.sati }] }
    }

    case 'BLOKIRAJ_DAN': {
      const l = nadjiLokaciju(a.lokacijaId)
      if (!l) return s
      const o = mozeLiBlokirati({ l, dan: a.dan, blokirani: s.blokiraniDani, opcije: s.opcije, zahtevi: s.zahtevi, sada: s.sati })
      if (!o.moze) return s
      return { ...s, blokiraniDani: { ...s.blokiraniDani, [l.id]: [...(s.blokiraniDani[l.id] ?? []), a.dan].sort() } }
    }

    case 'ODBLOKIRAJ_DAN': {
      // Mogu se odblokirati samo dani koje je vlasnik sam blokirao (ne i unapred zauzeti, odluka O18)
      if (!(s.blokiraniDani[a.lokacijaId] ?? []).includes(a.dan)) return s
      return { ...s, blokiraniDani: { ...s.blokiraniDani, [a.lokacijaId]: s.blokiraniDani[a.lokacijaId].filter((d) => d !== a.dan) } }
    }

    case 'OTKAZI_REZERVACIJU_VLASNIK': {
      // B5: vlasnik otkazuje PLAĆENU rezervaciju; naknada se vraća (izmišljeno), termin se oslobađa, adresa se zatvara
      const z = s.zahtevi.find((x) => x.id === a.zahtevId)
      const p = z ? s.predracuni.find((x) => x.zahtevId === z.id) : undefined
      if (!z || !p || !mozeLiOtkazatiVlasnik(z, p, s.sati).moze) return s
      return zabelezi({
        ...s,
        zahtevi: s.zahtevi.map((x) => (x.id === z.id ? { ...x, stanje: 'otkazao-vlasnik', otkazan: s.sati } : x)),
        predracuni: s.predracuni.map((x) => (x.id === p.id ? { ...x, povracaj: { sati: s.sati, iznosPara: x.ukupnoPara } } : x)),
      }, `Vlasnik otkazao plaćenu rezervaciju: ${nadjiLokaciju(z.lokacijaId)?.naziv}`, p.id)
    }
  }
}

/** Samo poznata polja tehničkog lista, skraćena; u stanje nikad ne ulazi ništa drugo (pogotovo ne adresa). */
function ociscenTehnicki(unos: Record<string, string>): Record<string, string> {
  const izlaz: Record<string, string> = {}
  for (const f of POLJA_TEHNICKOG) {
    const v = (unos[f.kljuc] ?? '').trim().slice(0, 200)
    if (v) izlaz[f.kljuc] = v
  }
  return izlaz
}

