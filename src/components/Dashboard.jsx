import { useState, useEffect, useMemo } from "react";

/**
 * WISP DASHBOARD — v4 SPEC (mock data, not production code)
 * ---------------------------------------------------------
 * One component tree for every screen in the fleet:
 *   - full grid at viewport >= 1000px (Cozyla anchor, A9+ landscape)
 *   - compact single-column below 1000px (A9 8.7", phones)
 * Design rules: ink-navy surface; the ONLY gradient on the page is the Wisp
 * orb capture button; lane colors ria/wes/family; proposed plans are dashed
 * until a human approves; a one-tap confirm is the only execution event and
 * visibly cancels escalation. Intercom is push-to-talk transcribe-then-TTS.
 */

const T = {
  ink: "#0d1120",
  panel: "#141a2e",
  panel2: "#1a2140",
  line: "rgba(255,255,255,0.08)",
  text: "#e8ecff",
  dim: "#8b93b5",
  ria: "#f9a8d4",
  wes: "#7dd3fc",
  family: "#c4b5fd",
  good: "#4ade80",
  warn: "#fbbf24",
  crit: "#fb7185",
  orb: "linear-gradient(135deg,#ff5ec8 0%,#7b5bff 50%,#37d8e6 100%)",
};

function useWindowWidth() {
  const [w, setW] = useState(typeof window === "undefined" ? 1200 : window.innerWidth);
  useEffect(() => {
    const on = () => setW(window.innerWidth);
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

// ---------------------------------------------------------------- mock data
const MOCK_SIGNALS = [
  { id: "s1", title: "Romy — dance bag ready for Monday", who: "family", criticality: "critical", pact: false, escalation: "push in 45m → SMS", detail: "Leotard washed? Shoes in bag?", confirmed: false },
  { id: "s2", title: "Dog meds — evening dose", who: "family", criticality: "critical", pact: true, escalation: "push 19:30 → SMS 20:00", detail: "Whidbey · carprofen with food", confirmed: false },
  { id: "s3", title: "Trash out tonight (pickup 7am)", who: "wes", criticality: "routine", pact: false, escalation: null, detail: "Recycling week — break down boxes", confirmed: false },
  { id: "s4", title: "Groceries — milk & lunch snacks low", who: "ria", criticality: "routine", pact: false, escalation: null, detail: "Projected out Thursday", confirmed: false },
];

const WEEK = [
  { d: "Mon", today: false, ria: ["Clinic 9–3"], wes: ["NSCS brief 10:00"], family: [{ t: "Dance 4:30 · Wes drives", s: "set" }] },
  { d: "Tue", today: false, ria: ["Clinic 9–5"], wes: [], family: [{ t: "Library books due", s: "set" }] },
  { d: "Wed", today: true, ria: ["Clinic 9–3"], wes: ["Rutgers 7pm"], family: [{ t: "Pickup swap → Ria 3:15", s: "resolved" }] },
  { d: "Thu", today: false, ria: [], wes: ["Client call 2:00"], family: [{ t: "Grocery run", s: "set" }] },
  { d: "Fri", today: false, ria: ["Half day"], wes: [], family: [{ t: "Date night 7:00 · sitter Emma", s: "proposed" }] },
  { d: "Sat", today: false, ria: [], wes: [], family: [{ t: "Romy playdate — Ava 10:00", s: "set" }] },
  { d: "Sun", today: false, ria: [], wes: [], family: [{ t: "Weekly plan review 8:30", s: "set" }] },
];

const REVIEW = {
  bars: [
    { label: "Ria — monitoring", base: 56, now: 24, color: T.ria },
    { label: "Ria — planning", base: 56, now: 31, color: T.ria },
    { label: "Wisp — execution", base: 0, now: 0, color: T.family, lockedZero: true },
  ],
  wins: ["Zero missed T1 items", "3 restocks caught before empty", "0 nag messages sent"],
  trail: ["Ria voice note 8:02", "→ observation: snacks low", "→ signal: restock (routine)", "→ Wes confirmed 6:40pm"],
};

// ---------------------------------------------------------------- atoms
const Panel = ({ children, style }) => (
  <div style={{ background: T.panel, border: `1px solid ${T.line}`, borderRadius: 16, padding: 16, ...style }}>{children}</div>
);

const Tag = ({ children, color, dashed }) => (
  <span style={{ fontSize: 11, letterSpacing: 0.4, padding: "3px 8px", borderRadius: 999, color, border: `1px ${dashed ? "dashed" : "solid"} ${color}`, whiteSpace: "nowrap" }}>{children}</span>
);

function Orb({ size = 76, onClick, label = "hold to capture" }) {
  return (
    <button onClick={onClick} aria-label="Wisp capture" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer" }}>
      <div className="wisp-orb" style={{ width: size, height: size, borderRadius: "50%", background: T.orb, boxShadow: "0 0 34px rgba(123,91,255,0.55)" }} />
      <span style={{ color: T.dim, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase" }}>{label}</span>
    </button>
  );
}

// ---------------------------------------------------------------- Today
function SignalRow({ s, onConfirm }) {
  const laneColor = s.who === "ria" ? T.ria : s.who === "wes" ? T.wes : T.family;
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${T.line}` }}>
      <div style={{ width: 4, alignSelf: "stretch", borderRadius: 2, background: laneColor, opacity: 0.9 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ color: T.text, fontWeight: 600, textDecoration: s.confirmed ? "line-through" : "none", opacity: s.confirmed ? 0.5 : 1 }}>{s.title}</span>
          {s.criticality === "critical" && !s.confirmed && <Tag color={T.crit}>critical</Tag>}
          {s.pact && <Tag color={T.warn}>pact</Tag>}
        </div>
        <div style={{ color: T.dim, fontSize: 13, marginTop: 2 }}>{s.detail}</div>
        {s.escalation && !s.confirmed && (
          <div style={{ color: T.crit, fontSize: 12, marginTop: 4 }}>⇪ escalates: {s.escalation}</div>
        )}
        {s.confirmed && (
          <div style={{ color: T.good, fontSize: 12, marginTop: 4 }}>✓ confirmed{s.escalation ? " · escalation cancelled" : ""}</div>
        )}
      </div>
      {!s.confirmed && (
        <button onClick={() => onConfirm(s.id)} style={{ background: "transparent", color: T.good, border: `1px solid ${T.good}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer", flexShrink: 0 }}>
          Done
        </button>
      )}
    </div>
  );
}

function TodayView({ signals, onConfirm, compact }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1.4fr 1fr", gap: 16 }}>
      <Panel>
        <div style={{ color: T.dim, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Signals — one tap is the only execution event</div>
        {signals.map((s) => <SignalRow key={s.id} s={s} onConfirm={onConfirm} />)}
        <div style={{ color: T.dim, fontSize: 12, marginTop: 10 }}>Routine items surface once, then roll into the weekly pattern. No nag loops.</div>
      </Panel>
      <Panel>
        <div style={{ color: T.dim, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Morning briefing · 6:00</div>
        <p style={{ color: T.text, lineHeight: 1.55, fontSize: 15, margin: 0 }}>
          Light day. Romy needs sneakers for gym (Wed special). Two critical
          items tonight — dance bag and Whidbey's meds; both cancel the moment
          someone taps Done. Milk runs out Thursday; it's on the grocery signal.
          Friday date night is <em>proposed</em>, waiting on approval in the Week view.
        </p>
        <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: T.panel2, color: T.dim, fontSize: 13 }}>
          Photos are optional state reports — never required, never a gate.
        </div>
      </Panel>
    </div>
  );
}

// ---------------------------------------------------------------- Week
function Chip({ e, onApprove }) {
  const proposed = e.s === "proposed";
  const resolved = e.s === "resolved";
  return (
    <div style={{ border: `1px ${proposed ? "dashed" : "solid"} ${proposed ? T.family : T.line}`, background: proposed ? "transparent" : T.panel2, borderRadius: 10, padding: "6px 10px", fontSize: 13, color: T.text, display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ opacity: resolved ? 0.85 : 1 }}>{resolved ? "✓ " : ""}{e.t}</span>
      {proposed && (
        <button onClick={onApprove} style={{ background: T.family, color: T.ink, border: "none", borderRadius: 8, padding: "3px 10px", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
          Approve
        </button>
      )}
    </div>
  );
}

function WeekView({ week, onApprove }) {
  const lanes = [
    { key: "ria", label: "Ria — work (read-only mirror)", color: T.ria },
    { key: "wes", label: "Wes — work (read-only mirror)", color: T.wes },
    { key: "family", label: "Family — Wisp's lane", color: T.family },
  ];
  return (
    <Panel style={{ overflowX: "auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "64px repeat(3, minmax(180px, 1fr))", gap: 10, minWidth: 700 }}>
        <div />
        {lanes.map((l) => (
          <div key={l.key} style={{ color: l.color, fontSize: 12, letterSpacing: 0.8, textTransform: "uppercase", paddingBottom: 4, borderBottom: `2px solid ${l.color}` }}>{l.label}</div>
        ))}
        {week.map((day) => (
          <FragmentRow key={day.d} day={day} lanes={lanes} onApprove={onApprove} />
        ))}
      </div>
      <div style={{ color: T.dim, fontSize: 12, marginTop: 12 }}>Dashed = Wisp proposal awaiting a human. Work lanes are mirrors; Wisp writes only to Family.</div>
    </Panel>
  );
}

function FragmentRow({ day, lanes, onApprove }) {
  return (
    <>
      <div style={{ color: day.today ? T.text : T.dim, fontWeight: day.today ? 800 : 500, paddingTop: 6 }}>
        {day.d}{day.today && <div style={{ fontSize: 10, color: T.good }}>today</div>}
      </div>
      {lanes.map((l) => (
        <div key={l.key} style={{ display: "flex", flexDirection: "column", gap: 6, padding: "6px 0", background: day.today ? "rgba(255,255,255,0.02)" : "transparent", borderRadius: 8 }}>
          {(l.key === "family" ? day.family : day[l.key].map((t) => ({ t, s: "set" }))).map((e, i) =>
            l.key === "family"
              ? <Chip key={i} e={e} onApprove={() => onApprove(day.d)} />
              : <div key={i} style={{ fontSize: 13, color: T.dim, border: `1px solid ${T.line}`, borderRadius: 10, padding: "6px 10px" }}>{e.t}</div>
          )}
        </div>
      ))}
    </>
  );
}

function CompactWeek({ week, onApprove }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {week.map((day) => (
        <Panel key={day.d} style={{ padding: 12, borderColor: day.today ? T.good : T.line }}>
          <div style={{ color: day.today ? T.good : T.text, fontWeight: 700, marginBottom: 8 }}>{day.d}{day.today ? " · today" : ""}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {day.ria.map((t, i) => <div key={"r" + i} style={{ fontSize: 13, color: T.ria }}>{t}</div>)}
            {day.wes.map((t, i) => <div key={"w" + i} style={{ fontSize: 13, color: T.wes }}>{t}</div>)}
            {day.family.map((e, i) => <Chip key={"f" + i} e={e} onApprove={() => onApprove(day.d)} />)}
          </div>
        </Panel>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- Review
function ReviewView({ compact }) {
  const [grow, setGrow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setGrow(true), 80); return () => clearTimeout(t); }, []);
  return (
    <div style={{ display: "grid", gridTemplateColumns: compact ? "1fr" : "1.3fr 1fr", gap: 16 }}>
      <Panel>
        <div style={{ color: T.dim, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 12 }}>Load share vs audit baseline</div>
        {REVIEW.bars.map((b) => (
          <div key={b.label} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: T.text, fontSize: 14 }}>
              <span>{b.label}</span>
              <span style={{ color: b.lockedZero ? T.good : T.dim }}>{b.base}% → {b.now}%{b.lockedZero ? " · locked" : ""}</span>
            </div>
            <div style={{ height: 10, borderRadius: 6, background: T.panel2, marginTop: 6, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: `${b.base}%`, top: 0, bottom: 0, width: 2, background: T.dim }} />
              <div style={{ height: "100%", width: grow ? `${Math.max(b.now, 1.5)}%` : "0%", background: b.color, borderRadius: 6, transition: "width 900ms ease" }} />
            </div>
          </div>
        ))}
        <div style={{ color: T.dim, fontSize: 12 }}>Wisp's execution bar can never move. That's the contract, enforced in Postgres.</div>
      </Panel>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Panel>
          <div style={{ color: T.dim, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Quiet wins</div>
          {REVIEW.wins.map((w) => <div key={w} style={{ color: T.text, fontSize: 14, padding: "4px 0" }}>· {w}</div>)}
        </Panel>
        <Panel>
          <div style={{ color: T.dim, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", marginBottom: 8 }}>Capture trail</div>
          {REVIEW.trail.map((t, i) => <div key={i} style={{ color: i === 0 ? T.text : T.dim, fontSize: 13, padding: "3px 0" }}>{t}</div>)}
        </Panel>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Intercom
function IntercomSheet({ open, onClose }) {
  const [phase, setPhase] = useState("idle"); // idle → recording → transcribing → sent
  useEffect(() => { if (!open) setPhase("idle"); }, [open]);
  const start = () => phase === "idle" && setPhase("recording");
  const stop = () => {
    if (phase !== "recording") return;
    setPhase("transcribing");
    setTimeout(() => setPhase("sent"), 1200);
  };
  if (!open) return null;
  const copy = {
    idle: "Hold the orb, speak, release.",
    recording: "Listening…",
    transcribing: "Transcribing…",
    sent: "“Dinner in ten, wash up.” — announced in 5 rooms · SMS'd to Wes & Ria",
  }[phase];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(5,8,18,0.72)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(560px, 100%)", background: T.panel, borderRadius: "20px 20px 0 0", border: `1px solid ${T.line}`, padding: 24, textAlign: "center" }}>
        <div style={{ color: T.dim, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase" }}>Intercom — push to talk</div>
        <div style={{ display: "flex", justifyContent: "center", margin: "18px 0" }}>
          <button
            onMouseDown={start} onMouseUp={stop} onTouchStart={start} onTouchEnd={stop}
            style={{ width: 96, height: 96, borderRadius: "50%", border: "none", cursor: "pointer", background: T.orb, boxShadow: phase === "recording" ? "0 0 44px rgba(255,94,200,0.8)" : "0 0 26px rgba(123,91,255,0.5)", transform: phase === "recording" ? "scale(1.08)" : "scale(1)", transition: "all 160ms" }}
            aria-label="push to talk"
          />
        </div>
        <div style={{ color: phase === "sent" ? T.good : T.text, fontSize: 14, minHeight: 40 }}>{copy}</div>
        <div style={{ color: T.dim, fontSize: 12, marginTop: 8 }}>Audio is deleted after transcription. Quiet hours 20:30–08:00 queue announcements.</div>
        <button onClick={onClose} style={{ marginTop: 14, background: "transparent", color: T.dim, border: `1px solid ${T.line}`, borderRadius: 10, padding: "8px 18px", cursor: "pointer" }}>Close</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- shell
export default function WispDashboard() {
  const width = useWindowWidth();
  const compact = width < 1000;
  const [view, setView] = useState("today");
  const [signals, setSignals] = useState(MOCK_SIGNALS);
  const [week, setWeek] = useState(WEEK);
  const [intercom, setIntercom] = useState(false);
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(t); }, []);

  const confirm = (id) => setSignals((xs) => xs.map((s) => (s.id === id ? { ...s, confirmed: true } : s)));
  const approve = (d) => setWeek((w) => w.map((day) => day.d === d ? { ...day, family: day.family.map((e) => e.s === "proposed" ? { ...e, s: "set", t: e.t + " · approved" } : e) } : day));
  const openCount = useMemo(() => signals.filter((s) => !s.confirmed).length, [signals]);

  const tabs = [["today", "Today"], ["week", "Week"], ["review", "Review"]];

  return (
    <div style={{ minHeight: "100vh", background: T.ink, fontFamily: "'Avenir Next','Segoe UI',system-ui,sans-serif", padding: compact ? 14 : 28 }}>
      <style>{`
        @keyframes wispPulse { 0%,100%{ box-shadow:0 0 26px rgba(123,91,255,.45);} 50%{ box-shadow:0 0 46px rgba(55,216,230,.65);} }
        .wisp-orb { animation: wispPulse 3.6s ease-in-out infinite; }
        button:focus-visible { outline: 2px solid ${T.family}; outline-offset: 2px; }
      `}</style>

      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <div>
          <div style={{ color: T.text, fontSize: compact ? 22 : 30, fontWeight: 800, letterSpacing: 2 }}>WISP</div>
          <div style={{ color: T.dim, fontSize: 13 }}>
            {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })} · {now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {openCount} open
          </div>
        </div>
        <nav style={{ display: "flex", gap: 8 }}>
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setView(k)} style={{ background: view === k ? T.panel2 : "transparent", color: view === k ? T.text : T.dim, border: `1px solid ${view === k ? T.family : T.line}`, borderRadius: 999, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>{label}</button>
          ))}
          <button onClick={() => setIntercom(true)} style={{ background: "transparent", color: T.wes, border: `1px solid ${T.wes}`, borderRadius: 999, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>Intercom</button>
        </nav>
        {!compact && <Orb onClick={() => setIntercom(true)} />}
      </header>

      {view === "today" && <TodayView signals={signals} onConfirm={confirm} compact={compact} />}
      {view === "week" && (compact ? <CompactWeek week={week} onApprove={approve} /> : <WeekView week={week} onApprove={approve} />)}
      {view === "review" && <ReviewView compact={compact} />}

      {compact && (
        <div style={{ position: "fixed", right: 18, bottom: 18 }}>
          <Orb size={62} onClick={() => setIntercom(true)} label="capture" />
        </div>
      )}

      <footer style={{ color: T.dim, fontSize: 11, letterSpacing: 0.6, marginTop: 26, textAlign: "center" }}>
        AI plans · AI monitors · humans execute — Wisp's execution share is locked at 0%
      </footer>

      <IntercomSheet open={intercom} onClose={() => setIntercom(false)} />
    </div>
  );
}
