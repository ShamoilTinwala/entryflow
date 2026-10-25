import StatCard from "../components/StatCard";
import { useApp } from "../context/AppContext";

function AdminDashboard() {
  const { stats, events, hosts, guests, entries } = useApp();
  const liveEvent = events.find((event) => event.status === "Live");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            color={stat.color}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Hosts" value={hosts.length} color="text-blue-600" />
        <StatCard title="Guests" value={guests.length} color="text-blue-600" />
        <StatCard
          title="Checked in"
          value={guests.filter((guest) => guest.entered).length}
          color="text-green-600"
        />
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Latest entries</h3>
        {entries.length === 0 ? (
          <p className="text-gray-500">No scans yet.</p>
        ) : (
          <div className="space-y-3">
            {[...entries]
              .sort((a, b) => new Date(b.scannedAt) - new Date(a.scannedAt))
              .slice(0, 5)
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between text-sm border-b pb-2"
                >
                  <span>
                    {entry.guestName} · {entry.code}
                  </span>
                  <span className="text-gray-500">{entry.gate}</span>
                </div>
              ))}
          </div>
        )}
        {liveEvent && (
          <p className="text-sm text-green-600 mt-4">
            Live now: {liveEvent.name}
          </p>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
