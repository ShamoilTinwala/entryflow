import { useState } from "react";
import { toast } from "sonner";
import { useApp } from "../context/AppContext";
import { inviteRoles, ROLES } from "../lib/roles";
import { copyText, publicUrl, shareWhatsApp } from "../lib/sharing";

export default function HostSignInLink({ host }) {
  const { user, invites, createInvite } = useApp();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  if (host.active === false || !inviteRoles(user, host.eventId).includes(ROLES.HOST)) return null;
  const invite = invites.find(item => item.available && item.claimedAccountId === host.id && item.eventId === host.eventId && item.role === ROLES.HOST);
  const url = invite && publicUrl(`/invite/${invite.token}`);

  async function showLink() {
    if (open && url) { setOpen(false); return; }
    if (invite) { setOpen(true); return; }
    setBusy(true);
    try {
      const result = await createInvite({ eventId: host.eventId, role: ROLES.HOST, hostId: host.id });
      if (result) setOpen(true);
      else toast.error("Could not prepare this Host’s sign-in link.");
    } finally { setBusy(false); }
  }

  return <div className="min-w-0">
    <button type="button" disabled={busy} aria-expanded={Boolean(open && url)} onClick={showLink}
      className="min-h-11 rounded-lg border px-3 text-sm font-medium text-primary">
      {busy ? "Preparing link…" : open && url ? "Hide sign-in link" : "Share sign-in link"}
    </button>
    {open && url && <div className="mt-2 space-y-2">
      <label className="block text-sm">Sign in as {host.name}
        <input readOnly value={url} onFocus={e => e.target.select()} className="mt-1 block min-h-11 w-full min-w-0 rounded-lg border px-2" />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="min-h-11 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"
          onClick={() => copyText(url).then(() => toast.success("Host sign-in link copied")).catch(() => toast.error("Select the link above to copy it."))}>Copy link</button>
        <button type="button" className="min-h-11 rounded-lg border px-3 text-sm" onClick={() => shareWhatsApp(`EntryFlow sign-in for ${host.name}`, url)}>WhatsApp</button>
      </div>
    </div>}
  </div>;
}
