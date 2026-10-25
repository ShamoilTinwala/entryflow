import { useApp } from "../context/AppContext";

function LiveStats() {
  const { events, hosts, guests, entries } = useApp();

  return (
    <div className="space-y-6">
      {events.map((event) => {
        const eventHosts = hosts.filter((host) => host.eventId === event.id);
        const eventGuests = guests.filter((guest) => guest.eventId === event.id);
        const eventEntries = entries.filter((entry) => entry.eventId === event.id);
        const capacity = eventHosts.reduce((sum, host) => sum + host.capacity, 0);

        return (
          <div key={event.id} className="bg-white rounded-2xl shadow p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">{event.name}</h3>
              <span
                className={`text-sm ${
                  event.status === "Live" ? "text-green-600" : "text-gray-500"
                }`}
              >
                {event.status}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-gray-500 text-sm">Quota</p>
                <p className="text-2xl font-bold">{capacity}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Issued</p>
                <p className="text-2xl font-bold">{eventGuests.length}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Inside</p>
                <p className="text-2xl font-bold text-green-600">
                  {eventEntries.length}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Waiting</p>
                <p className="text-2xl font-bold">
                  {eventGuests.filter((guest) => !guest.entered).length}
                </p>
              </div>
            </div>
          </div>
        );
      })}

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Live entry feed</h3>
        {entries.length === 0 ? (
          <p className="text-gray-500">No entries yet.</p>
        ) : (
          <div className="space-y-3">
            {[...entries]
              .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
              .map((entry) => (
                <div key={entry.id} className="flex justify-between text-sm">
                  <span>
                    {entry.guestName} · {entry.code} · {entry.gate}
                  </span>
                  <span className="text-gray-500">
                    {new Date(entry.scannedAt).toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default LiveStats;
