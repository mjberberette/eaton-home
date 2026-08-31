"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/client";
import { isSupabaseConfigured } from "./supabase/config";
import { SEED_DB } from "./seed";
import {
  STATUS_LABEL,
  formatMoney,
  type ActivityAction,
  type ActivityEntry,
  type Budget,
  type HomeDB,
  type HomeInfo,
  type PricePoint,
  type Project,
  type ProjectNote,
  type RecurringTask,
} from "./types";

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
  addNote: (projectId: string, text: string) => void;
  deleteNote: (projectId: string, noteId: string) => void;
  updateHomeInfo: (info: HomeInfo) => void;
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
  notes: ProjectNote[] | null;
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
    notes: r.notes ?? [],
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
    notes: p.notes ?? [],
    created_at: p.createdAt,
    updated_by: p.updatedBy ?? null,
    updated_at: p.updatedAt ?? null,
  };
}

type ActivityRow = {
  id: string;
  actor: string;
  action: ActivityAction;
  target_id: string | null;
  target_title: string;
  detail: string | null;
  created_at: string;
};

function rowToActivity(r: ActivityRow): ActivityEntry {
  return {
    id: r.id,
    actor: r.actor,
    action: r.action,
    targetId: r.target_id ?? undefined,
    targetTitle: r.target_title,
    detail: r.detail ?? undefined,
    createdAt: r.created_at,
  };
}

function activityToRow(a: ActivityEntry): ActivityRow {
  return {
    id: a.id,
    actor: a.actor,
    action: a.action,
    target_id: a.targetId ?? null,
    target_title: a.targetTitle,
    detail: a.detail ?? null,
    created_at: a.createdAt,
  };
}

async function loadFromSupabase(supabase: SupabaseClient): Promise<HomeDB | null> {
  const [cats, projs, tasks, budget, activity, homeInfo] = await Promise.all([
    supabase.from("categories").select("*").order("sort"),
    supabase.from("projects").select("*").order("rank"),
    supabase.from("recurring_tasks").select("*"),
    supabase.from("budget").select("*").limit(1).maybeSingle(),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(200),
    supabase.from("home_info").select("*").limit(1).maybeSingle(),
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
    activity: ((activity.data as ActivityRow[]) ?? []).map(rowToActivity),
    homeInfo: (homeInfo.data?.data as HomeInfo) ?? SEED_DB.homeInfo,
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
          if (parsed.projects?.length) {
            setDb({
              ...parsed,
              activity: parsed.activity ?? SEED_DB.activity,
              homeInfo: parsed.homeInfo ?? SEED_DB.homeInfo,
            });
          }
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

  // Live mirror of db for lookups inside event-handler callbacks
  const dbRef = useRef(db);
  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  /**
   * Append to the household change log. Rapid repeats of the same action on
   * the same target (slider drags, typing) merge into one entry.
   */
  const logActivity = useCallback(
    (
      action: ActivityAction,
      targetTitle: string,
      opts?: { targetId?: string; detail?: string }
    ) => {
      const now = new Date().toISOString();
      const entry: ActivityEntry = {
        id: `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        actor: userName,
        action,
        targetId: opts?.targetId,
        targetTitle,
        detail: opts?.detail,
        createdAt: now,
      };
      apply((prev) => {
        const list = prev.activity ?? [];
        const last = list[0];
        const isRepeat =
          last &&
          last.actor === entry.actor &&
          last.action === entry.action &&
          last.targetId === entry.targetId &&
          Date.now() - new Date(last.createdAt).getTime() < 60000;
        if (isRepeat) {
          const merged = { ...last, detail: entry.detail ?? last.detail, createdAt: now };
          if (remote) void remote.from("activity_log").upsert(activityToRow(merged));
          return { ...prev, activity: [merged, ...list.slice(1)].slice(0, 200) };
        }
        if (remote) void remote.from("activity_log").insert(activityToRow(entry));
        return { ...prev, activity: [entry, ...list].slice(0, 200) };
      });
    },
    [apply, remote, userName]
  );

  const projectTitle = useCallback(
    (id: string) => dbRef.current.projects.find((p) => p.id === id)?.title ?? "a project",
    []
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Project>) => {
      const stamped = { ...patch, ...stamp() };
      const title = patch.title ?? projectTitle(id);
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
      const keys = Object.keys(patch);
      const storeOnly = keys.every((k) => k === "storeName" || k === "storeUrl");
      if (storeOnly) return; // covered by the accompanying logged_price entry
      if (patch.status !== undefined) {
        logActivity("changed_status", title, { targetId: id, detail: `now ${STATUS_LABEL[patch.status]}` });
      } else if (patch.progress !== undefined) {
        logActivity("updated_project", title, { targetId: id, detail: `progress → ${patch.progress}%` });
      } else if (patch.spent !== undefined) {
        logActivity("updated_project", title, { targetId: id, detail: `spent → ${formatMoney(patch.spent)}` });
      } else {
        logActivity("updated_project", title, { targetId: id, detail: "edited details" });
      }
    },
    [apply, remote, stamp, logActivity, projectTitle]
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
      const rank = Math.max(
        1,
        Math.min(dbRef.current.projects.length + 1, Math.round(atRank ?? dbRef.current.projects.length + 1))
      );
      logActivity("added_project", project.title, {
        targetId: project.id,
        detail: `priority #${rank} · ${formatMoney(project.estimatedCost)}`,
      });
    },
    [apply, applyOrder, remote, stamp, logActivity]
  );

  const setRank = useCallback(
    (id: string, rank: number) => {
      const sortedNow = [...dbRef.current.projects].sort((a, b) => a.rank - b.rank);
      const idxNow = sortedNow.findIndex((p) => p.id === id);
      if (idxNow < 0) return;
      const targetNow = Math.max(1, Math.min(sortedNow.length, Math.round(rank)));
      if (targetNow === idxNow + 1) return;

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
      logActivity("changed_priority", projectTitle(id), {
        targetId: id,
        detail: `moved to #${targetNow}`,
      });
    },
    [apply, applyOrder, logActivity, projectTitle]
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
      const name = dbRef.current.tasks.find((t) => t.id === id)?.name ?? "a task";
      apply((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t): RecurringTask => (t.id === id ? { ...t, lastDone: today } : t)),
      }));
      if (remote) void remote.from("recurring_tasks").update({ last_done: today }).eq("id", id);
      logActivity("completed_task", name, { detail: "cycle restarted" });
    },
    [apply, remote, logActivity]
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
      const parts: string[] = [];
      if (patch.monthlyBudget !== undefined)
        parts.push(`monthly → ${formatMoney(patch.monthlyBudget)}`);
      if (patch.projectFund !== undefined)
        parts.push(`fund → ${formatMoney(patch.projectFund)}`);
      logActivity("updated_budget", "the budget", { detail: parts.join(" · ") || undefined });
    },
    [apply, remote, logActivity]
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
      logActivity("logged_price", projectTitle(projectId), {
        targetId: projectId,
        detail: `${formatMoney(point.price)}${point.note ? ` · ${point.note}` : ""}`,
      });
    },
    [apply, remote, stamp, logActivity, projectTitle]
  );

  const addNote = useCallback(
    (projectId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const note: ProjectNote = {
        id: `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        author: userName,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      const meta = stamp();
      apply((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, notes: [...(p.notes ?? []), note], ...meta } : p
        ),
      }));
      if (remote) {
        setDb((current) => {
          const p = current.projects.find((x) => x.id === projectId);
          if (p) void remote.from("projects").upsert(projectToRow(p));
          return current;
        });
      }
      logActivity("added_note", projectTitle(projectId), { targetId: projectId });
    },
    [apply, remote, stamp, userName, logActivity, projectTitle]
  );

  const deleteNote = useCallback(
    (projectId: string, noteId: string) => {
      apply((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId
            ? { ...p, notes: (p.notes ?? []).filter((n) => n.id !== noteId) }
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
      logActivity("deleted_note", projectTitle(projectId), { targetId: projectId });
    },
    [apply, remote, logActivity, projectTitle]
  );

  const updateHomeInfo = useCallback(
    (info: HomeInfo) => {
      apply((prev) => ({ ...prev, homeInfo: info }));
      if (remote) void remote.from("home_info").upsert({ id: 1, data: info });
      logActivity("updated_home", "the home facts");
    },
    [apply, remote, logActivity]
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
      addNote,
      deleteNote,
      updateHomeInfo,
    }),
    [db, loading, remote, userName, updateProject, addProject, moveRank, setRank, completeTask, updateBudget, addPricePoint, addNote, deleteNote, updateHomeInfo]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useHome() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useHome must be used inside DataProvider");
  return ctx;
}
