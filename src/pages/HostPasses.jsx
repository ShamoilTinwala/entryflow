import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";
import AccountInvites from "../components/AccountInvites";
import { copyText, downloadQr, eventInvitation, publicUrl, sharePass, shareWhatsApp } from "../lib/sharing";

const field = "mt-1 block min-h-11 w-full min-w-0 rounded-lg border bg-secondary px-3 text-base";
const button = "min-h-11 rounded-lg border px-3 py-2 text-sm font-medium";
const primary = "min-h-11 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50";

function PassCard({ pass, event, entries, remaining, canManage, updateGuest, deleteGuest }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ primaryName: "", totalCount: 1 });
  const svg = useRef(null);
  const locked = Boolean(pass.lockedAt || pass.enteredCount > 0);
  const link = () => publicUrl(`/pass/${encodeURIComponent(pass.code)}`);
  const description = `${pass.totalCount} ${Number(pass.totalCount) === 1 ? "guest" : "guests"}`;

  async function share() {
    try {
      const result = await sharePass({ event, pass, svgElement: svg.current });
      if (result !== "shared") toast.success(result === "copied-with-image" ? "Pass link and QR copied" : "Pass link and message copied");
    } catch (error) {
      if (error.name !== "AbortError") toast.error("Sharing is unavailable. Try Copy link.");
    }
  }

  async function save(e) {
    e.preventDefault();
    if (await updateGuest(pass.id, { primaryName: draft.primaryName.trim(), totalCount: Number(draft.totalCount) })) setEditing(false);
  }

  return <article id={`guest-pass-${pass.id}`} className="min-w-0 scroll-mt-4 rounded-xl border bg-card p-3 sm:p-4">
    <h4 className="break-words text-lg font-semibold">{pass.primaryName}</h4>
    <p className="text-sm text-muted-foreground">{description} · {pass.totalCount - pass.enteredCount} remaining</p>
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <button type="button" onClick={share} className={primary}>Share pass</button>
      <button type="button" className={button} onClick={() => shareWhatsApp(`${eventInvitation(event)}\n\nGuest pass for ${pass.primaryName} · ${description}`, link())}>WhatsApp</button>
      <button type="button" className={button + " col-span-2 sm:col-span-1"} onClick={() => copyText(link()).then(() => toast.success("Pass link copied")).catch(() => toast.error("Could not copy link"))}>Copy link</button>
    </div>
    <details className="mt-1">
      <summary className="cursor-pointer py-3 text-sm font-medium text-muted-foreground">QR and pass details</summary>
      <div className="space-y-3 border-t pt-3">
        <QRCodeSVG ref={svg} value={pass.code} size={152} marginSize={4} level="M" />
        <p className="break-all font-mono text-xs text-muted-foreground">{pass.code}</p>
        <p className="text-sm text-muted-foreground">{pass.insideCount} inside · {Math.max(pass.enteredCount - pass.insideCount, 0)} checked out</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => downloadQr(svg.current, `entryflow-${pass.code}.png`).then(() => toast.success("QR image saved")).catch(() => toast.error("Could not save QR image"))}>Save QR image</button>
          {canManage && !locked && !editing && <>
            <button type="button" className={button} onClick={() => { setDraft({ primaryName: pass.primaryName, totalCount: pass.totalCount }); setEditing(true); }}>Edit pass</button>
            <button type="button" className={button + " text-destructive"} onClick={() => { if (window.confirm(`Delete this unused pass and return ${pass.totalCount} spots?`)) deleteGuest(pass.id); }}>Delete</button>
          </>}
        </div>
        {locked && <p className="text-sm text-muted-foreground">Pass locked after first check-in.</p>}
        {editing && canManage && !locked && <form onSubmit={save} className="grid gap-3">
          <label className="text-sm font-medium">Guest name<input required minLength={2} className={field} value={draft.primaryName} onChange={e => setDraft({ ...draft, primaryName: e.target.value })} /></label>
          <label className="text-sm font-medium">Group size<input required type="number" min="1" max={Number(pass.totalCount) + remaining} className={field} value={draft.totalCount} onChange={e => setDraft({ ...draft, totalCount: e.target.value })} /></label>
          <div className="flex gap-2"><button className={primary}>Save changes</button><button type="button" className={button} onClick={() => setEditing(false)}>Cancel</button></div>
        </form>}
        {entries.length > 0 && <details><summary className="cursor-pointer py-2 text-sm">Entry history ({entries.length})</summary>
          {entries.map(entry => <p key={entry.id} className="py-1 text-sm text-muted-foreground">{entry.action} · {entry.count} · {entry.actorName} · {new Date(entry.scannedAt).toLocaleString()}</p>)}
        </details>}
      </div>
    </details>
  </article>;
}

function HostPasses({ hostId: selectedHostId }) {
  const { user, event, events, hosts, guests, entries, createGuest, updateGuest, deleteGuest } = useApp();
  const hostId = Number(selectedHostId ?? user?.id);
  const host = hosts.find(item => item.id === hostId);
  const assignedEvent = host ? events.find(item => item.id === host.eventId) : event;
  const passes = guests.filter(pass => pass.hostId === hostId && pass.eventId === assignedEvent?.id && !pass.deletedAt).reverse();
  const [name, setName] = useState("");
  const [count, setCount] = useState(1);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const used = passes.reduce((sum, pass) => sum + Number(pass.totalCount || 1), 0);
  const remaining = Math.max(Number(host?.capacity ?? 0) - used, 0);
  const canManage = [ROLES.GLOBAL_ADMIN, ROLES.SUPERHOST, ROLES.HOST].includes(user?.role);
  const term = search.trim().toLowerCase();
  const visible = passes.filter(pass => !term || [pass.primaryName, pass.code].some(value => value?.toLowerCase().includes(term)));

  useEffect(() => {
    if (createdId != null) document.getElementById(`guest-pass-${createdId}`)?.scrollIntoView({ block: "nearest" });
  }, [createdId]);

  if (!host || !assignedEvent) return <p className="rounded-2xl bg-card p-6 text-muted-foreground">Host account not found or inactive.</p>;

  async function create(e) {
    e.preventDefault();
    if (creating || remaining < 1) return;
    setCreating(true);
    try {
      const pass = await createGuest({ eventId: assignedEvent.id, hostId, name, count: Number(count) });
      if (pass) {
        setName("");
        setCount(1);
        setSearch("");
        setCreatedId(pass.id);
      }
    } finally {
      setCreating(false);
    }
  }

  return <div className="mx-auto max-w-2xl space-y-4">
    <section className="overflow-hidden rounded-3xl bg-card">
      <div className="feature-tile rounded-none bg-clay p-4 sm:p-6"><div className="grooves" aria-hidden="true" />
        <p className="break-words text-sm font-medium">{assignedEvent.name} · {host.name}</p>
        <h2 className="mt-3 text-2xl font-semibold">Create a guest pass</h2>
        <p className="mt-1 text-sm">{remaining} of {host.capacity} guest spots available</p>
      </div>
      {canManage && <form onSubmit={create} className="space-y-3 p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
          <label className="text-sm font-medium">Guest name<input required minLength={2} className={field} value={name} onChange={e => setName(e.target.value)} /></label>
          <label className="text-sm font-medium">Group size<input required type="number" inputMode="numeric" min={1} max={remaining || 1} className={field} value={count} onChange={e => setCount(e.target.value)} /></label>
        </div>
        <button disabled={creating || !remaining} className={primary + " w-full"}>{creating ? "Creating…" : "Create pass"}</button>
      </form>}
    </section>
    <section className="space-y-3 rounded-2xl bg-card p-4 shadow-sm sm:p-6">
      <h3 className="text-xl font-semibold">Guest passes ({passes.length})</h3>
      {passes.length > 0 && <input type="search" aria-label="Search guest passes" placeholder="Search by guest name or pass code" value={search} onChange={e => setSearch(e.target.value)} className={field} />}
      {visible.length === 0 && <p className="text-sm text-muted-foreground">{passes.length ? "No matching passes." : "Your first pass will appear here, ready to share."}</p>}
      {visible.map(pass => <PassCard key={pass.id} pass={pass} event={assignedEvent} remaining={remaining} canManage={canManage}
        entries={entries.filter(entry => entry.passId === pass.id && !entry.reversedAt)} updateGuest={updateGuest} deleteGuest={deleteGuest} />)}
    </section>
    <AccountInvites event={assignedEvent} />
  </div>;
}

export default HostPasses;
