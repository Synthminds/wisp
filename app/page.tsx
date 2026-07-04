/**
 * Placeholder shell for Phase 1. The production dashboard (Phase 3) is built
 * from the spec in src/components/Dashboard.jsx — one component tree, full grid
 * at >=1000px and compact below. This page just states the contract until then.
 */
export default function Home() {
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
    </main>
  );
}
