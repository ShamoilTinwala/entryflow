function HostCard({ host }) {
  const remaining = host.capacity - host.used;

  return (
    <div className="bg-white rounded-2xl shadow p-6">

      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-xl font-bold">
            {host.name}
          </h2>

          <p className="text-gray-500 mt-1">
            Capacity: {host.capacity}
          </p>

          <p className="text-green-600 mt-1">
            Used: {host.used}
          </p>

          <p className="text-blue-600 mt-1">
            Remaining: {remaining}
          </p>
        </div>

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700">
          View Entries
        </button>

      </div>

    </div>
  );
}

export default HostCard;