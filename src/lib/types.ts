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

/** A material/part needed to complete a project. */
export interface ProjectItem {
  id: string;
  name: string;
  price: number;
  /** Link to where to buy it */
  url?: string;
  purchased: boolean;
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
  /** Everything needed to complete the project, with per-item links and prices */
  items?: ProjectItem[];
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

export type ActivityAction =
  | "added_project"
  | "updated_project"
  | "changed_priority"
  | "changed_status"
  | "logged_price"
  | "completed_task"
  | "updated_budget"
  | "updated_home"
  | "added_note"
  | "deleted_note"
  | "deleted_project";

export interface ActivityEntry {
  id: string;
  actor: string;
  action: ActivityAction;
  /** Project id when the target is a project (for deep links) */
  targetId?: string;
  targetTitle: string;
  detail?: string;
  /** ISO timestamp */
  createdAt: string;
}

export const ACTIVITY_VERB: Record<ActivityAction, string> = {
  added_project: "added",
  updated_project: "updated",
  changed_priority: "re-prioritized",
  changed_status: "changed the status of",
  logged_price: "logged a price for",
  completed_task: "completed",
  updated_budget: "updated",
  updated_home: "updated",
  added_note: "left a note on",
  deleted_note: "removed a note from",
  deleted_project: "removed",
};

export interface Appliance {
  id: string;
  name: string;
  /** Make/model/spec, e.g. "Rheem Performance 50-gal gas tank" */
  detail?: string;
  installedYear: number;
}

export interface HomeInfo {
  livableSqft: number;
  totalSqft: number;
  bedrooms: number;
  bathrooms: number;
  appliances: Appliance[];
}

export function applianceAge(installedYear: number, now = new Date()): number {
  return Math.max(0, now.getFullYear() - installedYear);
}

export interface HomeDB {
  categories: Category[];
  projects: Project[];
  tasks: RecurringTask[];
  budget: Budget;
  activity: ActivityEntry[];
  homeInfo: HomeInfo;
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
