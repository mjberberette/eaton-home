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
  /** Display name of the signed-in household member (e.g. "Melanie") */
  userName: string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  addProject: (project: Project, atRank?: number) => void;
  moveRank: (id: string, direction: -1 | 1) => void;
  setRank: (id: string, rank: number) => void;
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
  updated_by: string | null;
  updated_at: string | null;
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
    updatedBy: r.updated_by ?? undefined,
    updatedAt: r.updated_at ?? undefined,
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
    updated_by: p.updatedBy ?? null,
    updated_at: p.updatedAt ?? null,
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

export function DataProvider({
  children,
  userName = "Eatons",
}: {
  children: ReactNode;
  userName?: string;
}) {
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

  // Live sync: when Supabase is connected, any change made by either member
  // (from any device) refreshes everyone else's view within a moment.
  useEffect(() => {
    if (!remote) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const reload = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        const data = await loadFromSupabase(remote);
        if (data) setDb(data);
      }, 400);
    };
    const channel = remote
      .channel("eaton-home-live")
      .on("postgres_changes", { event: "*", schema: "public" }, reload)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void remote.removeChannel(channel);
    };
  }, [remote]);

  // Demo mode: keep multiple open tabs of the same browser in sync.
  useEffect(() => {
    if (remote) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue) as HomeDB;
        if (parsed.projects?.length) setDb(parsed);
      } catch {
        // Ignore malformed updates
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [remote]);

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

  const stamp = useCallback(
    (): Pick<Project, "updatedBy" | "updatedAt"> => ({
      updatedBy: userName,
      updatedAt: new Date().toISOString(),
    }),
    [userName]
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      const stamped = { ...patch, ...stamp() };
      apply((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === id ? { ...p, ...stamped } : p)),
      }));
      if (remote) {
        setDb((current) => {
          const p = current.projects.find((x) => x.id === id);
          if (p) void remote.from("projects").upsert(projectToRow(p));
          return current;
        });
      }
    },
    [apply, remote, stamp]
  );

  /** Reorders the full list so ranks are always a clean 1..n sequence. */
  const applyOrder = useCallback(
    (prev: HomeDB, orderedIds: string[], stampId?: string) => {
      const rankOf = new Map(orderedIds.map((id, i) => [id, i + 1]));
      const meta = stamp();
      const changed: { id: string; rank: number; updated_by?: string; updated_at?: string }[] = [];
      const projects = prev.projects.map((p) => {
        const rank = rankOf.get(p.id);
        const isMoved = p.id === stampId;
        if (rank === undefined || (rank === p.rank && !isMoved)) return p;
        changed.push({
          id: p.id,
          rank,
          ...(isMoved && { updated_by: meta.updatedBy, updated_at: meta.updatedAt }),
        });
        return isMoved ? { ...p, rank, ...meta } : { ...p, rank };
      });
      if (remote && changed.length) void remote.from("projects").upsert(changed);
      return { ...prev, projects };
    },
    [remote, stamp]
  );

  const addProject = useCallback(
    (project: Project, atRank?: number) => {
      const stamped = { ...project, ...stamp() };
      apply((prev) => {
        const sorted = [...prev.projects].sort((a, b) => a.rank - b.rank);
        const target = Math.max(
          1,
          Math.min(sorted.length + 1, Math.round(atRank ?? sorted.length + 1))
        );
        const ids = sorted.map((p) => p.id);
        ids.splice(target - 1, 0, stamped.id);
        const withNew = {
          ...prev,
          projects: [...prev.projects, { ...stamped, rank: target }],
        };
        if (remote) void remote.from("projects").insert(projectToRow({ ...stamped, rank: target }));
        return applyOrder(withNew, ids);
      });
    },
    [apply, applyOrder, remote, stamp]
  );

  const setRank = useCallback(
    (id: string, rank: number) => {
      apply((prev) => {
        const sorted = [...prev.projects].sort((a, b) => a.rank - b.rank);
        const idx = sorted.findIndex((p) => p.id === id);
        if (idx < 0) return prev;
        const target = Math.max(1, Math.min(sorted.length, Math.round(rank)));
        if (target === idx + 1) return prev;
        const ids = sorted.map((p) => p.id);
        ids.splice(idx, 1);
        ids.splice(target - 1, 0, id);
        return applyOrder(prev, ids, id);
      });
    },
    [apply, applyOrder]
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
      const meta = stamp();
      apply((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, priceHistory: [...p.priceHistory, point], estimatedCost: point.price, ...meta }
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
    [apply, remote, stamp]
  );

  const value = useMemo(
    () => ({
      db,
      loading,
      demoMode: !remote,
      userName,
      updateProject,
      addProject,
      moveRank,
      setRank,
      completeTask,
      updateBudget,
      addPricePoint,
    }),
    [db, loading, remote, userName, updateProject, addProject, moveRank, setRank, completeTask, updateBudget, addPricePoint]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useHome() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useHome must be used inside DataProvider");
  return ctx;
}
