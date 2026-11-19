import { useMemo, useState } from "react";
import { toast } from "sonner";
import { seedEntries, seedEvents, seedGuests, seedHosts } from "../data/mockData";
import { AppContext } from "./store";
import { eventCommands, nextId } from "../lib/commands";
import { ROLES } from "../lib/roles";

const STORAGE_KEY = "entryflow-state";
const USER_KEY = "entryflow-user";


function initialState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    const rawHosts = saved?.hosts ?? seedHosts;
    const rawGuests = saved?.guests ?? seedGuests;
    return {
      events: (saved?.events ?? seedEvents).map((event) => ({ invitationMessage: "", mapUrl: "", address: event.venue ?? "", description: "", startTime: "", endTime: "", ...event })),
      hosts: rawHosts.map((host) => ({ ...host, email: host.email ?? `${host.name.toLowerCase().replaceAll(" ", ".")}@entryflow.local`, role: ROLES.HOST, active: host.active !== false, capacity: Number(host.capacity ?? 10) })),
      members: saved?.members ?? [{ id: 100, name: "Demo Global Admin", email: "admin@entryflow.local", role: ROLES.GLOBAL_ADMIN, eventId: null, active: true }],
      guests: rawGuests.map((pass) => ({ totalCount: 1, enteredCount: pass.entered ? 1 : 0, insideCount: pass.entered ? 1 : 0, lockedAt: pass.entered ? "seeded" : null, deletedAt: null, ...pass, primaryName: pass.primaryName ?? pass.name })),
      entries: (saved?.entries ?? seedEntries).map((entry) => ({ ...entry, passId: entry.passId ?? entry.guestId ?? null, action: entry.action ?? "check-in", count: entry.count ?? 1, primaryName: entry.primaryName ?? entry.guestName, actorName: entry.actorName ?? "Demo data", reversedAt: entry.reversedAt ?? null })),
      audit: saved?.audit ?? [],
      invites: saved?.invites ?? [],
    };
  } catch {
    return { events: seedEvents.map((event) => ({ invitationMessage: "", mapUrl: "", address: event.venue ?? "", description: "", startTime: "", endTime: "", ...event })), hosts: seedHosts, members: [{ id: 100, name: "Demo Global Admin", email: "admin@entryflow.local", role: ROLES.GLOBAL_ADMIN, eventId: null, active: true }], guests: seedGuests.map((pass) => ({ totalCount: 1, enteredCount: pass.entered ? 1 : 0, insideCount: pass.entered ? 1 : 0, deletedAt: null, ...pass, primaryName: pass.name })), entries: seedEntries, audit: [], invites: [] };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function DemoProvider({ children }) {
  const [data, setData] = useState(initialState);
  const [user, setUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      if (!saved?.id || !saved?.role) return null;
      const account = [...data.members, ...data.hosts].find((item) => item.id === saved.id && item.active !== false);
      return account ? { id: account.id, email: account.email, name: account.name, role: account.role ?? ROLES.HOST, eventId: account.eventId ?? null } : null;
    } catch {
      return null;
    }
  });

  const commit = (next, action, eventId, target, details = {}, actor = user) => {
    const activity = {
      id: nextId(next.audit),
      action,
      eventId: eventId ?? null,
      target: target ?? "",
      details,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? "System",
      actorRole: actor?.role ?? "System",
      createdAt: new Date().toISOString(),
    };
    const saved = { ...next, audit: [...next.audit, activity] };
    setData(saved);
    saveState(saved);
    return activity;
  };

  const allAccounts = [...data.members, ...data.hosts.map((host) => ({ ...host, role: ROLES.HOST, active: host.active !== false }))];
  const eventForUser = user?.eventId ? data.events.find((event) => event.id === Number(user.eventId)) : null;

  const login = ({ email, password }) => {
    const account = allAccounts.find((item) => item.email?.toLowerCase() === email?.trim().toLowerCase() && item.active !== false && !item.deletedAt);
    if (!email || !password || password.length < 4) {
      toast.error("Enter an email and a password of at least 4 characters");
      return false;
    }
    if (!account) {
      toast.error("No active EntryFlow account uses that email");
      return false;
    }
    if (account.role !== ROLES.GLOBAL_ADMIN && !data.events.some((event) => event.id === Number(account.eventId) && !event.deletedAt)) {
      toast.error("This account is not assigned to an active event");
      return false;
    }
    const nextUser = { id: account.id, email: account.email, name: account.name, role: account.role, eventId: account.eventId ?? null };
    commit(data, "sign-in", nextUser.eventId, nextUser.email, {}, nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    toast.success(`Signed in as ${account.role}`);
    return nextUser;
  };

  const logout = () => {
    if (user) commit(data, "sign-out", user.eventId, user.email);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const commands = eventCommands({ data, user, commit, toast, deviceLabel: navigator.platform });
  const claimInvite = (token) => {
    const account = commands.claimInvite(token);
    if (account) { localStorage.setItem(USER_KEY, JSON.stringify(account)); setUser(account); }
    return account;
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEY);
    const fresh = initialState();
    setData(fresh);
    toast.success("Demo data reset");
  };

  const visibleEvents = data.events.filter((event) => !event.deletedAt);
  const assignedPasses = data.guests.filter((pass) => !pass.deletedAt);
  const stats = useMemo(() => {
    const activeEvents = data.events.filter((event) => !event.deletedAt);
    const liveEvents = activeEvents.filter((event) => event.status === "Live").length;
    return [
      { title: "Total Events", value: activeEvents.length, color: "text-blue-600" },
      { title: "Live Events", value: liveEvents, color: "text-green-600" },
      { title: "Entries", value: data.entries.filter((entry) => !entry.reversedAt && entry.action.includes("check-in")).reduce((sum, entry) => sum + Number(entry.count || 1), 0), color: "text-purple-600" },
    ];
  }, [data.events, data.entries]);

  const value = {
    user, event: eventForUser, events: visibleEvents, allEvents: data.events, hosts: data.hosts,
    members: data.members, guests: assignedPasses, allGuests: data.guests, entries: data.entries,
    audit: data.audit, invites: data.invites ?? [], stats, login, logout, ...commands, claimInvite, resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
