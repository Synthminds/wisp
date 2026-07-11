"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Ends the session server-side, then returns to the login screen. */
export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } finally {
          router.push("/login");
          router.refresh();
        }
      }}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: "1px solid var(--color-line)",
        background: "transparent",
        color: "var(--color-dim)",
        fontSize: 13,
        cursor: pending ? "default" : "pointer",
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
