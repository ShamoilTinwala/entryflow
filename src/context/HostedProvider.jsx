import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AppContext } from "./store";

const actions = ["login","logout","createEvent","updateEvent","archiveEvent","deleteEvent","createMember","updateMember","removeMember","createInvite","revokeInvite","claimInvite","updateHostQuota","createGuest","updateGuest","deleteGuest","scanPass","manualCheckIn","checkOut","reverseEntry","undoLastScan"];
const gateActions = ["scanPass","checkOut","manualCheckIn"];

async function send(action,args,requestId,view) {
  const response = await fetch("/api/entryflow", {method:"POST",credentials:"same-origin", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,args,requestId,view,path:location.pathname}),signal:AbortSignal.timeout(15000)});
  const payload = await response.json().catch(()=>({message:"Unexpected response from the hosting server."}));
  if (!response.ok) throw Object.assign(new Error(payload.message || "Server unavailable."),{status:response.status});
  if (!payload.unchanged && (!payload.snapshot || !Number.isSafeInteger(payload.revision))) {
    throw new Error("EntryFlow API unavailable. Check the Vercel function and routing.");
  }
  return payload;
}
export function HostedProvider({children}) {
  const [state,setState] = useState(null);
  const [error,setError] = useState("");
  const pending = useRef(false);
  const lastView = useRef("");
  const retry = useRef(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    if (pending.current) return;
    const version = ++generation.current;
    const requestedPath = location.pathname;
    try {
      const response = await send("read",[],crypto.randomUUID(),lastView.current);
      if (generation.current !== version || requestedPath !== location.pathname) return;
      if (!response.unchanged) {
        lastView.current = response.view;
        setState(old => old && old.revision > response.revision ? old : response);
      }
      setError("");
    } catch (e) { if (generation.current === version) setError(e.message); }
  },[]);
  useEffect(()=>{
    let active = true;
    let timer;
    async function poll() {
      await refresh();
      if (active) timer = setTimeout(poll,4000);
    }
    poll();
    window.addEventListener("focus",refresh);
    return ()=>{active=false; clearTimeout(timer); window.removeEventListener("focus",refresh);};
  },[refresh]);
  async function perform(action,args) {
    const failure = message => gateActions.includes(action) ? {ok:false,message} : null;
    if (pending.current) return failure("Wait for the current action to finish.");
    pending.current=true;
    generation.current++;
    const signature = action === "login" ? null : JSON.stringify([action,args]);
    const requestId = signature && retry.current?.signature === signature ? retry.current.requestId : crypto.randomUUID();
    retry.current = {signature,requestId};
    try {
      let response;
      try { response = await send(action,args,requestId); }
      catch (e) {
        if (e.status < 500 || action === "login") throw e;
        response = await send(action,args,requestId);
      }
      retry.current = null;
      lastView.current = "";
      setState(response);
      setError("");
      if (response.message) toast.success(response.message);
      return response.result;
    } catch (e) {
      if (e.status < 500) retry.current = null;
      toast.error(e.message);
      return failure(e.message);
    } finally {
      pending.current=false;
      void refresh();
    }
  }
  if (!state) return <main className="grid min-h-dvh place-content-center gap-4 p-6 text-center"><p>{error || "Connecting to EntryFlow…"}</p>{error && <button className="rounded-lg border p-2" onClick={refresh}>Retry connection</button>}</main>;
  const {snapshot, user} = state;
  const events = snapshot.events.filter(e=>!e.deletedAt);
  const guests = snapshot.guests.filter(p=>!p.deletedAt);
  const stats = [
    {title:"Total Events",value:events.length,color:"text-blue-600"},
    {title:"Live Events",value:events.filter(e=>e.status==="Live").length,color:"text-green-600"},
    {title:"Entries",value:snapshot.entries.filter(e=>!e.reversedAt && e.action.includes("check-in")).reduce((sum,e)=>sum+e.count,0),color:"text-purple-600"},
  ];
  const methods = Object.fromEntries(actions.map(action=>[action,(...args)=>perform(action,action==="logout"?[]:args)]));
  return <AppContext.Provider value={{...snapshot,...methods,hosted:true,user,stats,event:events.find(e=>e.id===user?.eventId),allEvents:snapshot.events,allGuests:snapshot.guests,events,guests}}>
    {error && <p role="alert" className="bg-amber-100 p-2 text-center">Connection interrupted. Displaying the last synced data.</p>}
    {children}
  </AppContext.Provider>;
}
