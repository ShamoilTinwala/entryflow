import { useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import CreateEventModal from "../components/CreateEventModal";
import { useApp } from "../context/AppContext";
import { ROLES } from "../lib/roles";

function Events() {
  const { events, allEvents, hosts, members, entries } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const deletedEvents = allEvents.filter((event) => event.deletedAt);
  return <>
    <div className="space-y-5">{events.length === 0 && <p className="text-gray-500">No active events yet. Create one to start.</p>}
      {events.map((event) => {
        const eventHosts = hosts.filter((host) => host.eventId === event.id && host.active !== false);
        const superhosts = members.filter((member) => member.eventId === event.id && member.role === ROLES.SUPERHOST && member.active !== false).length;
        return <EventCard key={event.id} event={event} superHosts={superhosts} hosts={eventHosts.length} entries={entries.filter((entry) => entry.eventId === event.id && !entry.reversedAt).reduce((sum, entry) => sum + Number(entry.count || 1), 0)} />;
      })}
      <button type="button" onClick={() => setShowModal(true)} className="w-full rounded-2xl bg-blue-600 py-4 text-lg font-semibold text-white hover:bg-blue-700">+ Create Event</button>
    </div>
    {deletedEvents.length > 0 && <section className="mt-8 rounded-2xl bg-white p-6 shadow"><button onClick={() => setShowDeleted((value) => !value)} className="font-semibold">{showDeleted ? "Hide" : "View"} deleted events ({deletedEvents.length})</button><p className="mt-1 text-sm text-gray-500">Records and activity history are retained.</p>{showDeleted && <div className="mt-4 space-y-3">{deletedEvents.map((event) => <Link key={event.id} to={`/events/${event.id}`} className="flex justify-between rounded-xl border p-4"><span>{event.name}</span><span className="text-sm text-gray-500">Deleted · view history</span></Link>)}</div>}</section>}
    <CreateEventModal isOpen={showModal} onClose={() => setShowModal(false)} />
  </>;
}
export default Events;
