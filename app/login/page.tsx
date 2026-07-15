"use client";

/**
 * Two-user login form. No public signup — the picker is the closed HouseholdUser
 * enum (wes / ria). POSTs to /api/auth/login; on success the server sets the
 * HttpOnly session cookie and we navigate to the dashboard. Every failure shows
 * one generic message so the form never reveals which field was wrong.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";

type HouseholdUser = "wes" | "ria";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState<HouseholdUser>("wes");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
        return;
      }
      setError("Invalid credentials.");
    } catch {
      setError("Invalid credentials.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: 2 }}>WISP</h1>
      <form
        onSubmit={onSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          width: "100%",
          maxWidth: 320,
          background: "var(--color-panel)",
          border: "1px solid var(--color-line)",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ color: "var(--color-dim)", fontSize: 13 }}>Who</span>
          <select
            value={user}
            onChange={(e) => setUser(e.target.value as HouseholdUser)}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-line)",
              background: "var(--color-panel2)",
              color: "var(--color-text)",
              fontSize: 15,
            }}
          >
            <option value="wes">Wes</option>
            <option value="ria">Ria</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ color: "var(--color-dim)", fontSize: 13 }}>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--color-line)",
              background: "var(--color-panel2)",
              color: "var(--color-text)",
              fontSize: 15,
            }}
          />
        </label>
        <button
          type="submit"
          disabled={pending || password.length === 0}
          style={{
            marginTop: 4,
            padding: "10px 12px",
            borderRadius: 8,
            border: "none",
            background: "var(--color-wes)",
            color: "var(--color-ink)",
            fontSize: 15,
            fontWeight: 700,
            cursor: pending ? "default" : "pointer",
            opacity: pending || password.length === 0 ? 0.6 : 1,
          }}
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
        {error ? (
          <p
            role="alert"
            style={{ color: "var(--color-crit)", fontSize: 13, margin: 0 }}
          >
            {error}
          </p>
        ) : null}
      </form>
    </main>
  );
}
