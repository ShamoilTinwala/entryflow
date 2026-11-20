import { useState } from "react";
import PassCamera from "../components/PassCamera";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";

const field = "mt-1 min-h-11 w-full min-w-0 rounded-lg border bg-secondary px-3 text-base";
const stepButton = "min-h-12 min-w-12 rounded-lg border border-primary/40 bg-card text-2xl font-medium text-primary disabled:opacity-35";

function Scanner() {
  const { user, event, events, guests, scanPass, undoLastScan } = useApp();
  const [adminEventId, setAdminEventId] = useState("");
  const [code, setCode] = useState("");
  const [count, setCount] = useState(1);
  const [gate, setGate] = useState("Main Gate");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const liveEvents = events.filter(item => item.status === "Live");
  const admin = user?.role === ROLES.GLOBAL_ADMIN;
  const selectedEvent = admin
    ? liveEvents.find(item => String(item.id) === adminEventId) ?? (liveEvents.length === 1 ? liveEvents[0] : null)
    : event;
  const canScan = selectedEvent?.status === "Live";
  const eventId = selectedEvent?.id;
  const selectedPass = guests.find(pass => pass.eventId === eventId && !pass.deletedAt && pass.code.toUpperCase() === code.trim().toUpperCase());
  const remaining = selectedPass ? Math.max(selectedPass.totalCount - selectedPass.enteredCount, 0) : 0;
  const quantity = count === "" ? 0 : Math.min(count, remaining);

  function selectCode(value) {
    setCode(value);
    setCount(1);
    setResult(null);
  }

  async function admit(e) {
    e.preventDefault();
    if (!canScan || !selectedPass || !quantity || busy) return;
    setBusy(true);
    try {
      const scan = await scanPass({ eventId, code: selectedPass.code, count: quantity, gate });
      if (scan.ok) {
        if (scan.remaining === 0) setCode("");
        setCount(1);
        setResult({ ok: true, message: `${scan.pass.primaryName} · ${quantity} admitted, ${scan.remaining} remaining.` });
      } else setResult(scan);
    } finally {
      setBusy(false);
    }
  }

  async function undo() {
    if (busy || !eventId) return;
    setBusy(true);
    try {
      const ok = await undoLastScan(eventId);
      setResult({ ok, message: ok ? "Your last scan was undone." : "There is no eligible scan to undo." });
    } finally {
      setBusy(false);
    }
  }

  return <section className="mx-auto max-w-xl space-y-4 rounded-2xl bg-card p-4 shadow-sm sm:p-6">
    <div className="grid grid-cols-2 items-end gap-3">
      {admin ? <label className="min-w-0 text-sm font-medium">Live event
        <select value={eventId ?? ""} disabled={busy} className={field} onChange={e => { setAdminEventId(e.target.value); selectCode(""); }}>
          <option value="">Select event</option>
          {liveEvents.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label> : <h2 className="self-center break-words text-lg font-semibold">{selectedEvent?.name}</h2>}
      <label className="min-w-0 text-sm font-medium">Gate
        <select value={gate} disabled={busy} className={field} onChange={e => setGate(e.target.value)}>
          <option>Main Gate</option><option>VIP Gate</option><option>Side Gate</option>
        </select>
      </label>
    </div>
    {!canScan && <p className="text-sm text-warning">{liveEvents.length && admin ? "Select a live event to start scanning." : "Scanning opens when the event is live."}</p>}
    <PassCamera key={eventId ?? ""} onCode={selectCode} disabled={!canScan || busy} />
    <form onSubmit={admit} className="space-y-3">
      <label className="block text-sm font-medium">Pass code
        <input className={field + " font-mono uppercase"} value={code} onChange={e => selectCode(e.target.value)}
          disabled={!canScan || busy} placeholder="Scan QR or enter code" autoComplete="off" spellCheck={false} />
      </label>
      {code.trim() && !selectedPass && <p role="status" className="text-sm text-warning">No matching pass for this event.</p>}
      {selectedPass && <div className="space-y-3 rounded-xl bg-accent p-3 sm:p-4">
        <div><h3 className="break-words text-lg font-semibold">{selectedPass.primaryName}</h3>
          <p className="text-sm text-muted-foreground">{remaining} remaining · {selectedPass.insideCount} inside</p>
        </div>
        {remaining > 0 ? <>
          <div className="flex items-center justify-between gap-2">
            <span id="guest-count-label" className="font-medium">Guest count</span>
            <button type="button" disabled={busy || quantity === remaining} onClick={() => setCount(remaining)}
              className="min-h-11 px-2 text-sm font-semibold text-primary disabled:text-muted-foreground">All remaining ({remaining})</button>
          </div>
          <div role="group" aria-labelledby="guest-count-label" className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <button type="button" aria-label="Decrease guest count" disabled={busy || quantity <= 1} onClick={() => setCount(quantity - 1)} className={stepButton}>−</button>
            <input aria-label="Guest count" type="number" inputMode="numeric" min="1" max={remaining} step="1"
              disabled={busy} value={count === "" ? "" : quantity}
              onChange={e => setCount(e.target.value === "" ? "" : Math.max(1, Math.min(remaining, Math.trunc(Number(e.target.value)))))}
              onBlur={() => { if (count === "") setCount(1); }}
              className="min-h-12 w-20 rounded-lg border bg-card text-center text-xl font-semibold tabular-nums" />
            <button type="button" aria-label="Increase guest count" disabled={busy || quantity >= remaining} onClick={() => setCount(quantity + 1)} className={stepButton}>+</button>
          </div>
          <button disabled={busy || !canScan || !quantity} className="min-h-12 w-full rounded-xl bg-primary px-3 font-semibold text-primary-foreground disabled:opacity-50">
            Admit {quantity} {quantity === 1 ? "guest" : "guests"}
          </button>
        </> : <p className="font-medium text-foreground">Everyone on this pass has checked in.</p>}
      </div>}
    </form>
    {result && <p role="status" className={`rounded-lg p-3 text-sm ${result.ok ? "bg-positive-surface text-positive" : "bg-danger-surface text-destructive"}`}>{result.message}</p>}
    <button type="button" onClick={undo} disabled={!eventId || busy} className="min-h-11 text-sm font-medium text-muted-foreground underline underline-offset-4 disabled:opacity-50">Undo my last scan</button>
  </section>;
}

export default Scanner;
