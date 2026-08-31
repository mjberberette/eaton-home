"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  House,
  LayoutDashboard,
  ListTodo,
  LogOut,
  PiggyBank,
  Rotate3d,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { EatonLogo, EatonMark } from "@/components/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { signOut } from "@/app/login/actions";
import { useHome } from "@/lib/data-context";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: ListTodo },
  { href: "/house", label: "3D House", icon: Rotate3d },
  { href: "/tasks", label: "Home Care", icon: CalendarCheck },
  { href: "/budget", label: "Budget", icon: PiggyBank },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { demoMode } = useHome();

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1560px] gap-5 p-3 sm:p-5">
        {/* Desktop sidebar */}
        <aside className="glass-deep sticky top-5 hidden h-[calc(100vh-2.5rem)] w-[86px] shrink-0 flex-col items-center justify-between rounded-[2rem] py-7 md:flex">
          <Link href="/" aria-label="Eaton Home dashboard">
            <EatonMark className="h-11 w-11 transition-transform hover:scale-105" />
          </Link>

          <nav className="flex flex-col items-center gap-2.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={href}
                      aria-label={label}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300",
                        active
                          ? "bg-brand-cyan text-brand-ink shadow-[0_8px_24px_-6px_rgba(60,219,200,0.55)]"
                          : "text-white/50 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-light">
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          <div className="flex flex-col items-center gap-4">
            <div className="flex -space-x-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-[11px] font-medium text-white ring-2 ring-black/30">
                M
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-[11px] font-medium text-white ring-2 ring-black/30">
                N
              </span>
            </div>
            <form action={signOut}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    aria-label="Sign out"
                    className="flex h-11 w-11 items-center justify-center rounded-2xl text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4.5 w-4.5" strokeWidth={1.5} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-light">
                  Sign out
                </TooltipContent>
              </Tooltip>
            </form>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-0">
          {/* Mobile top bar */}
          <header className="glass mb-4 flex items-center justify-between rounded-3xl px-5 py-3.5 md:hidden">
            <EatonLogo />
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground"
              >
                <LogOut className="h-4.5 w-4.5" strokeWidth={1.5} />
              </button>
            </form>
          </header>

          {demoMode && (
            <div className="glass-chip mb-4 hidden items-center gap-2 self-start rounded-full px-4 py-1.5 text-xs font-light text-muted-foreground md:inline-flex">
              <House className="h-3.5 w-3.5 text-brand-cyan" />
              Demo home — connect Supabase to sync your real data
            </div>
          )}

          <main className="min-w-0 flex-1">{children}</main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="glass-deep fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-3xl px-2 py-2.5 md:hidden">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                  active ? "bg-brand-cyan text-brand-ink" : "text-white/50"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </Link>
            );
          })}
        </nav>
      </div>
    </TooltipProvider>
  );
}
