import {
  BedDouble,
  CarFront,
  ChefHat,
  DoorOpen,
  House,
  Laptop,
  Monitor,
  ShowerHead,
  Sofa,
  TreePine,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Visual identity per project category: the icon shown inside a 3D house
 * hotspot chip and the soft pastel behind it (echoes smart-home marker UI).
 */
export const CATEGORY_META: Record<string, { icon: LucideIcon; pastel: string }> = {
  yard: { icon: TreePine, pastel: "#dcf3c4" },
  outside: { icon: House, pastel: "#c9ecf4" },
  kitchen: { icon: ChefHat, pastel: "#ffe6bd" },
  bathrooms: { icon: ShowerHead, pastel: "#c9e4fb" },
  "living-room": { icon: Sofa, pastel: "#ffd9cc" },
  "office-mel": { icon: Laptop, pastel: "#eadcfa" },
  "office-nate": { icon: Monitor, pastel: "#d6dcfa" },
  "entry-room": { icon: DoorOpen, pastel: "#f6ecc8" },
  garage: { icon: CarFront, pastel: "#d4f0e2" },
  "master-bedroom": { icon: BedDouble, pastel: "#fbd9e8" },
  "house-repairs": { icon: Wrench, pastel: "#e7e2d8" },
};

export const DEFAULT_CATEGORY_META = { icon: House, pastel: "#e5efe9" };

export function categoryMeta(categoryId: string) {
  return CATEGORY_META[categoryId] ?? DEFAULT_CATEGORY_META;
}
