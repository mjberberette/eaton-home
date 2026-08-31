"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, DEMO_USER_COOKIE } from "@/lib/supabase/config";
import { HOUSEHOLD_MEMBERS, type HouseholdMember } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function enterDemo(member?: string) {
  const cookieStore = await cookies();
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  };
  cookieStore.set(DEMO_COOKIE, "1", opts);
  const name: HouseholdMember = HOUSEHOLD_MEMBERS.includes(member as HouseholdMember)
    ? (member as HouseholdMember)
    : "Melanie";
  cookieStore.set(DEMO_USER_COOKIE, name, opts);
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
  cookieStore.delete(DEMO_USER_COOKIE);
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
