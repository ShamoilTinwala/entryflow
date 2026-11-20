import { useState } from "react";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";
import HostSignInLink from "./HostSignInLink";

const rolesForCreator = {
  [ROLES.GLOBAL_ADMIN]: [ROLES.SUPERHOST, ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER],
  [ROLES.SUPERHOST]: [ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER],
};

function CreateMemberModal({ isOpen, onClose, eventId, onlyRole }) {
  const { user, hosted, events, createMember } = useApp();
  const selectableEvents = user?.role === ROLES.GLOBAL_ADMIN ? events : events.filter((event) => event.id === Number(user?.eventId));
  const defaultEventId = eventId ?? user?.eventId ?? (selectableEvents.length === 1 ? selectableEvents[0].id : "");
  const initialForm = () => ({ eventId: String(defaultEventId), role: onlyRole ?? ROLES.HOST, name: "", email: "", capacity: "10" });
  const [form, setForm] = useState(initialForm);
  const [createdHost, setCreatedHost] = useState(null);

  if (!isOpen) return null;
  if (createdHost) return <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
    <section role="dialog" aria-modal="true" aria-label="Host created" className="w-full max-w-md space-y-4 rounded-3xl bg-card p-6">
      <h2 className="text-xl font-semibold">{createdHost.name}’s account is ready</h2>
      <HostSignInLink host={createdHost} />
      <button type="button" className="min-h-11 rounded-lg border px-4" onClick={() => { setCreatedHost(null); onClose(); }}>Done</button>
    </section>
  </div>;
  const roles = onlyRole ? [onlyRole] : rolesForCreator[user?.role] ?? [];
  const needsQuota = form.role === ROLES.HOST;
  const onSubmit = async (event) => {
    event.preventDefault();
    const member = await createMember({ ...form, eventId: Number(form.eventId), capacity: Number(form.capacity) });
    if (member) {
      setForm(initialForm());
      if (member.role === ROLES.HOST) setCreatedHost(member);
      else onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={onSubmit} className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-3xl bg-card p-6 shadow-xl">
        <h2 className="text-2xl font-bold">Create event account</h2>
        {selectableEvents.length > 1 && !eventId && (
          <label className="block text-sm font-medium">Event
            <select required className="mt-2 w-full rounded-xl border bg-secondary px-4 py-3" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
              <option value="">Select event</option>
              {selectableEvents.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
          </label>
        )}
        {roles.length > 1 && (
          <label className="block text-sm font-medium">Role
            <select className="mt-2 w-full rounded-xl border bg-secondary px-4 py-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </label>
        )}
        <label className="block text-sm font-medium">Name
          <input required minLength={2} className="mt-2 w-full rounded-xl border px-4 py-3" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="block text-sm font-medium">Login email
          <input required type="email" className="mt-2 w-full rounded-xl border px-4 py-3" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        {needsQuota && <label className="block text-sm font-medium">Guest allocation
          <input required type="number" min="1" step="1" className="mt-2 w-full rounded-xl border px-4 py-3" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
        </label>}
        <p className="text-xs text-muted-foreground">{hosted ? (needsQuota ? "After creating this Host, you can share their sign-in link." : "Email sign-in requires a confirmed Supabase account.") : "Demo accounts are stored in this browser."}</p>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => { setForm(initialForm()); onClose(); }} className="flex-1 rounded-xl border py-3">Cancel</button>
          <button type="submit" className="flex-1 rounded-xl bg-primary py-3 font-semibold text-primary-foreground">Create account</button>
        </div>
      </form>
    </div>
  );
}

export default CreateMemberModal;
