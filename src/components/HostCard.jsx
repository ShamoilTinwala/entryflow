import { useNavigate } from "react-router-dom";

function HostCard({ host, used, eventName }) {
  const navigate = useNavigate();
  const remaining = Math.max(host.capacity - used, 0);

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">{host.name}</h2>
          {eventName && <p className="text-gray-500 mt-1">{eventName}</p>}
          {host.isSuperHost && (
            <p className="text-sm text-blue-600 mt-1">Super host</p>
          )}
          <p className="text-gray-500 mt-1">Capacity: {host.capacity}</p>
          <p className="text-green-600 mt-1">Used: {used}</p>
          <p className="text-blue-600 mt-1">Remaining: {remaining}</p>
        </div>

        <button
          type="button"
          onClick={() => navigate(`/hosts/${host.id}`)}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          View Entries
        </button>
      </div>
    </div>
  );
}

export default HostCard;
