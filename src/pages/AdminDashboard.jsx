import { FiArrowUpRight, FiCalendar, FiCamera } from "react-icons/fi";
import { Link } from "react-router-dom";
import { peopleInside } from "../lib/occupancy";
import { useApp } from "../context/AppContext";

export default function AdminDashboard() {
  const { stats, events, hosts, guests, entries, audit } = useApp();
  const inside = peopleInside(guests, entries);
  const metrics = [
    ...stats.map(({title, value}) => ({title, value})),
    { title: "Hosts", value: hosts.filter(host => host.active !== false).length },
    { title: "Check-in records", value: entries.filter(entry => !entry.reversedAt && entry.action.includes("check-in")).length },
  ];

  return <div className="space-y-5">
    <div className="grid gap-3 lg:grid-cols-[1.12fr_1fr]">
      <section className="feature-tile flex min-h-48 flex-col items-start justify-between gap-4 p-5 sm:p-7">
        <div className="grooves" aria-hidden="true" />
        <div><h2 className="text-base font-semibold">Guests inside</h2>
          <p className="text-6xl leading-none font-semibold tracking-tighter tabular-nums sm:text-7xl">{inside}</p></div>
        <Link to="/scanner" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-foreground"><FiCamera /> Open scanner</Link>
      </section>
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {metrics.map((metric, index) => <div key={metric.title} className={`metric flex flex-col justify-between gap-2 last:col-span-2 ${index === 0 ? "bg-clay text-ink" : index === 1 ? "bg-slate-tile text-ink" : "bg-card"}`}>
          <dt className="text-sm font-medium">{metric.title}</dt><dd className="text-3xl font-semibold leading-none tracking-tight">{metric.value}</dd>
        </div>)}
      </dl>
    </div>
    <section className="rounded-3xl bg-card p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Events</h2>
        <Link to="/events" className="inline-flex min-h-11 items-center gap-1 text-sm text-primary">Manage events <FiArrowUpRight /></Link></div>
      {events.map(event => <Link key={event.id} to={`/events/${event.id}`} className="flex items-center gap-3 border-t py-3 hover:bg-secondary">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary"><FiCalendar size={19} /></span>
        <div className="min-w-0 flex-1"><p className="break-words font-semibold">{event.name}</p><p className="text-sm text-muted-foreground">{event.venue}</p></div>
        <span className={event.status === "Live" ? "rounded-full bg-positive-surface px-3 py-1 text-sm text-positive" : "text-sm text-muted-foreground"}>{event.status}</span><FiArrowUpRight aria-hidden="true" />
      </Link>)}
      {!events.length && <p className="text-muted-foreground">No events yet.</p>}
    </section>
    <section className="rounded-3xl bg-card p-4 sm:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-xl font-semibold">Latest entry activity</h2><Link to="/settings" className="inline-flex min-h-11 items-center gap-1 text-sm text-primary">Audit log <FiArrowUpRight /></Link></div>
      {entries.length === 0 && <p className="text-muted-foreground">No entries yet.</p>}
      {[...entries].reverse().slice(0, 8).map(entry => <div key={entry.id} className="flex flex-wrap justify-between gap-2 border-t py-3 text-sm">
        <div><p className="font-semibold">{entry.primaryName || "Unlisted guest"}</p><p className="text-muted-foreground">{entry.action} · {entry.count} · {entry.gate}{entry.reversedAt ? " · reversed" : ""}</p></div>
        <span className="text-muted-foreground">{entry.actorName} · {new Date(entry.scannedAt).toLocaleString()}</span></div>)}
      {audit.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{audit.length} audit actions retained</p>}
    </section>
  </div>;
}
