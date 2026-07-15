import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/src/lib/auth/password";
import {
  createSessionToken,
  HouseholdUser,
  SESSION_COOKIE,
  SESSION_TTL_MS,
} from "@/src/lib/auth/session";
import { ErrorCodes } from "@/src/lib/errors";

export const dynamic = "force-dynamic";

/**
 * Two-user login. No public signup — the user set is the closed enum, and the
 * only credentials are the scrypt hashes in env (AUTH_WES_HASH / AUTH_RIA_HASH,
 * generated with `pnpm auth:hash`). Middleware is not auth: everything that
 * needs identity re-reads the session cookie in its own handler.
 */
const LoginInput = z.object({
  user: HouseholdUser,
  password: z.string().min(1),
});

const HASH_ENV: Record<HouseholdUser, string> = {
  wes: "AUTH_WES_HASH",
  ria: "AUTH_RIA_HASH",
};

export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const parsed = LoginInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { code: ErrorCodes.INVALID_INPUT, message: "Invalid login payload." },
      { status: 400 },
    );
  }

  const secret = process.env.SESSION_SECRET;
  const storedHash = process.env[HASH_ENV[parsed.data.user]];
  // One generic 401 for every failure mode — never reveal which part failed.
  if (
    !secret ||
    !storedHash ||
    !verifyPassword(parsed.data.password, storedHash)
  ) {
    return NextResponse.json(
      { code: ErrorCodes.UNAUTHORIZED, message: "Invalid credentials." },
      { status: 401 },
    );
  }

  const res = NextResponse.json({ status: "ok", user: parsed.data.user });
  res.cookies.set(SESSION_COOKIE, createSessionToken(parsed.data.user, secret), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
