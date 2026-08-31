import { cookies } from "next/headers";
import { AppShell } from "@/components/app-shell";
import { DataProvider } from "@/lib/data-context";
import { DEMO_USER_COOKIE } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { deriveMemberName } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let userName: string | undefined;

  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) userName = deriveMemberName(user.email);
  }
  if (!userName) {
    const cookieStore = await cookies();
    userName = cookieStore.get(DEMO_USER_COOKIE)?.value || "Eatons";
  }

  return (
    <DataProvider userName={userName}>
      <AppShell>{children}</AppShell>
    </DataProvider>
  );
}
