import { useState } from "react";
import PassCamera from "../components/PassCamera";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";

function Scanner() {
  const { user, event, events, guests, scanPass, undoLastScan } = useApp();
  const [adminEventId, setAdminEventId] = useState("");
  const [code, setCode] = useState("");
  const [count, setCount] = useState(1);
  const [gate, setGate] = useState("Main Gate");
  const [result, setResult] = useState(null);
  const liveEvents = events.filter(item => item.status === "Live");
  const selectedEvent = user?.role === ROLES.GLOBAL_ADMIN
    ? liveEvents.find(item => String(item.id) === adminEventId) ?? (liveEvents.length === 1 ? liveEvents[0] : null)
    : event;
  const canScan = selectedEvent?.status === "Live";
  const eventId = String(selectedEvent?.id ?? "");
  const eventPasses = guests.filter((pass) => pass.eventId === selectedEvent?.id);
  const selectedPass = eventPasses.find((pass) => pass.code.toUpperCase() === code.trim().toUpperCase());
  const remaining = selectedPass ? Math.max(Number(selectedPass.totalCount) - Number(selectedPass.enteredCount), 0) : 0;

  const onCameraCode = value => {
    const pass = eventPasses.find(item => item.code.toUpperCase() === value.trim().toUpperCase());
    setCode(value.trim());
    setCount(1);
    setResult(pass
      ? { ok: true, message: "Pass found. Choose how many people to admit." }
      : { ok: false, message: "No matching pass for this event. Check the QR or enter the pass code." });
  };

  const admit = async (e) => {
    e.preventDefault();
    const scan = await scanPass({ eventId: selectedEvent?.id, code, count: Number(count), gate });
    setResult(scan.ok ? { ok: true, message: `${scan.pass.primaryName}: admitted ${count}; ${scan.remaining} remaining.` } : scan);
    if (scan.ok) {
      toast.success(`${count} guest${Number(count) === 1 ? "" : "s"} admitted`);
      setCount(1);
    } else toast.error(scan.message);
  };

  const undo = async () => {
    if (selectedEvent && await undoLastScan(selectedEvent.id)) {
      toast.success("Your last scan was undone");
      setResult({ ok: true, message: "Your last scan was undone. The audit history is preserved." });
    } else toast.error("There is no eligible scan to undo");
  };

  return <div className="mx-auto max-w-2xl space-y-6">
    <section className="rounded-2xl bg-white p-6 shadow"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-gray-500">Gate Scanner</p><h2 className="mt-1 text-2xl font-bold">{selectedEvent?.name ?? "Select a live event"}</h2><p className="text-sm text-gray-500">Scan the shared pass QR, then tap in the people arriving.</p></div><button onClick={undo} className="rounded-xl border border-amber-200 px-4 py-2 text-amber-800">Undo my last scan</button></div>
      {user?.role === ROLES.GLOBAL_ADMIN && <label className="mb-4 block text-sm font-medium">Live event<select className="mt-2 w-full rounded-xl border bg-white px-4 py-3" value={eventId} onChange={(e) => { setAdminEventId(e.target.value); setCode(""); setResult(null); setCount(1); }}><option value="">Select event</option>{liveEvents.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
      {!canScan && <p className="mb-4 text-sm text-amber-700">{liveEvents.length ? "Select a live event to start scanning." : "Set the event to Live in its event details to start scanning."}</p>}
      <PassCamera key={eventId} onCode={onCameraCode} disabled={!canScan} />
      <form onSubmit={admit} className="space-y-4"><label className="block text-sm font-medium">Pass code<input required className="mt-2 w-full rounded-xl border px-4 py-3 font-mono uppercase" placeholder="Scan QR or enter code" value={code} onChange={(e) => { setCode(e.target.value); setResult(null); }} /></label>
        {selectedPass && <div className="rounded-xl bg-blue-50 p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{selectedPass.primaryName}</p><p className="font-mono text-sm text-gray-600">{selectedPass.code}</p></div><p className="text-right text-sm text-blue-800">{remaining} remaining<br />{selectedPass.insideCount} inside</p></div>{remaining > 0 && <div className="mt-4 flex flex-wrap items-center gap-2"><label className="text-sm font-medium">Admit<input type="number" min="1" max={remaining} step="1" value={count} onChange={(e) => setCount(e.target.value)} className="ml-2 w-20 rounded-lg border px-2 py-2" /></label><button type="button" onClick={() => setCount(1)} className="rounded-lg border px-3 py-2 text-sm">+1</button><button type="button" onClick={() => setCount(remaining)} className="rounded-lg border px-3 py-2 text-sm">All remaining ({remaining})</button></div>}</div>}
        <label className="block text-sm font-medium">Gate<select value={gate} onChange={(e) => setGate(e.target.value)} className="mt-2 w-full rounded-xl border bg-white px-4 py-3"><option>Main Gate</option><option>VIP Gate</option><option>Side Gate</option></select></label>
        <button disabled={!selectedPass || remaining === 0 || !canScan} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Tap in selected guests</button>
      </form>
    </section>
    {result && <div className={`rounded-2xl p-5 ${result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{result.message}</div>}
  </div>;
}
export default Scanner;
