import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { inviteRoles, ROLES } from "../lib/roles";
import { copyText, publicUrl, shareWhatsApp } from "../lib/sharing";

function AccountInvites({ event }) {
  const { user, invites, createInvite, revokeInvite } = useApp();
  const [role, setRole] = useState(ROLES.HOST);
  const [capacity, setCapacity] = useState(10);
  const roles = inviteRoles(user, event.id);
  if (!roles.length) return null;
  const eventInvites = invites.filter(invite => invite.eventId === event.id && roles.includes(invite.role)).reverse();

  const makeInvite = async () => {
    const invite = await createInvite({ eventId: event.id, role, capacity });
    if (!invite) return;
    const link = publicUrl(`/invite/${invite.token}`);
    copyText(`${event.name} · ${role} invite\n${link}`).then(() => toast.success("Sign-in link copied")).catch(() => toast.error("Could not copy invite link"));
  };

  const shareInvite = (invite) => {
    const link = publicUrl(`/invite/${invite.token}`);
    shareWhatsApp(`${event.name} · ${invite.role} sign-in link`, link);
  };

  return <section className="rounded-2xl bg-white p-5 shadow sm:p-6">
    <div><h3 className="text-lg font-semibold">Invite event team</h3><p className="mt-1 text-sm text-gray-500">Each link signs people into the same event account on any device. Copy it again below, or revoke it to end access.</p></div>
    {roles.length > 0 && <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"> <select aria-label="Invite role" value={role} onChange={(e) => setRole(e.target.value)} className="min-h-12 rounded-xl border bg-white px-4">{roles.map((item) => <option key={item}>{item}</option>)}</select>{role === ROLES.HOST && <label className="flex items-center gap-2 rounded-xl border px-3 text-sm">Guest quota<input aria-label="Host guest quota" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="w-20 rounded-lg border px-2 py-2" /></label>}<button onClick={makeInvite} className="min-h-12 rounded-xl bg-blue-600 px-5 font-semibold text-white">Create sign-in link</button></div>}
    {eventInvites.length > 0 && <div className="mt-4 space-y-2">{eventInvites.map((invite) => {
      const status = invite.revokedAt ? "Revoked" : invite.available ? "Ready" : "Unavailable";
      return <div key={invite.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{invite.role} · {status}</p><p className="text-xs text-gray-500">{invite.claimedAccountId ? `Account #${invite.claimedAccountId}` : "Account created on first sign-in"}</p></div><div className="flex gap-2">{status === "Ready" && <><button onClick={() => copyText(`${event.name} · ${invite.role} sign-in link\n${publicUrl(`/invite/${invite.token}`)}`).then(() => toast.success("Invite copied")).catch(() => toast.error("Could not copy link"))} className="min-h-10 rounded-lg border px-3 text-sm">Copy link</button><button onClick={() => shareInvite(invite)} className="min-h-10 rounded-lg border px-3 text-sm">WhatsApp</button></>}{!invite.revokedAt && <button onClick={async () => { if (await revokeInvite(invite.id)) toast.success("Invite revoked"); }} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm text-red-700">Revoke</button>}</div></div>;
    })}</div>}
  </section>;
}

export default AccountInvites;
