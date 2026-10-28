import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CreateMemberModal from "../components/CreateMemberModal";
import AccountInvites from "../components/AccountInvites";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";
import { copyText, eventInvitation, publicUrl, shareWhatsApp } from "../lib/sharing";
import { toast } from "sonner";

const statuses = ["Draft", "Ready", "Live", "Closed", "Archived"];

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, allEvents, events, hosts, members, guests, entries, updateEvent, archiveEvent, deleteEvent, updateMember, updateHostQuota, removeMember } = useApp();
  const eventId = Number(id ?? user?.eventId);
  const event = allEvents.find((item) => item.id === eventId);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [editingPerson, setEditingPerson] = useState(null);
  const [personDraft, setPersonDraft] = useState({ name: "", email: "" });
  const isAdmin = user?.role === ROLES.GLOBAL_ADMIN;
  const isDeleted = Boolean(event?.deletedAt);
  const isSuperhost = user?.role === ROLES.SUPERHOST && Number(user.eventId) === eventId;
  const eventHosts = hosts.filter((host) => host.eventId === eventId);
  const eventMembers = members.filter((member) => member.eventId === eventId && member.active !== false);
  const eventPasses = guests.filter((pass) => pass.eventId === eventId);
  const eventEntries = entries.filter((entry) => entry.eventId === eventId);

  if (!event) return <p className="rounded-2xl bg-white p-6 text-gray-600">Event not found or no longer active.</p>;

  const startEdit = () => { setDraft({ name: event.name, venue: event.venue, date: event.date, startTime: event.startTime ?? "", endTime: event.endTime ?? "", address: event.address ?? event.venue, mapUrl: event.mapUrl ?? "", description: event.description ?? "", invitationMessage: event.invitationMessage ?? "" }); setEditing(true); };
  const saveEdit = (e) => { e.preventDefault(); if (updateEvent(eventId, draft)) setEditing(false); };
  const statusesForRole = isAdmin ? statuses : statuses.filter((status) => status !== "Archived");
  const eventRoleMembers = [...eventMembers, ...eventHosts.filter((host) => host.active !== false)];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow">
        {editing ? <form onSubmit={saveEdit} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Event name<input required className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="text-sm font-medium">Venue<input required className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.venue} onChange={(e) => setDraft({ ...draft, venue: e.target.value })} /></label>
          <label className="text-sm font-medium">Date<input required type="date" className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} /></label>
          <label className="text-sm font-medium">Start time<input type="time" className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.startTime} onChange={(e) => setDraft({ ...draft, startTime: e.target.value })} /></label>
          <label className="text-sm font-medium">End time<input type="time" className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.endTime} onChange={(e) => setDraft({ ...draft, endTime: e.target.value })} /></label>
          <label className="text-sm font-medium">Full address<input className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} /></label>
          <label className="text-sm font-medium">Map link<input type="url" className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.mapUrl} onChange={(e) => setDraft({ ...draft, mapUrl: e.target.value })} /></label>
          <label className="text-sm font-medium sm:col-span-2">Event information<textarea rows="2" className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
          <label className="text-sm font-medium sm:col-span-2">Default guest invitation message<textarea rows="3" className="mt-2 w-full rounded-xl border px-4 py-3" value={draft.invitationMessage} onChange={(e) => setDraft({ ...draft, invitationMessage: e.target.value })} /></label>
          <div className="flex gap-2 sm:col-span-2"><button className="rounded-xl bg-blue-600 px-5 py-3 text-white">Save event</button><button type="button" onClick={() => setEditing(false)} className="rounded-xl border px-5 py-3">Cancel</button></div>
        </form> : <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h2 className="text-2xl font-bold">{event.name}</h2><p className="mt-1 text-gray-500">{event.venue} · {event.date}{event.startTime ? ` · ${event.startTime}${event.endTime ? `–${event.endTime}` : ""}` : ""}</p><p className="mt-1 text-sm text-gray-600">{event.address}</p>{event.mapUrl && <a className="mt-2 inline-block text-sm text-blue-700 underline" href={event.mapUrl} target="_blank" rel="noreferrer">Open event map</a>}{event.description && <p className="mt-3 max-w-3xl whitespace-pre-wrap text-gray-700">{event.description}</p>}<p className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm">{event.status}</p></div>
          <div className="flex flex-wrap gap-2">{!isDeleted && (isAdmin || isSuperhost) && <><button onClick={startEdit} className="min-h-11 rounded-xl border px-4 py-2">Edit event</button><button onClick={() => { const url = publicUrl(`/event-invitation/${event.id}`); copyText(`${eventInvitation(event)}\n${url}`).then(() => toast.success("Event invitation copied")).catch(() => toast.error("Could not copy invitation")); }} className="min-h-11 rounded-xl border px-4 py-2">Copy guest invitation</button><button onClick={() => shareWhatsApp(eventInvitation(event), publicUrl(`/event-invitation/${event.id}`))} className="min-h-11 rounded-xl border px-4 py-2">WhatsApp</button></>}{!isDeleted && isAdmin && <button onClick={() => { if (window.confirm("Archive this event? Its history will be preserved.")) archiveEvent(eventId); }} className="min-h-11 rounded-xl border px-4 py-2">Archive</button>}{!isDeleted && isAdmin && <button onClick={() => { if (window.confirm("Remove this event from active events? Its records and activity history will be preserved.")) { deleteEvent(eventId); navigate("/events"); } }} className="min-h-11 rounded-xl border border-red-200 px-4 py-2 text-red-700">Delete</button>}</div>
        </div>}
        {isDeleted ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">This event is deleted from active records and shown here for history.</p> : <div className="mt-5 flex flex-wrap gap-2">{statusesForRole.map((status) => <button key={status} onClick={() => updateEvent(eventId, { status })} className={`rounded-xl px-4 py-2 text-sm ${event.status === status ? "bg-blue-600 text-white" : "border hover:bg-gray-50"}`}>Set {status}</button>)}</div>}
      </section>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[{ label: "Hosts", value: eventHosts.filter((host) => host.active !== false).length }, { label: "Team accounts", value: eventMembers.length }, { label: "Guest spots issued", value: eventPasses.reduce((sum, pass) => sum + pass.totalCount, 0) }, { label: "Entries inside", value: eventPasses.reduce((sum, pass) => sum + pass.insideCount, 0) }].map((stat) => <div key={stat.label} className="rounded-2xl bg-white p-5 shadow"><p className="text-sm text-gray-500">{stat.label}</p><p className="mt-1 text-3xl font-bold">{stat.value}</p></div>)}
      </div>

      {!isDeleted && (isAdmin || isSuperhost) && <section className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-lg font-semibold">Event team</h3><p className="text-sm text-gray-500">Create and manage accounts assigned to this event.</p></div><button onClick={() => setShowAccountModal(true)} className="rounded-xl bg-blue-600 px-4 py-2 text-white">+ Create account</button></div>
        {eventRoleMembers.length === 0 ? <p className="text-gray-500">No team accounts assigned.</p> : <div className="space-y-3">{eventRoleMembers.map((person) => {
          const isHost = person.role === ROLES.HOST;
          const isMember = eventMembers.some((member) => member.id === person.id);
          return <div key={`${person.role}-${person.id}`} className="rounded-xl border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="font-medium">{isHost ? <Link className="text-blue-700 hover:underline" to={`/hosts/${person.id}`}>{person.name}</Link> : person.name}</p><p className="text-sm text-gray-500">{person.role} · {person.email}</p>{isHost && <p className="mt-1 text-sm text-blue-700">Allocation: {person.capacity} guests</p>}</div>
              <div className="flex flex-wrap items-center gap-2">
                {isHost && <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); updateHostQuota(person.id, e.currentTarget.elements.quota.value); }}><input name="quota" type="number" min="1" defaultValue={person.capacity} className="w-24 rounded-lg border px-2 py-2" aria-label={`Quota for ${person.name}`} /><button className="rounded-lg border px-3 py-2 text-sm">Update quota</button></form>}
                <button onClick={() => { setEditingPerson(person.id); setPersonDraft({ name: person.name, email: person.email }); }} className="rounded-lg border px-3 py-2 text-sm">Edit account</button>
                {isAdmin && person.role === ROLES.SUPERHOST && <select aria-label={`Reassign ${person.name}`} defaultValue={eventId} onChange={(e) => { if (Number(e.target.value) !== eventId) updateMember(person.id, { eventId: Number(e.target.value) }); }} className="rounded-lg border bg-white px-3 py-2 text-sm"><option value={eventId}>Reassign to…</option>{events.filter((item) => item.id !== eventId && !item.deletedAt).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>}
                {(isMember || isHost) && <button onClick={() => { if (window.confirm(`Remove ${person.name}'s event access? Activity history will remain.`)) removeMember(person.id); }} className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700">Remove access</button>}
              </div>
            </div>
            {editingPerson === person.id && <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); if (updateMember(person.id, personDraft)) setEditingPerson(null); }}><label className="text-sm font-medium">Name<input required minLength="2" className="mt-1 w-full rounded-lg border px-3 py-2" value={personDraft.name} onChange={(e) => setPersonDraft({ ...personDraft, name: e.target.value })} /></label><label className="text-sm font-medium">Login email<input required type="email" className="mt-1 w-full rounded-lg border px-3 py-2" value={personDraft.email} onChange={(e) => setPersonDraft({ ...personDraft, email: e.target.value })} /></label><div className="flex items-end gap-2"><button className="rounded-lg bg-blue-600 px-4 py-2 text-white">Save</button><button type="button" onClick={() => setEditingPerson(null)} className="rounded-lg border px-4 py-2">Cancel</button></div></form>}
          </div>;
        })}</div>}
      </section>}

      {!isDeleted && <AccountInvites event={event} />}

      <section className="rounded-2xl bg-white p-6 shadow"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Entry activity</h3><span className="text-sm text-gray-500">{eventEntries.length} records</span></div>{eventEntries.length === 0 ? <p className="text-gray-500">No entry activity yet.</p> : <div className="space-y-3">{[...eventEntries].reverse().slice(0, 12).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-b pb-3 text-sm"><span>{entry.primaryName || entry.guestName || "Unlisted guest"} · {entry.action} · {entry.count || 1} guest(s) · {entry.gate}</span><span className="text-gray-500">{new Date(entry.scannedAt).toLocaleString()} · {entry.actorName}</span></div>)}</div>}</section>

      <CreateMemberModal isOpen={showAccountModal} onClose={() => setShowAccountModal(false)} eventId={eventId} />
    </div>
  );
}

export default EventDetail;
