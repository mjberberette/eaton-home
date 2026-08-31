"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import { SEED_DB } from "./seed";
import type { Budget, HomeDB, PricePoint, Project, RecurringTask } from "./types";

const STORAGE_KEY = "eaton-home-db-v1";

interface DataContextValue {
  db: HomeDB;
  loading: boolean;
  demoMode: boolean;
  updateProject: (id: string, patch: Partial<Project>) => void;
  addProject: (project: Project) => void;
  moveRank: (id: string, direction: -1 | 1) => void;
  completeTask: (id: string) => void;
  updateBudget: (patch: Partial<Budget>) => void;
  addPricePoint: (projectId: string, point: PricePoint) => void;
}

const DataContext = createContext<DataContextValue | null>(null);

/* ---------- Supabase row mapping ---------- */

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  category_id: string;
  rank: number;
  status: Project["status"];
  estimated_cost: number;
  spent: number;
  progress: number;
  store_name: string | null;
  store_url: string | null;
  inspiration_image: string | null;
  before_image: string | null;
  after_image: string | null;
  hotspot: Project["hotspot"] | null;
  price_history: PricePoint[] | null;
  created_at: string;
};

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    categoryId: r.category_id,
    rank: r.rank,
    status: r.status,
    estimatedCost: Number(r.estimated_cost),
    spent: Number(r.spent),
    progress: r.progress,
    storeName: r.store_name ?? undefined,
    storeUrl: r.store_url ?? undefined,
    inspirationImage: r.inspiration_image ?? undefined,
    beforeImage: r.before_image ?? undefined,
    afterImage: r.after_image ?? undefined,
    hotspot: r.hotspot ?? undefined,
    priceHistory: r.price_history ?? [],
    createdAt: r.created_at,
  };
}

function projectToRow(p: Project): ProjectRow {
  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category_id: p.categoryId,
    rank: p.rank,
    status: p.status,
    estimated_cost: p.estimatedCost,
    spent: p.spent,
    progress: p.progress,
    store_name: p.storeName ?? null,
    store_url: p.storeUrl ?? null,
    inspiration_image: p.inspirationImage ?? null,
    before_image: p.beforeImage ?? null,
    after_image: p.afterImage ?? null,
    hotspot: p.hotspot ?? null,
    price_history: p.priceHistory,
    created_at: p.createdAt,
  };
}

async function loadFromSupabase(supabase: SupabaseClient): Promise<HomeDB | null> {
  const [cats, projs, tasks, budget] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("projects").select("*").order("rank"),
    supabase.from("recurring_tasks").select("*"),
    supabase.from("budget").select("*").limit(1).maybeSingle(),
  ]);
  if (cats.error || projs.error || tasks.error || budget.error) return null;
  if (!cats.data?.length) return null;

  return {
    categories: cats.data.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      zone: c.zone,
      sort: c.sort,
    })),
    projects: (projs.data as ProjectRow[]).map(rowToProject),
    tasks: (tasks.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      detail: t.detail ?? undefined,
      intervalDays: t.interval_days,
      lastDone: t.last_done,
      icon: t.icon,
    })),
    budget: budget.data
      ? { monthlyBudget: Number(budget.data.monthly_budget), projectFund: Number(budget.data.project_fund) }
      : SEED_DB.budget,
  };
}

/* ---------- Provider ---------- */

export function DataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<HomeDB>(SEED_DB);
  const [loading, setLoading] = useState(true);
  const [remote, setRemote] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (isSupabaseConfigured) {
        const supabase = createClient();
        if (supabase) {
          const data = await loadFromSupabase(supabase);
          if (!cancelled && data) {
            setRemote(supabase);
            setDb(data);
            setLoading(false);
            return;
          }
        }
      }
      // Demo mode: localStorage with seed fallback
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw && !cancelled) {
          const parsed = JSON.parse(raw) as HomeDB;
          if (parsed.projects?.length) setDb(parsed);
        }
      } catch {
        // Corrupt storage — fall back to seed
      }
      if (!cancelled) setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback(
    (next: HomeDB) => {
      if (!remote) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Storage full or unavailable — state still updates in memory
        }
      }
    },
    [remote]
  );

  const apply = useCallback(
    (fn: (prev: HomeDB) => HomeDB) => {
      setDb((prev) => {
        const next = fn(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      apply((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
      if (remote) {
        setDb((current) => {
          const p = current.projects.find((x) => x.id === id);
          if (p) void remote.from("projects").upsert(projectToRow(p));
          return current;
        });
      }
    },
    [apply, remote]
  );

  const addProject = useCallback(
    (project: Project) => {
      apply((prev) => ({ ...prev, projects: [...prev.projects, project] }));
      if (remote) void remote.from("projects").insert(projectToRow(project));
    },
    [apply, remote]
  );

  const moveRank = useCallback(
    (id: string, direction: -1 | 1) => {
      apply((prev) => {
        const sorted = [...prev.projects].sort((a, b) => a.rank - b.rank);
        const idx = sorted.findIndex((p) => p.id === id);
        const swapIdx = idx + direction;
        if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return prev;
        const a = sorted[idx];
        const b = sorted[swapIdx];
        const projects = prev.projects.map((p) => {
          if (p.id === a.id) return { ...p, rank: b.rank };
          if (p.id === b.id) return { ...p, rank: a.rank };
          return p;
        });
        if (remote) {
          void remote.from("projects").upsert([
            { id: a.id, rank: b.rank },
            { id: b.id, rank: a.rank },
          ]);
        }
        return { ...prev, projects };
      });
    },
    [apply, remote]
  );

  const completeTask = useCallback(
    (id: string) => {
      const today = new Date().toISOString().slice(0, 10);
      apply((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t): RecurringTask => (t.id === id ? { ...t, lastDone: today } : t)),
      }));
      if (remote) void remote.from("recurring_tasks").update({ last_done: today }).eq("id", id);
    },
    [apply, remote]
  );

  const updateBudget = useCallback(
    (patch: Partial<Budget>) => {
      apply((prev) => ({ ...prev, budget: { ...prev.budget, ...patch } }));
      if (remote) {
        void remote
          .from("budget")
          .update({
            ...(patch.monthlyBudget !== undefined && { monthly_budget: patch.monthlyBudget }),
            ...(patch.projectFund !== undefined && { project_fund: patch.projectFund }),
          })
          .eq("id", 1);
      }
    },
    [apply, remote]
  );

  const addPricePoint = useCallback(
    (projectId: string, point: PricePoint) => {
      apply((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, priceHistory: [...p.priceHistory, point], estimatedCost: point.price }
            : p
        ),
      }));
      if (remote) {
        setDb((current) => {
          const p = current.projects.find((x) => x.id === projectId);
          if (p) void remote.from("projects").upsert(projectToRow(p));
          return current;
        });
      }
    },
    [apply, remote]
  );

  const value = useMemo(
    () => ({
      db,
      loading,
      demoMode: !remote,
      updateProject,
      addProject,
      moveRank,
      completeTask,
      updateBudget,
      addPricePoint,
    }),
    [db, loading, remote, updateProject, addProject, moveRank, completeTask, updateBudget, addPricePoint]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useHome() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useHome must be used inside DataProvider");
  return ctx;
}
