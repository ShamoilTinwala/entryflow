import { useState } from "react";
import EventCard from "../components/EventCard";
import CreateEventModal from "../components/CreateEventModal";
import { useApp } from "../context/AppContext";

function Events() {
  const { events, hosts, entries } = useApp();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="space-y-5">
        {events.length === 0 && (
          <p className="text-gray-500">No events yet. Create one to start.</p>
        )}

        {events.map((event) => {
          const eventHosts = hosts.filter((host) => host.eventId === event.id);
          return (
            <EventCard
              key={event.id}
              event={event}
              superHosts={eventHosts.filter((host) => host.isSuperHost).length}
              hosts={eventHosts.length}
              entries={entries.filter((entry) => entry.eventId === event.id).length}
            />
          );
        })}

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl text-lg font-semibold hover:bg-blue-700"
        >
          + Create Event
        </button>
      </div>

      <CreateEventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default Events;
