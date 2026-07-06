import { useState } from "react";
import Layout from "../components/Layout";
import EventCard from "../components/EventCard";
import CreateEventModal from "../components/CreateEventModal";
import { events } from "../data/mockData";

function Events() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Layout title="Events">

        <div className="space-y-5">

          {events.map((event) => (
            <EventCard
              key={event.id}
              eventName={event.name}
              status={event.status}
              superHosts={event.superHosts}
              hosts={event.hosts}
              entries={event.entries}
              onOpen={() => console.log(event.name)}
            />
          ))}

          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl text-lg font-semibold hover:bg-blue-700"
          >
            + Create Event
          </button>

        </div>

      </Layout>

      <CreateEventModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default Events;