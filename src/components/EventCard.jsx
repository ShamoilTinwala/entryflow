import { FiArrowUpRight, FiCalendar, FiMapPin } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function EventCard({ event, superHosts, hosts, entries }) {
  return <article className="flex flex-col justify-between gap-5 rounded-3xl border bg-card p-5">
    <div><div className="flex items-start justify-between gap-3">
      <h2 className="text-xl font-semibold">{event.name}</h2>
      <span className={`rounded-full px-3 py-1 text-sm ${event.status === "Live" ? "bg-positive-surface text-positive" : "bg-secondary text-muted-foreground"}`}>{event.status}</span>
    </div>
    <div className="mt-3 space-y-1 text-sm text-muted-foreground">
      <p className="flex items-center gap-2"><FiMapPin aria-hidden="true" />{event.venue}</p>
      <p className="flex items-center gap-2"><FiCalendar aria-hidden="true" />{event.date}</p>
    </div></div>
    <div><dl className="grid grid-cols-3 gap-2 border-t py-4">
      {[["Superhosts", superHosts], ["Hosts", hosts], ["Entries", entries]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-xl font-semibold tabular-nums">{value}</dd></div>)}
    </dl><Link to={`/events/${event.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-semibold">Open event <FiArrowUpRight /></Link></div>
  </article>;
}
