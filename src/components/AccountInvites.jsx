import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";
import { copyText, publicUrl, shareWhatsApp } from "../lib/sharing";

function AccountInvites({ event }) {
  const { user, invites, createInvite, revokeInvite } = useApp();
  const [role, setRole] = useState(user?.role === ROLES.HOST ? ROLES.GATE_SCANNER : ROLES.HOST);
  const [capacity, setCapacity] = useState(10);
  const roles = user?.role === ROLES.GLOBAL_ADMIN
    ? [ROLES.SUPERHOST, ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER]
    : user?.role === ROLES.SUPERHOST
      ? [ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER]
      : user?.role === ROLES.HOST ? [ROLES.GATE_SCANNER] : [];
  const eventInvites = invites.filter((invite) => invite.eventId === event.id).reverse();

  const makeInvite = () => {
    const invite = createInvite({ eventId: event.id, role, capacity, expiresInHours: 48 });
    if (!invite) return;
    const link = publicUrl(`/invite/${invite.token}`);
    copyText(`${event.name} · ${role} invite\n${link}`).then(() => toast.success("One-time invite link copied")).catch(() => toast.error("Could not copy invite link"));
  };

  const shareInvite = (invite) => {
    const link = publicUrl(`/invite/${invite.token}`);
    shareWhatsApp(`${event.name} · one-time ${invite.role} invite`, link);
  };

  return <section className="rounded-2xl bg-white p-5 shadow sm:p-6">
    <div><h3 className="text-lg font-semibold">Invite event team</h3><p className="mt-1 text-sm text-gray-500">Each link is event-specific, expires in 48 hours, and can be claimed once. Claiming creates a separate device-bound account without asking for personal details.</p></div>
    {roles.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"> <select aria-label="Invite role" value={role} onChange={(e) => setRole(e.target.value)} className="min-h-12 rounded-xl border bg-white px-4">{roles.map((item) => <option key={item}>{item}</option>)}</select>{role === ROLES.HOST && <label className="flex items-center gap-2 rounded-xl border px-3 text-sm">Guest quota<input aria-label="Host guest quota" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-20 rounded-lg border px-2 py-2" /></label>}<button onClick={makeInvite} className="min-h-12 rounded-xl bg-blue-600 px-5 font-semibold text-white">Create one-time link</button></div>}
    {eventInvites.length > 0 && <div className="mt-4 space-y-2">{eventInvites.map((invite) => {
      const expired = new Date(invite.expiresAt) <= new Date();
      const status = invite.claimedAt ? "Claimed" : invite.revokedAt ? "Revoked" : expired ? "Expired" : "Ready";
      return <div key={invite.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{invite.role} · {status}</p><p className="text-xs text-gray-500">Expires {new Date(invite.expiresAt).toLocaleString()}</p></div><div className="flex gap-2">{status === "Ready" && <><button onClick={() => copyText(`${event.name} · one-time ${invite.role} invite\n${publicUrl(`/invite/${invite.token}`)}`).then(() => toast.success("Invite copied")).catch(() => toast.error("Could not copy link"))} className="min-h-10 rounded-lg border px-3 text-sm">Copy link</button><button onClick={() => shareInvite(invite)} className="min-h-10 rounded-lg border px-3 text-sm">WhatsApp</button><button onClick={() => { if (revokeInvite(invite.id)) toast.success("Invite revoked"); }} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm text-red-700">Revoke</button></>}</div></div>;
    })}</div>}
  </section>;
}

export default AccountInvites;
