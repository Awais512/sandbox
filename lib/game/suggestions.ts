import type { LucideIcon } from "lucide-react"
import {
  CarIcon,
  CrosshairIcon,
  Gamepad2Icon,
  PickaxeIcon,
  PlaneIcon,
  SwordsIcon,
  ZapIcon,
} from "lucide-react"

export interface Suggestion {
  label: string
  icon: LucideIcon
}

export const suggestions: Suggestion[] = [
  { label: "Voxel survival", icon: PickaxeIcon },
  { label: "Ink samurai duel", icon: SwordsIcon },
  { label: "Comic-book firefight", icon: ZapIcon },
  { label: "Realistic battlefield", icon: PlaneIcon },
  { label: "Fight-first shooter", icon: CrosshairIcon },
  { label: "Jungle expedition drive", icon: CarIcon },
  { label: "Sunny kingdom platformer", icon: Gamepad2Icon },
]
