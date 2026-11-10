// Snimak grupe za tekuću poziciju priče (jedini ulaz za brojke ekrana grupe).
import { useMemo } from 'react'
import { stanjeGrupe } from '../scenario/stanjeGrupe'
import { useDemo } from './DemoProvider'

export function useStanje() {
  const { poz } = useDemo()
  const s = useMemo(() => stanjeGrupe(poz), [poz])
  return { poz, s }
}
