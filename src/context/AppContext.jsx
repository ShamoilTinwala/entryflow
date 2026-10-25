import { createContext, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  seedEntries,
  seedEvents,
  seedGuests,
  seedHosts,
} from "../data/mockData";

const STORAGE_KEY = "entryflow-state";
const USER_KEY = "entryflow-user";

const AppContext = createContext(null);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        events: seedEvents,
        hosts: seedHosts,
        guests: seedGuests,
        entries: seedEntries,
      };
    }
    const parsed = JSON.parse(raw);
    return {
      events: parsed.events ?? seedEvents,
      hosts: parsed.hosts ?? seedHosts,
      guests: parsed.guests ?? seedGuests,
      entries: parsed.entries ?? seedEntries,
    };
  } catch {
    return {
      events: seedEvents,
      hosts: seedHosts,
      guests: seedGuests,
      entries: seedEntries,
    };
  }
}

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function nextId(items) {
  return items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function makeCode(eventId, hostId, guests) {
  const count = guests.filter(
    (guest) => guest.eventId === eventId && guest.hostId === hostId,
  ).length + 1;
  return `EF-${eventId}${hostId}-${String(count).padStart(3, "0")}`;
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  const [events, setEvents] = useState(() => loadState().events);
  const [hosts, setHosts] = useState(() => loadState().hosts);
  const [guests, setGuests] = useState(() => loadState().guests);
  const [entries, setEntries] = useState(() => loadState().entries);

  const save = (next) => {
    persist({
      events: next.events ?? events,
      hosts: next.hosts ?? hosts,
      guests: next.guests ?? guests,
      entries: next.entries ?? entries,
    });
  };

  const login = ({ email, password }) => {
    if (!email || !password) {
      toast.error("Email and password are required");
      return false;
    }
    const nextUser = {
      email,
      name: email.split("@")[0] || "Admin",
      role: "Organizer",
    };
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setUser(nextUser);
    toast.success("Signed in");
    return true;
  };

  const logout = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
    toast.success("Signed out");
  };

  const createEvent = ({ name, venue, date }) => {
    const event = {
      id: nextId(events),
      name: name.trim(),
      venue: venue.trim(),
      date,
      status: "Draft",
    };
    const next = [...events, event];
    setEvents(next);
    save({ events: next });
    toast.success("Event created");
    return event;
  };

  const updateEventStatus = (eventId, status) => {
    const next = events.map((event) =>
      event.id === eventId ? { ...event, status } : event,
    );
    setEvents(next);
    save({ events: next });
    toast.success(`Event marked ${status}`);
  };

  const createHost = ({ eventId, name, capacity, isSuperHost }) => {
    const host = {
      id: nextId(hosts),
      eventId: Number(eventId),
      name: name.trim(),
      capacity: Number(capacity),
      isSuperHost: Boolean(isSuperHost),
    };
    const next = [...hosts, host];
    setHosts(next);
    save({ hosts: next });
    toast.success("Host added");
    return host;
  };

  const createGuest = ({ eventId, hostId, name }) => {
    const host = hosts.find((item) => item.id === Number(hostId));
    const issued = guests.filter((guest) => guest.hostId === Number(hostId)).length;
    if (!host) {
      toast.error("Host not found");
      return null;
    }
    if (issued >= host.capacity) {
      toast.error("Host quota is full");
      return null;
    }

    const guest = {
      id: nextId(guests),
      eventId: Number(eventId),
      hostId: Number(hostId),
      name: name.trim(),
      code: makeCode(Number(eventId), Number(hostId), guests),
      entered: false,
    };
    const next = [...guests, guest];
    setGuests(next);
    save({ guests: next });
    toast.success(`Pass issued: ${guest.code}`);
    return guest;
  };

  const scanPass = ({ code, gate = "Main Gate" }) => {
    const token = code.trim().toUpperCase();
    const guest = guests.find((item) => item.code.toUpperCase() === token);

    if (!guest) {
      toast.error("Pass not found");
      return { ok: false, message: "Pass not found" };
    }

    const event = events.find((item) => item.id === guest.eventId);
    if (!event) {
      toast.error("Event not found");
      return { ok: false, message: "Event not found" };
    }
    if (event.status !== "Live") {
      toast.error("Event is not live");
      return { ok: false, message: "Event is not live" };
    }
    if (guest.entered) {
      toast.error("Pass already used");
      return { ok: false, message: "Pass already used" };
    }

    const nextGuests = guests.map((item) =>
      item.id === guest.id ? { ...item, entered: true } : item,
    );
    const entry = {
      id: nextId(entries),
      guestId: guest.id,
      eventId: guest.eventId,
      hostId: guest.hostId,
      guestName: guest.name,
      code: guest.code,
      scannedAt: new Date().toISOString(),
      gate,
    };
    const nextEntries = [...entries, entry];
    setGuests(nextGuests);
    setEntries(nextEntries);
    save({ guests: nextGuests, entries: nextEntries });
    toast.success(`${guest.name} admitted`);
    return { ok: true, guest, entry };
  };

  const resetDemoData = () => {
    setEvents(seedEvents);
    setHosts(seedHosts);
    setGuests(seedGuests);
    setEntries(seedEntries);
    persist({
      events: seedEvents,
      hosts: seedHosts,
      guests: seedGuests,
      entries: seedEntries,
    });
    toast.success("Demo data reset");
  };

  const stats = useMemo(() => {
    const liveEvents = events.filter((event) => event.status === "Live").length;
    return [
      { title: "Total Events", value: events.length, color: "text-blue-600" },
      { title: "Live Events", value: liveEvents, color: "text-green-600" },
      { title: "Total Entries", value: entries.length, color: "text-purple-600" },
    ];
  }, [events, entries]);

  const value = {
    user,
    events,
    hosts,
    guests,
    entries,
    stats,
    login,
    logout,
    createEvent,
    updateEventStatus,
    createHost,
    createGuest,
    scanPass,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
