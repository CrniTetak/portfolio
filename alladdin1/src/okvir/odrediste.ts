// Odredište izabrano u pretrazi na početnoj (S2) prenosi se na G1 (u memoriji; ne čuva se).
let izabrano = 'Macau'
export const odrediste = () => izabrano
export const postaviOdrediste = (o: string) => {
  izabrano = o
}
