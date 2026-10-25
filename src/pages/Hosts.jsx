import { useState } from "react";
import HostCard from "../components/HostCard";
import CreateHostModal from "../components/CreateHostModal";
import { useApp } from "../context/AppContext";

function Hosts() {
  const { hosts, guests, events } = useApp();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">All Hosts</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-5 py-3 rounded-xl hover:bg-blue-700"
        >
          + Add Host
        </button>
      </div>

      <div className="space-y-4">
        {hosts.length === 0 && (
          <p className="text-gray-500">No hosts yet. Add one to an event.</p>
        )}

        {hosts.map((host) => {
          const event = events.find((item) => item.id === host.eventId);
          const used = guests.filter((guest) => guest.hostId === host.id).length;
          return (
            <HostCard
              key={host.id}
              host={host}
              used={used}
              eventName={event?.name}
            />
          );
        })}
      </div>

      <CreateHostModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

export default Hosts;
