import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";
import AccountInvites from "../components/AccountInvites";
import { downloadQr, eventInvitation, publicUrl, sharePass, shareWhatsApp } from "../lib/sharing";
import { toast } from "sonner";

function HostPasses({ hostId: selectedHostId }) {
  const { user, event, events, hosts, guests, entries, createGuest, updateGuest, deleteGuest } = useApp();
  const hostId = Number(selectedHostId ?? user?.id);
  const host = hosts.find((item) => item.id === hostId);
  const assignedEvent = host ? events.find((item) => item.id === host.eventId) : event;
  const passes = guests.filter((pass) => pass.hostId === hostId && pass.eventId === assignedEvent?.id && !pass.deletedAt);
  const [form, setForm] = useState({ primaryName: "", count: 1 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ primaryName: "", totalCount: 1 });
  const used = useMemo(() => passes.reduce((sum, pass) => sum + Number(pass.totalCount || 1), 0), [passes]);
  const remaining = Math.max(Number(host?.capacity ?? 0) - used, 0);
  const canManage = [ROLES.GLOBAL_ADMIN, ROLES.SUPERHOST, ROLES.HOST].includes(user?.role);
  const canInviteScanner = [ROLES.HOST, ROLES.SUPERHOST, ROLES.GLOBAL_ADMIN].includes(user?.role);

  if (!host || !assignedEvent) return <p className="rounded-2xl bg-white p-6 text-gray-600">Host account not found or inactive.</p>;

  const createPass = (e) => {
    e.preventDefault();
    const pass = createGuest({ eventId: assignedEvent.id, hostId: host.id, name: form.primaryName, count: form.count });
    if (pass) setForm({ primaryName: "", count: 1 });
  };
  const savePass = (e, passId) => {
    e.preventDefault();
    if (updateGuest(passId, { primaryName: editForm.primaryName.trim(), totalCount: Number(editForm.totalCount) })) setEditingId(null);
  };
  const beginEdit = (pass) => { setEditingId(pass.id); setEditForm({ primaryName: pass.primaryName, totalCount: pass.totalCount }); };
  const isLocked = (pass) => Boolean(pass.lockedAt || pass.enteredCount > 0);
  const passEntries = (pass) => entries.filter((entry) => entry.passId === pass.id && !entry.reversedAt);

  return <div className="space-y-6">
    <section className="rounded-2xl bg-white p-6 shadow"><p className="text-sm text-gray-500">{assignedEvent.name}</p><h2 className="mt-1 text-2xl font-bold">{host.name}</h2><p className="mt-1 text-gray-500">{host.email}</p><div className="mt-5 grid grid-cols-3 gap-3"><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Allocation</p><p className="text-2xl font-bold">{host.capacity}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm text-gray-500">Reserved</p><p className="text-2xl font-bold">{used}</p></div><div className="rounded-xl bg-blue-50 p-4"><p className="text-sm text-blue-700">Available</p><p className="text-2xl font-bold text-blue-700">{remaining}</p></div></div></section>

    {canManage && <form onSubmit={createPass} className="order-first space-y-4 rounded-2xl bg-blue-50 p-5 shadow sm:p-6"><div><h3 className="text-xl font-semibold">Create a gate pass</h3><p className="text-sm text-gray-600">One QR for the group. Each person uses one allocation spot and can enter separately.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Primary guest<input required minLength={2} className="mt-2 min-h-12 w-full rounded-xl border bg-white px-4 py-3" value={form.primaryName} onChange={(e) => setForm({ ...form, primaryName: e.target.value })} /></label><label className="text-sm font-medium">People on this pass (including primary)<input required type="number" min="1" max={remaining || 1} className="mt-2 min-h-12 w-full rounded-xl border bg-white px-4 py-3" value={form.count} onChange={(e) => setForm({ ...form, count: e.target.value })} /></label></div><p className="text-sm text-gray-600">{remaining} guest spots available.</p><button disabled={remaining === 0} className="min-h-12 w-full rounded-xl bg-blue-600 px-5 py-3 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Create gate pass</button></form>}

    {canInviteScanner && <AccountInvites event={assignedEvent} />}

    <section className="rounded-2xl bg-white p-6 shadow"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold">Guest passes</h3><p className="text-sm text-gray-500">A pass locks after its first check-in.</p></div><span className="rounded-full bg-gray-100 px-3 py-1 text-sm">{passes.length} passes</span></div>{passes.length === 0 ? <p className="text-gray-500">No passes created yet.</p> : <div className="space-y-4">{passes.map((pass) => {
      const locked = isLocked(pass);
      const currentEntries = passEntries(pass);
      const departed = Math.max(Number(pass.enteredCount) - Number(pass.insideCount), 0);
      return <article key={pass.id} className="rounded-xl border p-4"><div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">{editingId === pass.id ? <form onSubmit={(e) => savePass(e, pass.id)} className="grid flex-1 gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Primary guest<input required minLength={2} className="mt-1 min-h-11 w-full rounded-lg border px-3 py-2" value={editForm.primaryName} onChange={(e) => setEditForm({ ...editForm, primaryName: e.target.value })} /></label><label className="text-sm font-medium">Total pass count<input required type="number" min="1" className="mt-1 min-h-11 w-full rounded-lg border px-3 py-2" value={editForm.totalCount} onChange={(e) => setEditForm({ ...editForm, totalCount: e.target.value })} /></label><div className="flex gap-2"><button className="min-h-11 rounded-lg bg-blue-600 px-4 py-2 text-white">Save</button><button type="button" onClick={() => setEditingId(null)} className="min-h-11 rounded-lg border px-4 py-2">Cancel</button></div></form> : <div className="min-w-0 flex-1"><h4 className="font-semibold">{pass.primaryName}</h4><p className="mt-1 break-all font-mono text-sm text-gray-600">{pass.code}</p><p className="mt-2 text-sm text-gray-600">{pass.totalCount} people · {pass.totalCount - pass.enteredCount} remaining · {pass.insideCount} inside · {departed} out</p><p className={`mt-1 text-sm ${locked ? "text-amber-700" : "text-green-700"}`}>{locked ? "Locked after first check-in" : "Unused · editable"}</p></div>}
      {editingId !== pass.id && <div className="self-center rounded-lg border bg-white p-2"><QRCodeSVG id={`pass-qr-${pass.id}`} value={pass.code} size={160} level="M" /><p className="text-center text-xs text-gray-500">Shared pass QR</p></div>}
      {editingId !== pass.id && <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-40 sm:grid-cols-1">{<button onClick={async () => { try { const result = await sharePass({ event: assignedEvent, pass, svgElement: document.getElementById(`pass-qr-${pass.id}`) }); toast.success(result === "copied-with-image" ? "Message, link, and QR copied" : result === "copied" ? "Message and link copied. Save the QR image to attach it." : "Pass shared"); } catch { toast.error("Sharing was cancelled or unavailable"); } }} className="min-h-11 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white">Share pass</button>}<button onClick={() => shareWhatsApp(`${eventInvitation(assignedEvent)}\n\nGuest pass for ${pass.primaryName} · ${pass.totalCount} people`, publicUrl(`/pass/${encodeURIComponent(pass.code)}`))} className="min-h-11 rounded-lg border px-3 py-2 text-sm">WhatsApp</button><button onClick={() => downloadQr(document.getElementById(`pass-qr-${pass.id}`), `entryflow-${pass.code}.png`).then(() => toast.success("QR image saved")).catch(() => toast.error("Could not save QR image"))} className="min-h-11 rounded-lg border px-3 py-2 text-sm">Save QR image</button>{canManage && !locked && <><button onClick={() => beginEdit(pass)} className="min-h-11 rounded-lg border px-3 py-2 text-sm">Edit</button><button onClick={() => { if (window.confirm(`Delete unused pass and return ${pass.totalCount} spots to quota?`)) deleteGuest(pass.id); }} className="min-h-11 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Delete</button></>}</div>}</div>
      {currentEntries.length > 0 && <details className="mt-3"><summary className="cursor-pointer text-sm text-gray-600">Entry history ({currentEntries.length})</summary><div className="mt-2 space-y-2">{currentEntries.map((entry) => <p key={entry.id} className="text-xs text-gray-500">{entry.action} · {entry.count} · {entry.actorName} · {new Date(entry.scannedAt).toLocaleString()}</p>)}</div></details>}
      </article>;
    })}</div>}</section>
  </div>;
}

export default HostPasses;
