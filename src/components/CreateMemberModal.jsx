import { useState } from "react";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";

const rolesForCreator = {
  [ROLES.GLOBAL_ADMIN]: [ROLES.SUPERHOST, ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER],
  [ROLES.SUPERHOST]: [ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER],
};

function CreateMemberModal({ isOpen, onClose, eventId, onlyRole }) {
  const { user, events, createMember } = useApp();
  const selectableEvents = user?.role === ROLES.GLOBAL_ADMIN ? events : events.filter((event) => event.id === Number(user?.eventId));
  const defaultEventId = eventId ?? user?.eventId ?? (selectableEvents.length === 1 ? selectableEvents[0].id : "");
  const initialForm = () => ({ eventId: String(defaultEventId), role: onlyRole ?? ROLES.HOST, name: "", email: "", capacity: "10" });
  const [form, setForm] = useState(initialForm);

  if (!isOpen) return null;
  const roles = onlyRole ? [onlyRole] : rolesForCreator[user?.role] ?? [];
  const needsQuota = form.role === ROLES.HOST;
  const onSubmit = (event) => {
    event.preventDefault();
    const member = createMember({ ...form, eventId: Number(form.eventId), capacity: Number(form.capacity) });
    if (member) { setForm(initialForm()); onClose(); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-xl">
        <h2 className="text-2xl font-bold">Create event account</h2>
        {selectableEvents.length > 1 && !eventId && (
          <label className="block text-sm font-medium">Event
            <select required className="mt-2 w-full rounded-xl border bg-white px-4 py-3" value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}>
              <option value="">Select event</option>
              {selectableEvents.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
            </select>
          </label>
        )}
        {roles.length > 1 && (
          <label className="block text-sm font-medium">Role
            <select className="mt-2 w-full rounded-xl border bg-white px-4 py-3" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
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
        <p className="text-xs text-gray-500">Demo account only: login emails are stored in this browser; passwords are not verified.</p>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => { setForm(initialForm()); onClose(); }} className="flex-1 rounded-xl border py-3">Cancel</button>
          <button type="submit" className="flex-1 rounded-xl bg-blue-600 py-3 font-semibold text-white">Create account</button>
        </div>
      </form>
    </div>
  );
}

export default CreateMemberModal;
