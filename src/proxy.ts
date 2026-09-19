import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DEMO_COOKIE,
  DEMO_USER_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

const PUBLIC_PATHS = ["/login"];
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Re-issue session cookies from the server on every response.
 * Server-set (HTTP) cookies are exempt from Safari's 7-day cap on
 * script-written storage — the main reason iPhone home-screen apps kept
 * asking to sign in again — and this keeps their lifetime rolling forward.
 */
function persistSessionCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    const isAuth =
      cookie.name.startsWith("sb-") ||
      cookie.name === DEMO_COOKIE ||
      cookie.name === DEMO_USER_COOKIE;
    if (!isAuth || response.cookies.get(cookie.name)) continue;
    response.cookies.set(cookie.name, cookie.value, {
      path: "/",
      sameSite: "lax",
      maxAge: ONE_YEAR,
      httpOnly: cookie.name === DEMO_COOKIE || cookie.name === DEMO_USER_COOKIE,
      secure: request.nextUrl.protocol === "https:",
    });
  }
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  let response = NextResponse.next({ request });
  let authenticated = false;
  const hasSupabaseCookie = request.cookies.getAll().some((c) => c.name.startsWith("sb-"));

  if (isSupabaseConfigured) {
    const supabase = createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, { ...options, maxAge: ONE_YEAR })
          );
        },
      },
    });
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (user) {
      authenticated = true;
    } else if (error && hasSupabaseCookie) {
      // A definitive auth rejection (401/403) means the session is truly gone.
      // Anything else (network blip, Supabase 5xx, timeout) is transient —
      // never bounce a signed-in household member to the login page for that.
      const status = (error as { status?: number }).status;
      const definitive = status === 401 || status === 403;
      if (!definitive) authenticated = true;
    }
  }

  // Demo session works with or without Supabase configured.
  if (!authenticated && request.cookies.get(DEMO_COOKIE)?.value === "1") {
    authenticated = true;
  }

  if (!authenticated && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (authenticated && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirect = NextResponse.redirect(url);
    // Carry any freshly refreshed session cookies along with the redirect
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
    return persistSessionCookies(request, redirect);
  }

  return authenticated ? persistSessionCookies(request, response) : response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|site.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp|ico|webmanifest)$).*)",
  ],
};
