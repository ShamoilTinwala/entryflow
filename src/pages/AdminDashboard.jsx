import { Link } from "react-router-dom";
import StatCard from "../components/StatCard";
import { useApp } from "../context/AppContext";

function AdminDashboard() {
  const { stats, events, hosts, guests, entries, audit } = useApp();
  const liveEvents = events.filter((item) => item.status === "Live");
  const inside = guests.reduce((sum, pass) => sum + Number(pass.insideCount || 0), 0);
  const activeHosts = hosts.filter((host) => host.active !== false).length;
  const activeEntries = entries.filter((entry) => !entry.reversedAt && entry.action.includes("check-in"));

  return <div className="space-y-8">
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">{stats.map((stat) => <StatCard key={stat.title} title={stat.title} value={stat.value} color={stat.color} />)}</div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3"><StatCard title="Hosts" value={activeHosts} color="text-blue-600" /><StatCard title="Guest spots inside" value={inside} color="text-green-600" /><StatCard title="Active check-in records" value={activeEntries.length} color="text-purple-600" /></div>
    <section className="rounded-2xl bg-white p-6 shadow"><div className="mb-4 flex items-center justify-between"><h3 className="text-lg font-semibold">Events</h3><Link to="/events" className="text-sm font-medium text-blue-600">Manage all events</Link></div>{events.length ? <div className="space-y-3">{events.map((event) => <Link key={event.id} to={`/events/${event.id}`} className="flex flex-wrap justify-between gap-3 rounded-xl border p-4 hover:bg-gray-50"><span><strong>{event.name}</strong><span className="ml-2 text-sm text-gray-500">{event.venue}</span></span><span className={event.status === "Live" ? "text-green-700" : "text-gray-500"}>{event.status}</span></Link>)}</div> : <p className="text-gray-500">No events yet.</p>}{liveEvents.length > 0 && <p className="mt-4 text-sm text-green-700">Live now: {liveEvents.map((item) => item.name).join(", ")}</p>}</section>
    <section className="rounded-2xl bg-white p-6 shadow"><div className="mb-4 flex justify-between"><h3 className="text-lg font-semibold">Latest entry activity</h3><Link to="/settings" className="text-sm text-blue-600">Open full audit log</Link></div>{entries.length === 0 ? <p className="text-gray-500">No entries yet.</p> : <div className="space-y-3">{[...entries].reverse().slice(0, 8).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-b pb-3 text-sm"><span>{entry.primaryName || "Unlisted guest"} · {entry.action} · {entry.count} · {entry.gate}{entry.reversedAt ? " · reversed" : ""}</span><span className="text-gray-500">{entry.actorName} · {new Date(entry.scannedAt).toLocaleString()}</span></div>)}</div>}{audit.length > 0 && <p className="mt-4 text-xs text-gray-400">{audit.length} audit actions retained</p>}</section>
  </div>;
}
export default AdminDashboard;
