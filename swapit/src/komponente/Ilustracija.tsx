// Ilustracija umesto fotografije (PLAN B6.3): Lucide ikonica na plavoj podlozi, radi u obe teme. Koristi se za usluge, ideje
// i za robu čija fotografija još nije u spisku. Ikonice se uvoze pojedinačno (nema cele biblioteke u buildu).
import { Apple, Baby, BookOpen, Bike, Briefcase, Camera, Car, Carrot, Cherry, CookingPot, Dumbbell, Flower2, Footprints, Gamepad2, Gem, Grape, Guitar, Hammer, HeartPulse, Image, House, Lamp, Laptop, LeafyGreen, Lightbulb, Monitor, PawPrint, Puzzle, Repeat, Shirt, Smartphone, Sofa, Speaker, Sprout, Tent, Tractor, Watch, WashingMachine, Wrench, type LucideIcon } from 'lucide-react'

const IKONICE: Record<string, LucideIcon> = {
  apple: Apple,
  baby: Baby,
  'book-open': BookOpen,
  bike: Bike,
  briefcase: Briefcase,
  camera: Camera,
  carrot: Carrot,
  cherry: Cherry,
  car: Car,
  'cooking-pot': CookingPot,
  dumbbell: Dumbbell,
  'flower-2': Flower2,
  footprints: Footprints,
  'gamepad-2': Gamepad2,
  gem: Gem,
  grape: Grape,
  guitar: Guitar,
  hammer: Hammer,
  'heart-pulse': HeartPulse,
  house: House,
  image: Image,
  lamp: Lamp,
  laptop: Laptop,
  'leafy-green': LeafyGreen,
  lightbulb: Lightbulb,
  monitor: Monitor,
  'paw-print': PawPrint,
  puzzle: Puzzle,
  repeat: Repeat,
  shirt: Shirt,
  smartphone: Smartphone,
  sofa: Sofa,
  speaker: Speaker,
  sprout: Sprout,
  tent: Tent,
  tractor: Tractor,
  watch: Watch,
  'washing-machine': WashingMachine,
  wrench: Wrench,
}

export const ikonaPoImenu = (ime: string): LucideIcon => IKONICE[ime] ?? Puzzle

export function Ilustracija({ ikonica, velicina = 48, className = '' }: { ikonica: string; velicina?: number; className?: string }) {
  const I = ikonaPoImenu(ikonica)
  return (
    <div className={`ilustracija ${className}`} aria-hidden>
      <I size={velicina} strokeWidth={1.5} />
    </div>
  )
}
