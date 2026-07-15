import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/src/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Ends the session by clearing the cookie. Same attributes as the login cookie
 * (HttpOnly/Secure/SameSite/path) with maxAge 0 so the browser drops it. No
 * body, no identity in the response — logging out reveals nothing.
 */
export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ status: "ok" });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
