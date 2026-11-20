import ShortList from "../components/ShortList";
import { useState } from "react";
import { Link } from "react-router-dom";
import CreateMemberModal from "../components/CreateMemberModal";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";

function Hosts() {
  const { user, hosts, events } = useApp();
  const [showModal, setShowModal] = useState(false);
  const visibleHosts = hosts.filter((host) => host.active !== false && (user?.role === ROLES.GLOBAL_ADMIN || Number(host.eventId) === Number(user?.eventId)));
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-2xl font-bold">Event Hosts</h2><p className="text-muted-foreground">Manage event-specific Host accounts and guest allocations.</p></div><button onClick={() => setShowModal(true)} className="rounded-xl bg-primary px-5 py-3 text-primary-foreground">+ Create Host</button></div>
    <div className="space-y-4">{visibleHosts.length === 0 ? <p className="rounded-2xl bg-card p-6 text-muted-foreground">No Host accounts yet.</p> : <ShortList items={[...visibleHosts].reverse()} label="hosts" limit={5}>{host => {
      const event = events.find((item) => item.id === host.eventId);
      return <Link key={host.id} to={`/hosts/${host.id}`} className="block rounded-2xl bg-card p-6 shadow transition hover:shadow-md"><div className="flex flex-wrap justify-between gap-4"><div><h3 className="text-xl font-bold">{host.name}</h3><p className="mt-1 text-muted-foreground">{event?.name} · {host.email}</p></div><div className="text-right"><p className="text-sm text-muted-foreground">Guest allocation</p><p className="text-2xl font-bold">{host.capacity}</p></div></div></Link>;
    }}</ShortList>}</div>
    <CreateMemberModal isOpen={showModal} onClose={() => setShowModal(false)} onlyRole={ROLES.HOST} />
  </>;
}
export default Hosts;
