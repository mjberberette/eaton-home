export type ProjectStatus = "idea" | "planned" | "in_progress" | "done";

export interface Category {
  id: string;
  name: string;
  slug: string;
  /** Grouping used for filters: outdoor / indoor / repairs */
  zone: "outdoor" | "indoor" | "repairs";
  sort: number;
}

export interface PricePoint {
  /** ISO date */
  date: string;
  price: number;
  note?: string;
}

export interface Hotspot {
  /** Position on the 3D house model */
  x: number;
  y: number;
  z: number;
}

export interface ProjectNote {
  id: string;
  author: string;
  text: string;
  /** ISO timestamp */
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  /** 1 = highest priority on the master list */
  rank: number;
  status: ProjectStatus;
  estimatedCost: number;
  spent: number;
  /** 0-100 */
  progress: number;
  storeName?: string;
  storeUrl?: string;
  inspirationImage?: string;
  beforeImage?: string;
  afterImage?: string;
  hotspot?: Hotspot;
  priceHistory: PricePoint[];
  /** Running conversation between household members about this project */
  notes?: ProjectNote[];
  createdAt: string;
  /** Household member who last changed this project */
  updatedBy?: string;
  /** ISO timestamp of the last change */
  updatedAt?: string;
}

export const HOUSEHOLD_MEMBERS = ["Melanie", "Nate"] as const;
export type HouseholdMember = (typeof HOUSEHOLD_MEMBERS)[number];

/** Best-effort display name from a Supabase account email. */
export function deriveMemberName(email?: string | null): string {
  if (!email) return "Eatons";
  const local = email.split("@")[0].toLowerCase();
  if (local.includes("mel")) return "Melanie";
  if (local.includes("nate") || local.includes("nathan")) return "Nate";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export function timeAgo(iso: string, now = new Date()): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((now.getTime() - then) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface RecurringTask {
  id: string;
  name: string;
  detail?: string;
  intervalDays: number;
  /** ISO date of last completion */
  lastDone: string;
  icon: "filter" | "droplets" | "wind" | "flame" | "leaf" | "battery" | "wrench" | "home";
}

export interface Budget {
  monthlyBudget: number;
  projectFund: number;
}

export interface HomeDB {
  categories: Category[];
  projects: Project[];
  tasks: RecurringTask[];
  budget: Budget;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  idea: "Idea",
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
};

export const STATUS_ORDER: ProjectStatus[] = ["idea", "planned", "in_progress", "done"];

export function daysUntilDue(task: RecurringTask, now = new Date()): number {
  const last = new Date(task.lastDone);
  const due = new Date(last.getTime() + task.intervalDays * 86400000);
  return Math.ceil((due.getTime() - now.getTime()) / 86400000);
}

export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}
