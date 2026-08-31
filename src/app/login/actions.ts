"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function enterDemo() {
  const cookieStore = await cookies();
  cookieStore.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
