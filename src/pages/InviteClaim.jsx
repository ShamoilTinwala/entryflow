import { useEffect, useEffectEvent, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { homeForRole } from "../lib/roles";
import { useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { eventInvitation } from "../lib/sharing";

function InviteClaim() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { user, invites, allEvents, claimInvite } = useApp();
  const invite = invites.find((item) => item.token === token);
  const event = invite && allEvents.find((item) => item.id === invite.eventId && !item.deletedAt);
  const valid = Boolean(invite?.available && event);

  const attempted = useRef(null);
  async function signIn() {
    const account = await claimInvite(token);
    if (account) navigate(homeForRole(account.role, account.eventId), { replace: true });
  }
  const openLink = useEffectEvent(signIn);
  useEffect(() => {
    if (valid && !user && attempted.current !== token) {
      attempted.current = token;
      void openLink();
    }
  }, [valid, user, token]);

  if (!valid) return <main className="grid min-h-dvh place-items-center bg-slate-50 p-5"><section className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow"><h1 className="text-2xl font-bold">Invite unavailable</h1><p className="mt-3 text-gray-600">Ask your event manager for an active sign-in link.</p></section></main>;

  return <main className="grid min-h-dvh place-items-center bg-slate-50 p-5"><section className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow sm:p-8"><div><p className="text-sm font-semibold text-blue-700">EntryFlow · {invite.role} invite</p><h1 className="mt-2 text-2xl font-bold">Join {event.name}</h1><p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{eventInvitation(event)}</p></div><div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Use this link whenever you need to sign in to this event account, including on another device.</div><button onClick={signIn} className="min-h-12 w-full rounded-xl bg-blue-600 px-5 font-semibold text-white">Sign in and continue</button></section></main>;
}

export default InviteClaim;
