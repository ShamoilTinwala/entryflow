import { createHash, randomBytes } from "node:crypto";
import { eventCommands, nextId } from "../src/lib/commands.js";
import { commands } from "./validation.js";

export const secret = () => randomBytes(32).toString("hex");
const digest = value => createHash("sha256").update(value).digest("hex");
const empty = () => ({events:[], hosts:[], members:[], guests:[], entries:[], audit:[], invites:[]});
export class RequestError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
function sessionUser(data, token) {
  const hash = token && digest(token);
  const session = hash && data.sessions.find(s => s.hash === hash && s.until > Date.now());
  const person = session && [...data.members,...data.hosts].find(p => p.id === session.account && p.active);
  if (!person || (person.eventId && !data.events.some(e => e.id === person.eventId && !e.deletedAt))) return null;
  return person;
}
function snapshot(data, user, path) {
  const result = empty();
  const [kind, token] = path.split("/").slice(1);
  if (["pass","invite","event-invitation"].includes(kind)) {
    const pass = kind === "pass" && data.guests.find(p => p.code === token && !p.deletedAt);
    const invite = kind === "invite" && data.invites.find(i => i.token === token && !i.claimedAt && !i.revokedAt && Date.parse(i.expiresAt) > Date.now());
    const event = data.events.find(e => !e.deletedAt && (kind === "event-invitation" ? e.invitationToken === token : e.id === (pass || invite)?.eventId));
    if (event) {
      const {id,name,venue,date,address,mapUrl,description,invitationMessage,startTime,endTime} = event;
      result.events = [{id,name,venue,date,address,mapUrl,description,invitationMessage,startTime,endTime}];
      if (kind === "event-invitation") result.events[0].invitationToken = token;
      if (pass) {
        const {eventId,code,primaryName,totalCount,enteredCount,insideCount} = pass;
        result.guests = [{eventId,code,primaryName,totalCount,enteredCount,insideCount}];
      }
      if (invite) result.invites = [{token, eventId:event.id, role:invite.role, expiresAt:invite.expiresAt}];
    }
    return result;
  }
  if (!user) return result;
  if (user.role === "Global Admin") return Object.fromEntries(Object.keys(result).map(k=>[k,data[k]]));
  const scoped = key => data[key].filter(item => item.eventId === user.eventId);
  const manager = user.role === "Superhost";
  const supervisor = user.role === "Supervisor";
  const host = user.role === "Host";
  result.events = data.events.filter(e=>e.id === user.eventId && !e.deletedAt);
  result.hosts = scoped("hosts").filter(h => manager || supervisor || h.id === user.id);
  result.members = scoped("members").filter(m => manager || m.id === user.id);
  result.guests = scoped("guests").filter(p=> !host || p.hostId === user.id);
  result.entries = scoped("entries").filter(e=> manager || supervisor || (host ? e.hostId === user.id : e.actorId === user.id));
  result.invites = scoped("invites").filter(i=> manager || (host && i.createdBy === user.id));
  result.audit = manager || supervisor ? scoped("audit") : [];
  return result;
}
export function operation(original, request) {
  const { action, args, token, path, identity, adminId, requestId, newToken } = request;
  let data = original;
  let user = sessionUser(data, token);
  let result = true;
  let message = "";
  let cookie;
  const finish = () => ({changed:data !== original, data, cookie, result, message, user, snapshot:snapshot(data,user,action === "claimInvite" ? "/" : path)});
  if (action === "read") return finish();
  if (action === "logout") {
    if (token) data = {...data, sessions:data.sessions.filter(s=>s.hash !== digest(token))};
    user = null; cookie = ""; return finish();
  }
  const commit = (updated, actionName, eventId, target, details = {}, actor = user) => {
    data = {...updated, audit:[...updated.audit,{id:nextId(updated.audit),action:actionName,eventId,target,details,actorId:actor?.id,actorName:actor?.name,actorRole:actor?.role,createdAt:new Date().toISOString()}]};
  };
  const actions = eventCommands({data, user, commit, deviceLabel:"Browser", toast:{
    error: m => { throw new RequestError(m,409); }, success: m => {message=m;},
  }});
  if (action === "claimInvite") {
    const claimed = sessionUser(data,newToken);
    if (claimed) { user = claimed; cookie = newToken; result = user; return finish(); }
  }
  if (action === "login" || action === "claimInvite") {
    if (action === "login") {
      const accounts = [...data.members,...data.hosts];
      if (identity.id === adminId) {
        user = data.members.find(m=>m.role === "Global Admin");
        if (!user) {
          user = {id:nextId(accounts), role:"Global Admin", name:"Global Admin", email:identity.email, active:true, eventId:null};
          data = {...data,members:[...data.members,user]};
        }
      } else {
        user = accounts.find(p=> p.active && !p.deviceBound && p.role !== "Global Admin" && p.email.toLowerCase() === identity.email.toLowerCase());
      }
      if (!user || (user.eventId && !data.events.some(e=>e.id===user.eventId && !e.deletedAt))) throw new RequestError("No active EntryFlow account for this login.",403);
      commit(data,"sign-in",user.eventId,user.email);
    } else {
      user = actions.claimInvite(args[0]);
      if (!user) throw new RequestError("Invite expired, revoked or already used.",409);
    }
    cookie = newToken;
    const sessions = data.sessions.filter(s=>s.until>Date.now() && (!token || s.hash !== digest(token)));
    data = {...data,sessions:[...sessions,{account:user.id,hash:digest(cookie),until:Date.now()+30*86400000}]};
    result = user;
    return finish();
  }
  if (!user) throw new RequestError("Sign in to continue.",401);
  if (!Object.hasOwn(commands,action)) throw new RequestError("Unknown operation.");
  const parsed = commands[action].safeParse(args);
  if (!parsed.success) throw new RequestError("Check the fields and try again.");
  const prior = data.receipts.find(r=>r.userId===user.id && r.id===requestId && r.action===action);
  if (prior) {result=prior.result; return finish();}
  if (action === "updateMember" && parsed.data[1].eventId && !data.members.some(m=>m.id===args[0] && m.role==="Superhost")) throw new RequestError("Only superhosts can be reassigned.");
  if (action === "reverseEntry" && user.role === "Gate Scanner") throw new RequestError("Use undo last scan.",403);
  result = actions[action](...parsed.data);
  if (!result || result.ok === false) throw new RequestError(result?.message || "This action is unavailable.",409);
  if (action === "createEvent") result.invitationToken = secret();
  if (action === "updateMember" && parsed.data[1].email) {
    const previous = [...original.hosts,...original.members].find(p=>p.id===args[0]);
    if (previous.email !== parsed.data[1].email) data.sessions = data.sessions.filter(s=>s.account !== previous.id);
  }
  const receipts = data.receipts.filter(r=>r.until>Date.now());
  data = {...data,receipts:[...receipts,{userId:user.id,id:requestId,action,result,until:Date.now()+600000}]};
  return finish();
}
