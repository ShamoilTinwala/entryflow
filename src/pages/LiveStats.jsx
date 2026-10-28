import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";

function LiveStats() {
  const { user, events, hosts, guests, entries } = useApp();
  const visibleEvents = user?.role === ROLES.GLOBAL_ADMIN ? events : events.filter((item) => item.id === Number(user?.eventId));
  const visibleEventIds = new Set(visibleEvents.map((item) => item.id));
  const visibleEntries = [...entries].filter((entry) => visibleEventIds.has(entry.eventId)).reverse();
  return <div className="space-y-6">{visibleEvents.map((event) => {
    const eventHosts = hosts.filter((host) => host.eventId === event.id && host.active !== false);
    const eventPasses = guests.filter((pass) => pass.eventId === event.id);
    const eventEntries = entries.filter((entry) => entry.eventId === event.id && !entry.reversedAt);
    const capacity = eventHosts.reduce((sum, host) => sum + Number(host.capacity), 0);
    const totalIssued = eventPasses.reduce((sum, pass) => sum + Number(pass.totalCount), 0);
    const admitted = eventEntries.filter((entry) => entry.action.includes("check-in")).reduce((sum, entry) => sum + Number(entry.count || 1), 0);
    const inside = eventPasses.reduce((sum, pass) => sum + Number(pass.insideCount || 0), 0);
    return <section key={event.id} className="rounded-2xl bg-white p-6 shadow"><div className="flex justify-between"><div><h3 className="text-xl font-bold">{event.name}</h3><p className="text-sm text-gray-500">{event.venue} · {event.date}</p></div><span className={event.status === "Live" ? "text-green-700" : "text-gray-500"}>{event.status}</span></div><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-5">{[{ label: "Guest allocation", value: capacity }, { label: "Pass spots", value: totalIssued }, { label: "Admitted", value: admitted }, { label: "Inside", value: inside }, { label: "Hosts", value: eventHosts.length }].map((stat) => <div key={stat.label}><p className="text-sm text-gray-500">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div>)}</div></section>;
  })}
  <section className="rounded-2xl bg-white p-6 shadow"><h3 className="mb-4 text-lg font-semibold">Live entry activity</h3>{visibleEntries.length === 0 ? <p className="text-gray-500">No entries yet.</p> : <div className="space-y-3">{visibleEntries.map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-b pb-3 text-sm"><span>{entry.primaryName || "Unlisted guest"} · {entry.action} · {entry.count} · {entry.gate}{entry.reversedAt ? " · reversed" : ""}</span><span className="text-gray-500">{new Date(entry.scannedAt).toLocaleString()} · {entry.actorName}</span></div>)}</div>}</section></div>;
}
export default LiveStats;
