import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { seedEntries, seedEvents, seedGuests, seedHosts } from "../data/mockData";
import { ROLES } from "../lib/roles";

const STORAGE_KEY = "entryflow-state";
const USER_KEY = "entryflow-user";
const AppContext = createContext(null);

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

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function makeCode(eventId, hostId) {
  const token = globalThis.crypto?.randomUUID?.().replaceAll("-", "") ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `EF-${eventId}-${hostId}-${token.slice(0, 16)}`.toUpperCase();
}

export function AppProvider({ children }) {
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

  const createEvent = ({ name, venue, date, startTime = "", endTime = "", address = "", mapUrl = "", description = "", invitationMessage = "" }) => {
    if (user?.role !== ROLES.GLOBAL_ADMIN) return null;
    const event = { id: nextId(data.events), name: name.trim(), venue: venue.trim(), date, startTime, endTime, address: address.trim(), mapUrl: mapUrl.trim(), description: description.trim(), invitationMessage: invitationMessage.trim(), status: "Draft", deletedAt: null, archivedAt: null };
    commit({ ...data, events: [...data.events, event] }, "event-created", event.id, event.name);
    toast.success("Event created");
    return event;
  };

  const updateEvent = (eventId, changes) => {
    const event = data.events.find((item) => item.id === Number(eventId));
    const canManage = user?.role === ROLES.GLOBAL_ADMIN || (user?.role === ROLES.SUPERHOST && Number(user.eventId) === Number(eventId));
    if (!event || !canManage || event.deletedAt) return false;
    if (changes.status === "Archived" && user?.role !== ROLES.GLOBAL_ADMIN) return false;
    const updated = data.events.map((item) => item.id === event.id ? { ...item, ...changes } : item);
    commit({ ...data, events: updated }, changes.status ? "event-status-changed" : "event-updated", event.id, event.name, changes);
    toast.success(changes.status ? `Event marked ${changes.status}` : "Event updated");
    return true;
  };

  const updateEventStatus = (eventId, status) => updateEvent(eventId, { status });

  const archiveEvent = (eventId) => {
    if (user?.role !== ROLES.GLOBAL_ADMIN) return false;
    return updateEvent(eventId, { status: "Archived", archivedAt: new Date().toISOString() });
  };

  const deleteEvent = (eventId) => {
    if (user?.role !== ROLES.GLOBAL_ADMIN) return false;
    const event = data.events.find((item) => item.id === Number(eventId));
    if (!event || event.deletedAt) return false;
    const events = data.events.map((item) => item.id === event.id ? { ...item, deletedAt: new Date().toISOString() } : item);
    commit({ ...data, events }, "event-soft-deleted", event.id, event.name);
    toast.success("Event removed from active events; its records are preserved");
    return true;
  };

  const createMember = ({ eventId, role, name, email, capacity }) => {
    const event = data.events.find((item) => item.id === Number(eventId) && !item.deletedAt);
    const canCreate = user?.role === ROLES.GLOBAL_ADMIN || (user?.role === ROLES.SUPERHOST && Number(user.eventId) === Number(eventId));
    if (!event || !canCreate || ![ROLES.SUPERHOST, ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER].includes(role)) return null;
    if (allAccounts.some((account) => account.email?.toLowerCase() === email.trim().toLowerCase() && account.active !== false)) {
      toast.error("An account with this email already exists");
      return null;
    }
    const memberId = nextId([...data.members, ...data.hosts]);
    if (role === ROLES.HOST) {
      const host = { id: memberId, eventId: Number(eventId), name: name.trim(), email: email.trim(), capacity: Number(capacity), role, active: true, createdBy: user.id };
      commit({ ...data, hosts: [...data.hosts, host] }, "host-account-created", event.id, host.name, { email: host.email, capacity: host.capacity });
      toast.success("Host account created");
      return host;
    }
    const member = { id: memberId, eventId: Number(eventId), name: name.trim(), email: email.trim(), role, active: true, createdBy: user.id };
    commit({ ...data, members: [...data.members, member] }, `${role.toLowerCase().replaceAll(" ", "-")}-account-created`, event.id, member.name, { email: member.email });
    toast.success(`${role} account created`);
    return member;
  };

  const createInvite = ({ eventId, role, capacity = 10, expiresInHours = 48 }) => {
    const event = data.events.find((item) => item.id === Number(eventId) && !item.deletedAt);
    const allowedRoles = user?.role === ROLES.GLOBAL_ADMIN
      ? [ROLES.SUPERHOST, ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER]
      : user?.role === ROLES.SUPERHOST && Number(user.eventId) === Number(eventId)
        ? [ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER]
        : user?.role === ROLES.HOST && Number(user.eventId) === Number(eventId)
          ? [ROLES.GATE_SCANNER]
          : [];
    if (!event || !allowedRoles.includes(role)) return null;
    const token = globalThis.crypto?.randomUUID?.().replaceAll("-", "") ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
    const invite = { id: token.slice(0, 20), token, eventId: event.id, role, capacity: role === ROLES.HOST ? Math.max(1, Number(capacity) || 10) : null, createdBy: user.id, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString(), claimedAt: null, revokedAt: null };
    commit({ ...data, invites: [...(data.invites ?? []), invite] }, "account-invite-created", event.id, role, { expiresAt: invite.expiresAt });
    return invite;
  };

  const revokeInvite = (inviteId) => {
    const invite = (data.invites ?? []).find((item) => item.id === inviteId && !item.claimedAt && !item.revokedAt);
    if (!invite) return false;
    const canManage = user?.role === ROLES.GLOBAL_ADMIN || (user?.role === ROLES.SUPERHOST && Number(user.eventId) === invite.eventId) || (user?.role === ROLES.HOST && invite.role === ROLES.GATE_SCANNER && Number(user.eventId) === invite.eventId);
    if (!canManage) return false;
    const invites = data.invites.map((item) => item.id === invite.id ? { ...item, revokedAt: new Date().toISOString() } : item);
    commit({ ...data, invites }, "account-invite-revoked", invite.eventId, invite.role);
    return true;
  };

  const claimInvite = (token) => {
    const invite = (data.invites ?? []).find((item) => item.token === token && !item.claimedAt && !item.revokedAt && new Date(item.expiresAt) > new Date());
    const event = invite && data.events.find((item) => item.id === invite.eventId && !item.deletedAt);
    if (!invite || !event) return null;
    const id = nextId([...data.members, ...data.hosts]);
    const platform = navigator.userAgentData?.platform || navigator.platform || "device";
    const deviceLabel = `${String(platform).slice(0, 32)} · ${String(id).padStart(3, "0")}`;
    const account = { id, eventId: invite.eventId, name: `${invite.role} · ${deviceLabel}`, role: invite.role, email: `device-${id}@entryflow.local`, active: true, createdBy: invite.createdBy, deviceBound: true };
    const inviteUpdate = { ...invite, claimedAt: new Date().toISOString(), claimedAccountId: id };
    const invites = data.invites.map((item) => item.id === invite.id ? inviteUpdate : item);
    const members = invite.role === ROLES.HOST ? data.members : [...data.members, account];
    const hosts = invite.role === ROLES.HOST ? [...data.hosts, { ...account, capacity: invite.capacity ?? 10 }] : data.hosts;
    const nextUser = { id, name: account.name, role: account.role, eventId: account.eventId, email: account.email };
    commit({ ...data, invites, members, hosts }, "account-invite-claimed", event.id, account.name, { role: account.role, deviceBound: true }, nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  };

  const updateMember = (memberId, changes) => {
    const host = data.hosts.find((item) => item.id === Number(memberId));
    const member = data.members.find((item) => item.id === Number(memberId));
    const target = host ?? member;
    if (!target) return false;
    const allowed = user?.role === ROLES.GLOBAL_ADMIN || (user?.role === ROLES.SUPERHOST && Number(user.eventId) === Number(target.eventId));
    if (!allowed || target.role === ROLES.GLOBAL_ADMIN) return false;
    if (changes.email && allAccounts.some((item) => item.id !== target.id && item.email?.toLowerCase() === changes.email.trim().toLowerCase() && item.active !== false)) {
      toast.error("An account with this email already exists");
      return false;
    }
    if (changes.eventId != null && (user?.role !== ROLES.GLOBAL_ADMIN || !data.events.some((item) => item.id === Number(changes.eventId) && !item.deletedAt))) {
      toast.error("Only a Global Admin can reassign an account to an active event");
      return false;
    }
    const hosts = host ? data.hosts.map((item) => item.id === host.id ? { ...item, ...changes } : item) : data.hosts;
    const members = member ? data.members.map((item) => item.id === member.id ? { ...item, ...changes } : item) : data.members;
    commit({ ...data, hosts, members }, "event-account-updated", target.eventId, target.name, changes);
    toast.success("Account updated");
    return true;
  };

  const removeMember = (memberId) => {
    const target = [...data.hosts, ...data.members].find((item) => item.id === Number(memberId));
    if (!target || target.role === ROLES.GLOBAL_ADMIN) return false;
    const allowed = user?.role === ROLES.GLOBAL_ADMIN || (user?.role === ROLES.SUPERHOST && Number(user.eventId) === Number(target.eventId));
    if (!allowed) return false;
    const hosts = data.hosts.map((item) => item.id === target.id ? { ...item, active: false } : item);
    const members = data.members.map((item) => item.id === target.id ? { ...item, active: false } : item);
    commit({ ...data, hosts, members }, "event-account-removed", target.eventId, target.name, { role: target.role });
    toast.success("Account access removed; history is preserved");
    return true;
  };

  const updateHostQuota = (hostId, capacity) => {
    if (user?.role !== ROLES.GLOBAL_ADMIN && user?.role !== ROLES.SUPERHOST) return false;
    const host = data.hosts.find((item) => item.id === Number(hostId));
    if (!host || (user.role === ROLES.SUPERHOST && Number(user.eventId) !== Number(host.eventId))) return false;
    const nextCapacity = Number(capacity);
    const used = data.guests.filter((pass) => pass.hostId === host.id && !pass.deletedAt).reduce((sum, pass) => sum + Number(pass.totalCount || 1), 0);
    if (!Number.isInteger(nextCapacity) || nextCapacity < used) {
      toast.error(`Quota cannot be lower than ${used} allocated guest spots`);
      return false;
    }
    const hosts = data.hosts.map((item) => item.id === host.id ? { ...item, capacity: nextCapacity } : item);
    commit({ ...data, hosts }, "host-quota-changed", host.eventId, host.name, { from: host.capacity, to: nextCapacity });
    toast.success("Guest quota updated");
    return true;
  };

  const createGuest = ({ eventId, hostId, name, count = 1 }) => {
    const host = data.hosts.find((item) => item.id === Number(hostId) && item.active !== false);
    const canIssue = user?.role === ROLES.GLOBAL_ADMIN || user?.role === ROLES.SUPERHOST || (user?.role === ROLES.HOST && Number(user.id) === Number(hostId));
    const quantity = Number(count);
    if (!canIssue || !host || host.eventId !== Number(eventId) || (user?.role !== ROLES.GLOBAL_ADMIN && Number(user.eventId) !== Number(eventId))) return null;
    const reserved = data.guests.filter((pass) => pass.hostId === host.id && !pass.deletedAt).reduce((sum, pass) => sum + Number(pass.totalCount || 1), 0);
    if (!Number.isInteger(quantity) || quantity < 1 || reserved + quantity > Number(host.capacity)) {
      toast.error(`Only ${Math.max(Number(host.capacity) - reserved, 0)} guest spots remain`);
      return null;
    }
    const pass = { id: nextId(data.guests), eventId: Number(eventId), hostId: host.id, primaryName: name.trim(), code: makeCode(eventId, hostId), totalCount: quantity, enteredCount: 0, insideCount: 0, lockedAt: null, deletedAt: null, createdAt: new Date().toISOString() };
    commit({ ...data, guests: [...data.guests, pass] }, "guest-pass-created", pass.eventId, pass.primaryName, { code: pass.code, count: quantity });
    toast.success(`Pass created: ${pass.code}`);
    return pass;
  };

  const updateGuest = (passId, changes) => {
    const pass = data.guests.find((item) => item.id === Number(passId) && !item.deletedAt);
    const canManage = user?.role === ROLES.GLOBAL_ADMIN || user?.role === ROLES.SUPERHOST || (user?.role === ROLES.HOST && Number(user.id) === Number(pass?.hostId));
    if (!pass || !canManage || (user?.role !== ROLES.GLOBAL_ADMIN && Number(user.eventId) !== Number(pass.eventId))) return false;
    if (pass.lockedAt || pass.enteredCount > 0) {
      toast.error("This pass is locked after its first check-in");
      return false;
    }
    const newCount = changes.totalCount == null ? pass.totalCount : Number(changes.totalCount);
    const host = data.hosts.find((item) => item.id === pass.hostId);
    const otherReserved = data.guests.filter((item) => item.hostId === pass.hostId && item.id !== pass.id && !item.deletedAt).reduce((sum, item) => sum + Number(item.totalCount || 1), 0);
    if (!Number.isInteger(newCount) || newCount < 1 || otherReserved + newCount > Number(host?.capacity ?? 0)) {
      toast.error("The updated pass count exceeds the available quota");
      return false;
    }
    const guests = data.guests.map((item) => item.id === pass.id ? { ...item, ...changes, totalCount: newCount } : item);
    commit({ ...data, guests }, "guest-pass-updated", pass.eventId, pass.primaryName, changes);
    toast.success("Pass updated");
    return true;
  };

  const deleteGuest = (passId) => {
    const pass = data.guests.find((item) => item.id === Number(passId) && !item.deletedAt);
    const canManage = user?.role === ROLES.GLOBAL_ADMIN || user?.role === ROLES.SUPERHOST || (user?.role === ROLES.HOST && Number(user.id) === Number(pass?.hostId));
    if (!pass || !canManage || (user?.role !== ROLES.GLOBAL_ADMIN && Number(user.eventId) !== Number(pass.eventId))) return false;
    if (pass.lockedAt || pass.enteredCount > 0) {
      toast.error("This pass is locked after its first check-in");
      return false;
    }
    const guests = data.guests.map((item) => item.id === pass.id ? { ...item, deletedAt: new Date().toISOString() } : item);
    commit({ ...data, guests }, "unused-pass-deleted", pass.eventId, pass.primaryName, { returnedQuota: pass.totalCount, code: pass.code });
    toast.success(`${pass.totalCount} guest spots returned to the allocation`);
    return true;
  };

  const scanPass = ({ code, count = 1, gate = "Main Gate", action = "check-in" }) => {
    if (![ROLES.GLOBAL_ADMIN, ROLES.SUPERHOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER].includes(user?.role)) return { ok: false, message: "Scanning is not allowed for this account" };
    const pass = data.guests.find((item) => item.code.toUpperCase() === code.trim().toUpperCase() && !item.deletedAt);
    if (!pass) return { ok: false, message: "Pass not found" };
    const event = data.events.find((item) => item.id === pass.eventId && !item.deletedAt);
    if (!event || event.status !== "Live") return { ok: false, message: "Event is not live" };
    if (user?.role !== ROLES.GLOBAL_ADMIN && Number(user?.eventId) !== Number(event.id)) return { ok: false, message: "Pass belongs to another event" };
    const amount = Number(count);
    const remaining = Number(pass.totalCount) - Number(pass.enteredCount);
    if (!Number.isInteger(amount) || amount < 1 || amount > remaining) return { ok: false, message: `Only ${Math.max(remaining, 0)} entries remain on this pass` };
    const entry = { id: nextId(data.entries), passId: pass.id, eventId: pass.eventId, hostId: pass.hostId, primaryName: pass.primaryName, code: pass.code, count: amount, action, gate, actorId: user?.id ?? null, actorName: user?.name ?? "System", scannedAt: new Date().toISOString(), reversedAt: null };
    const guests = data.guests.map((item) => item.id === pass.id ? { ...item, enteredCount: Number(item.enteredCount) + amount, insideCount: Number(item.insideCount) + amount, lockedAt: item.lockedAt ?? new Date().toISOString() } : item);
    commit({ ...data, guests, entries: [...data.entries, entry] }, action === "check-in" ? "pass-checked-in" : action, pass.eventId, pass.primaryName, { code: pass.code, count: amount, gate });
    return { ok: true, pass, entry, remaining: remaining - amount };
  };

  const manualCheckIn = ({ eventId, code, count = 1, gate = "Main Gate", name = "" }) => {
    const allowed = [ROLES.GLOBAL_ADMIN, ROLES.SUPERHOST, ROLES.SUPERVISOR].includes(user?.role);
    if (!allowed || (user.role !== ROLES.GLOBAL_ADMIN && Number(user.eventId) !== Number(eventId))) return { ok: false, message: "Manual check-in is not allowed" };
    if (code?.trim()) return scanPass({ code, count, gate });
    if (!Number.isInteger(Number(count)) || Number(count) < 1) return { ok: false, message: "Enter a whole number of guests" };
    const event = data.events.find((item) => item.id === Number(eventId) && !item.deletedAt);
    if (!event || event.status !== "Live") return { ok: false, message: "Event is not live" };
    const entry = { id: nextId(data.entries), passId: null, eventId: event.id, hostId: null, primaryName: name.trim() || "Unlisted guest", code: "MANUAL", count: Number(count), action: "manual-check-in", gate, actorId: user.id, actorName: user.name, scannedAt: new Date().toISOString(), reversedAt: null };
    commit({ ...data, entries: [...data.entries, entry] }, "unlisted-manual-check-in", event.id, entry.primaryName, { count: entry.count, gate, nameProvided: Boolean(name.trim()) });
    toast.success("Manual entry recorded");
    return { ok: true, entry };
  };

  const checkOut = ({ passId, sourceEntryId, count = 1, gate = "Main Gate" }) => {
    if (![ROLES.GLOBAL_ADMIN, ROLES.SUPERHOST, ROLES.SUPERVISOR].includes(user?.role)) return { ok: false, message: "Check-out is not allowed" };
    const pass = passId ? data.guests.find((item) => item.id === Number(passId) && !item.deletedAt) : null;
    const source = sourceEntryId ? data.entries.find((item) => item.id === Number(sourceEntryId) && item.action === "manual-check-in" && !item.reversedAt) : null;
    const eventId = pass?.eventId ?? source?.eventId;
    if ((!pass && !source) || (user.role !== ROLES.GLOBAL_ADMIN && Number(user.eventId) !== Number(eventId))) return { ok: false, message: "Entry not found" };
    const amount = Number(count);
    const alreadyOut = source ? data.entries.filter((item) => item.action === "check-out" && item.sourceEntryId === source.id && !item.reversedAt).reduce((sum, item) => sum + item.count, 0) : 0;
    const inside = pass ? Number(pass.insideCount) : Number(source.count) - alreadyOut;
    if (!Number.isInteger(amount) || amount < 1 || amount > inside) return { ok: false, message: `Only ${inside} people are currently inside` };
    const entry = { id: nextId(data.entries), passId: pass?.id ?? null, sourceEntryId: source?.id ?? null, eventId, hostId: pass?.hostId ?? null, primaryName: pass?.primaryName ?? source.primaryName, code: pass?.code ?? "MANUAL", count: amount, action: "check-out", gate, actorId: user.id, actorName: user.name, scannedAt: new Date().toISOString(), reversedAt: null };
    const guests = pass ? data.guests.map((item) => item.id === pass.id ? { ...item, insideCount: item.insideCount - amount } : item) : data.guests;
    commit({ ...data, guests, entries: [...data.entries, entry] }, "guest-checked-out", eventId, entry.primaryName, { count: amount, gate });
    toast.success(`${amount} guest${amount === 1 ? "" : "s"} checked out`);
    return { ok: true, entry };
  };

  const reverseEntry = (entryId, reason = "") => {
    const entry = data.entries.find((item) => item.id === Number(entryId) && !item.reversedAt && ["check-in", "manual-check-in", "pass-checked-in", "unlisted-manual-check-in", "check-out"].includes(item.action));
    const privileged = [ROLES.GLOBAL_ADMIN, ROLES.SUPERHOST, ROLES.SUPERVISOR].includes(user?.role);
    const scannerOwnUndo = user?.role === ROLES.GATE_SCANNER && entry?.action === "check-in" && entry.actorId === user.id;
    if (!privileged && !scannerOwnUndo) return false;
    if (!entry || (user.role !== ROLES.GLOBAL_ADMIN && Number(user.eventId) !== Number(entry.eventId))) return false;
    const dependentCheckouts = entry.action === "check-out" ? [] : data.entries.filter((item) => item.action === "check-out" && !item.reversedAt && (entry.passId ? item.passId === entry.passId : item.sourceEntryId === entry.id));
    const reversalTime = new Date().toISOString();
    const reversedIds = new Set([entry.id, ...dependentCheckouts.map((item) => item.id)]);
    const entries = data.entries.map((item) => reversedIds.has(item.id) ? { ...item, reversedAt: reversalTime, reversedBy: user.id, reversalReason: reason.trim() || (item.id === entry.id ? "" : "Admission reversed") } : item);
    const guests = entry.passId ? data.guests.map((pass) => pass.id === entry.passId ? (entry.action === "check-out" ? { ...pass, insideCount: Math.min(pass.enteredCount, pass.insideCount + entry.count) } : { ...pass, enteredCount: Math.max(0, pass.enteredCount - entry.count), insideCount: Math.max(0, pass.insideCount - entry.count) }) : pass) : data.guests;
    commit({ ...data, guests, entries }, entry.action === "check-out" ? "check-out-reversed" : "check-in-reversed", entry.eventId, entry.primaryName, { entryId: entry.id, count: entry.count, dependentCheckoutsReversed: dependentCheckouts.length, reason: reason.trim() || null });
    toast.success(entry.action === "check-out" ? "Check-out reversed" : "Check-in reversed");
    return true;
  };

  const undoLastScan = () => {
    const entry = [...data.entries].reverse().find((item) => item.actorId === user?.id && item.action === "check-in" && !item.reversedAt);
    if (!entry) return false;
    return reverseEntry(entry.id, "Scanner undo");
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
    audit: data.audit, invites: data.invites ?? [], stats, login, logout, createEvent, updateEvent, updateEventStatus,
    archiveEvent, deleteEvent, createMember, createInvite, revokeInvite, claimInvite, updateMember, removeMember, updateHostQuota,
    createGuest, updateGuest, deleteGuest, scanPass, manualCheckIn, checkOut, reverseEntry,
    undoLastScan, resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}
