import { useNavigate } from "react-router-dom";

function EventCard({ event, superHosts, hosts, entries }) {
  const navigate = useNavigate();
  const statusColor = {
    Draft: "bg-gray-500",
    Ready: "bg-yellow-500",
    Live: "bg-green-600",
    Closed: "bg-red-600",
    Archived: "bg-slate-600",
  };

  return (
    <div className="bg-white rounded-3xl shadow-md p-5 border border-gray-200">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{event.name}</h2>
        <span
          className={`px-3 py-1 rounded-full text-white text-sm ${
            statusColor[event.status] ?? "bg-gray-500"
          }`}
        >
          {event.status}
        </span>
      </div>

      <div className="mt-5 space-y-2 text-gray-600">
        <p>📍 {event.venue}</p>
        <p>📅 {event.date}</p>
        <p>👤 Super Hosts: {superHosts}</p>
        <p>🙋 Hosts: {hosts}</p>
        <p>🎟 Entries: {entries}</p>
      </div>

      <button
        type="button"
        onClick={() => navigate(`/events/${event.id}`)}
        className="mt-6 w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
      >
        Open Event
      </button>
    </div>
  );
}

export default EventCard;
