/**
 * Placeholder shell for Phase 1, now gated by the session. The production
 * dashboard (Phase 3) is built from the spec in src/components/Dashboard.jsx —
 * one component tree, full grid at >=1000px and compact below. This page just
 * states the contract until then.
 *
 * Middleware is not auth (CVE-2025-29927): this Server Component re-reads and
 * verifies the session cookie itself and redirects to /login when there is no
 * valid user. With SESSION_SECRET unset every request lands on /login — the app
 * stays locked until credentials are provisioned.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/src/lib/auth/session";
import LogoutButton from "./logout-button";

export const dynamic = "force-dynamic";

export default async function Home() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = verifySessionToken(token);
  if (!user) redirect("/login");

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <h1 style={{ fontSize: 34, fontWeight: 800, letterSpacing: 2 }}>WISP</h1>
      <p style={{ color: "var(--color-dim)", maxWidth: 460, lineHeight: 1.5 }}>
        Household monitoring AI. AI plans. AI monitors. Humans execute — Wisp&apos;s
        execution share is locked at 0%.
      </p>
      <p style={{ color: "var(--color-dim)", fontSize: 13 }}>
        Phase 1: foundation. See <code>docs/plan.md</code>.
      </p>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 8,
        }}
      >
        <span style={{ color: "var(--color-dim)", fontSize: 13 }}>
          Signed in as {user}
        </span>
        <LogoutButton />
      </div>
    </main>
  );
}
