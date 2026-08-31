"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, KeyRound, Loader2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { EatonLogo } from "@/components/logo";
import { Reveal } from "@/components/anim";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { enterDemo } from "./actions";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoPending, startDemo] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const supabase = createClient();
    if (!supabase) {
      setError("Supabase isn't connected yet — use the demo entrance below.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setNotice("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      {/* Cinematic floating orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full bg-brand-cyan/15 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/3 h-[420px] w-[420px] rounded-full bg-teal-500/15 blur-[110px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[-160px] left-1/3 h-[380px] w-[380px] rounded-full bg-brand-orange/10 blur-[100px]"
      />

      <Reveal className="relative w-full max-w-5xl">
        <div
          data-reveal
          className="glass grid overflow-hidden rounded-[2rem] lg:grid-cols-[1.1fr_1fr]"
        >
          {/* Brand panel */}
          <div className="glass-deep relative hidden flex-col justify-between p-12 lg:flex">
            <EatonLogo dark />
            <div>
              <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs font-light tracking-[0.25em] text-white/70 uppercase">
                <Sparkles className="h-3.5 w-3.5 text-brand-cyan" />
                The Eaton Family Home OS
              </p>
              <h1 className="text-display text-5xl leading-[1.05] text-white">
                Every upgrade,
                <br />
                every dollar,
                <br />
                <span className="text-brand-cyan">one home.</span>
              </h1>
              <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-white/60">
                Priorities, budgets, price tracking, and the recurring care your
                house quietly asks for — beautifully in one place for Mel &amp; Nate.
              </p>
            </div>
            <div className="flex items-center gap-6 text-[11px] font-light tracking-[0.2em] text-white/40 uppercase">
              <span>Priorities</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>Budget</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>3D House</span>
              <span className="h-1 w-1 rounded-full bg-white/30" />
              <span>Care</span>
            </div>
          </div>

          {/* Form panel */}
          <div className="flex flex-col justify-center p-8 sm:p-12">
            <div className="mb-8 lg:hidden">
              <EatonLogo />
            </div>
            <h2 className="text-display text-3xl">Welcome home</h2>
            <p className="mt-2 text-sm font-light text-muted-foreground">
              {mode === "signin"
                ? "Sign in to open the household dashboard."
                : "Create your household account."}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-light">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@eatonhome.family"
                    className="glass-chip h-12 rounded-2xl pl-10 font-light"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-light">
                  Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="glass-chip h-12 rounded-2xl pl-10 font-light"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-light text-destructive">
                  {error}
                </p>
              )}
              {notice && (
                <p className="rounded-xl bg-brand-cyan/10 px-4 py-2.5 text-sm font-light text-brand-cyan">
                  {notice}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy || !isSupabaseConfigured}
                className="h-12 w-full rounded-2xl bg-primary text-base font-light tracking-wide"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : mode === "signin" ? (
                  "Sign in"
                ) : (
                  "Create account"
                )}
              </Button>
              {!isSupabaseConfigured && (
                <p className="text-center text-xs font-light text-muted-foreground">
                  Supabase sign-in activates once{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-[10px]">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{" "}
                  is set.
                </p>
              )}
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="mt-4 text-sm font-light text-muted-foreground transition-colors hover:text-foreground"
            >
              {mode === "signin"
                ? "New here? Create the household account"
                : "Already set up? Sign in instead"}
            </button>

            <div className="my-6 flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-[11px] font-light tracking-[0.2em] text-muted-foreground uppercase">
                or
              </span>
              <Separator className="flex-1" />
            </div>

            <p className="mb-3 text-center text-xs font-light text-muted-foreground">
              Step inside the demo home as…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(["Melanie", "Nate"] as const).map((member) => (
                <Button
                  key={member}
                  variant="outline"
                  disabled={demoPending}
                  onClick={() => startDemo(() => enterDemo(member))}
                  className="glass-chip group h-12 rounded-2xl text-base font-light"
                >
                  {demoPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span
                        className={
                          "flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium text-brand-ink " +
                          (member === "Melanie" ? "bg-brand-green" : "bg-brand-orange")
                        }
                      >
                        {member[0]}
                      </span>
                      {member}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </main>
  );
}
