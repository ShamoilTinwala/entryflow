import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";

function Supervisor() {
  const { user, event, events, hosts, guests, entries, audit, manualCheckIn, checkOut, reverseEntry } = useApp();
  const [adminEventId, setAdminEventId] = useState(String(events.find((item) => item.status === "Live")?.id ?? events[0]?.id ?? ""));
  const assignedEvent = user?.role === ROLES.GLOBAL_ADMIN ? events.find((item) => item.id === Number(adminEventId)) : event;
  const [checkForm, setCheckForm] = useState({ code: "", count: 1, gate: "Main Gate", name: "" });
  const [checkoutForm, setCheckoutForm] = useState({ code: "", sourceEntryId: "", count: 1, gate: "Main Gate" });
  const [reasonFor, setReasonFor] = useState(null);
  const [reason, setReason] = useState("");
  const assignedPasses = guests.filter((pass) => pass.eventId === assignedEvent?.id);
  const assignedEntries = [...entries].filter((entry) => entry.eventId === assignedEvent?.id).reverse();
  const assignedAudit = [...audit].filter((activity) => activity.eventId === assignedEvent?.id).reverse();
  const activeInside = useMemo(() => {
    const passInside = assignedPasses.reduce((sum, pass) => sum + Number(pass.insideCount || 0), 0);
    const unlistedInside = assignedEntries.filter((entry) => entry.action === "manual-check-in" && !entry.reversedAt).reduce((sum, entry) => {
      const checkedOut = assignedEntries.filter((item) => item.action === "check-out" && item.sourceEntryId === entry.id && !item.reversedAt).reduce((count, item) => count + Number(item.count || 0), 0);
      return sum + Math.max(Number(entry.count || 0) - checkedOut, 0);
    }, 0);
    return passInside + unlistedInside;
  }, [assignedPasses, assignedEntries]);
  const admitted = useMemo(() => assignedEntries.filter((entry) => entry.action.includes("check-in") && !entry.reversedAt).reduce((sum, entry) => sum + Number(entry.count || 1), 0), [assignedEntries]);
  const gates = [...new Set(assignedEntries.map((entry) => entry.gate).filter(Boolean))];
  const unlistedInsideEntries = assignedEntries.filter((entry) => entry.action === "manual-check-in" && !entry.reversedAt).map((entry) => {
    const checkedOut = assignedEntries.filter((item) => item.action === "check-out" && item.sourceEntryId === entry.id && !item.reversedAt).reduce((sum, item) => sum + Number(item.count || 0), 0);
    return { ...entry, remainingInside: Math.max(Number(entry.count || 0) - checkedOut, 0) };
  }).filter((entry) => entry.remainingInside > 0);

  if (!assignedEvent) return <p className="rounded-2xl bg-white p-6">No event is assigned to this account.</p>;
  const submitCheckIn = (e) => {
    e.preventDefault();
    const result = manualCheckIn({ eventId: assignedEvent.id, ...checkForm });
    if (result.ok) setCheckForm({ code: "", count: 1, gate: checkForm.gate, name: "" });
  };
  const submitCheckOut = (e) => {
    e.preventDefault();
    const pass = assignedPasses.find((item) => item.code.toUpperCase() === checkoutForm.code.trim().toUpperCase());
    const result = pass
      ? checkOut({ passId: pass.id, count: Number(checkoutForm.count), gate: checkoutForm.gate })
      : checkoutForm.sourceEntryId
        ? checkOut({ sourceEntryId: Number(checkoutForm.sourceEntryId), count: Number(checkoutForm.count), gate: checkoutForm.gate })
        : { ok: false, message: "Enter a pass code or select an unlisted entry" };
    if (result.ok) setCheckoutForm({ ...checkoutForm, code: "", sourceEntryId: "", count: 1 });
  };
  const submitReverse = (entryId) => { reverseEntry(entryId, reason); setReasonFor(null); setReason(""); };

  return <div className="space-y-6">
    <section className="rounded-2xl bg-white p-6 shadow"><p className="text-sm text-gray-500">{user?.role} · gate overview</p><h2 className="mt-1 text-2xl font-bold">{assignedEvent.name}</h2><p className="mt-1 text-gray-500">{assignedEvent.venue} · {assignedEvent.date} · {assignedEvent.status}</p>{user?.role === ROLES.GLOBAL_ADMIN && <label className="mt-4 block text-sm font-medium">Event<select className="mt-2 w-full rounded-xl border bg-white px-4 py-3" value={adminEventId} onChange={(e) => setAdminEventId(e.target.value)}>{events.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}</section>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{[{ label: "Guests admitted", value: admitted }, { label: "Currently inside", value: activeInside }, { label: "Hosts", value: hosts.filter((host) => host.eventId === assignedEvent.id && host.active !== false).length }, { label: "Gates active", value: gates.length }].map((item) => <div key={item.label} className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-gray-500">{item.label}</p><p className="mt-1 text-3xl font-bold">{item.value}</p></div>)}</div>

    <div className="grid gap-6 xl:grid-cols-2">
      <form onSubmit={submitCheckIn} className="space-y-4 rounded-2xl bg-white p-6 shadow"><div><h3 className="text-lg font-semibold">Manual check-in</h3><p className="text-sm text-gray-500">Enter a pass code, or leave it blank to record an unlisted guest. A name is optional.</p></div><label className="block text-sm font-medium">Pass code (optional)<input className="mt-2 w-full rounded-xl border px-4 py-3 font-mono" value={checkForm.code} onChange={(e) => setCheckForm({ ...checkForm, code: e.target.value })} /></label><div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium">People to admit<input required type="number" min="1" step="1" className="mt-2 w-full rounded-xl border px-3 py-3" value={checkForm.count} onChange={(e) => setCheckForm({ ...checkForm, count: e.target.value })} /></label><label className="text-sm font-medium">Gate<select className="mt-2 w-full rounded-xl border bg-white px-3 py-3" value={checkForm.gate} onChange={(e) => setCheckForm({ ...checkForm, gate: e.target.value })}><option>Main Gate</option><option>VIP Gate</option><option>Side Gate</option></select></label><label className="text-sm font-medium">Name (optional)<input className="mt-2 w-full rounded-xl border px-3 py-3" value={checkForm.name} onChange={(e) => setCheckForm({ ...checkForm, name: e.target.value })} /></label></div><button className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white">Record check-in</button></form>
      <form onSubmit={submitCheckOut} className="space-y-4 rounded-2xl bg-white p-6 shadow"><div><h3 className="text-lg font-semibold">Check-out</h3><p className="text-sm text-gray-500">Checking out does not restore used guest quota.</p></div><label className="block text-sm font-medium">Pass code (for a pass entry)<input className="mt-2 w-full rounded-xl border px-4 py-3 font-mono" value={checkoutForm.code} onChange={(e) => setCheckoutForm({ ...checkoutForm, code: e.target.value, sourceEntryId: "" })} /></label><label className="block text-sm font-medium">Or select an unlisted manual entry<select className="mt-2 w-full rounded-xl border bg-white px-4 py-3" value={checkoutForm.sourceEntryId} onChange={(e) => setCheckoutForm({ ...checkoutForm, sourceEntryId: e.target.value, code: "" })}><option value="">Select if applicable</option>{unlistedInsideEntries.map((entry) => <option key={entry.id} value={entry.id}>{entry.primaryName} · {entry.remainingInside} inside · {new Date(entry.scannedAt).toLocaleString()}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium">People leaving<input required type="number" min="1" step="1" className="mt-2 w-full rounded-xl border px-3 py-3" value={checkoutForm.count} onChange={(e) => setCheckoutForm({ ...checkoutForm, count: e.target.value })} /></label><label className="text-sm font-medium">Gate<select className="mt-2 w-full rounded-xl border bg-white px-3 py-3" value={checkoutForm.gate} onChange={(e) => setCheckoutForm({ ...checkoutForm, gate: e.target.value })}><option>Main Gate</option><option>VIP Gate</option><option>Side Gate</option></select></label></div><button className="rounded-xl border px-5 py-3 font-semibold">Record check-out</button></form>
    </div>

    <section className="rounded-2xl bg-white p-6 shadow"><h3 className="mb-4 text-lg font-semibold">Event passes</h3>{assignedPasses.length === 0 ? <p className="text-gray-500">No passes created.</p> : <div className="space-y-3">{assignedPasses.map((pass) => <div key={pass.id} className="flex flex-wrap justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{pass.primaryName} <span className="font-normal text-gray-500">· {pass.code}</span></p><p className="mt-1 text-sm text-gray-500">{pass.totalCount} total · {pass.enteredCount} admitted · {pass.insideCount} inside · {pass.totalCount - pass.enteredCount} remaining</p></div><p className="text-sm text-gray-500">Host: {hosts.find((host) => host.id === pass.hostId)?.name ?? "Removed account"}</p></div>)}</div>}</section>

    <section className="rounded-2xl bg-white p-6 shadow"><h3 className="mb-4 text-lg font-semibold">Entry activity · {assignedEntries.length}</h3>{assignedEntries.length === 0 ? <p className="text-gray-500">No gate activity yet.</p> : <div className="space-y-3">{assignedEntries.map((entry) => <div key={entry.id} className="flex flex-wrap items-start justify-between gap-3 border-b pb-3 text-sm"><div><p>{entry.primaryName || "Unlisted guest"} · {entry.action} · {entry.count} · {entry.gate}{entry.reversedAt ? " · reversed" : ""}</p><p className="mt-1 text-xs text-gray-500">{entry.actorName} · {new Date(entry.scannedAt).toLocaleString()}</p></div>{(entry.action.includes("check-in") || entry.action === "check-out") && !entry.reversedAt && <div>{reasonFor === entry.id ? <form onSubmit={(e) => { e.preventDefault(); submitReverse(entry.id); }} className="flex flex-wrap gap-2"><input className="rounded-lg border px-3 py-2" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} /><button className="rounded-lg bg-amber-600 px-3 py-2 text-white">Confirm undo</button><button type="button" onClick={() => setReasonFor(null)} className="rounded-lg border px-3 py-2">Cancel</button></form> : <button onClick={() => setReasonFor(entry.id)} className="rounded-lg border border-amber-200 px-3 py-2 text-amber-800">Reverse</button>}</div>}</div>)}</div>}</section>

    <section className="rounded-2xl bg-white p-6 shadow"><h3 className="mb-4 text-lg font-semibold">Event activity log</h3>{assignedAudit.length === 0 ? <p className="text-gray-500">No activity recorded.</p> : <div className="space-y-2">{assignedAudit.slice(0, 30).map((activity) => <div key={activity.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 text-sm"><span>{activity.action} · {activity.target} · {activity.actorName} ({activity.actorRole})</span><span className="text-gray-500">{new Date(activity.createdAt).toLocaleString()}</span></div>)}</div>}</section>
  </div>;
}
export default Supervisor;
