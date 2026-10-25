import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "../context/AppContext";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a guest name"),
});

function HostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hosts, events, guests, entries, createGuest } = useApp();
  const hostId = Number(id);
  const host = hosts.find((item) => item.id === hostId);
  const event = events.find((item) => item.id === host?.eventId);
  const hostGuests = guests.filter((guest) => guest.hostId === hostId);
  const hostEntries = entries.filter((entry) => entry.hostId === hostId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "" },
  });

  if (!host) {
    return (
      <div>
        <p className="text-gray-500">Host not found.</p>
        <button
          type="button"
          className="mt-4 text-blue-600"
          onClick={() => navigate("/hosts")}
        >
          Back to hosts
        </button>
      </div>
    );
  }

  const used = hostGuests.length;
  const remaining = Math.max(host.capacity - used, 0);

  const onSubmit = (values) => {
    const guest = createGuest({
      eventId: host.eventId,
      hostId: host.id,
      name: values.name,
    });
    if (guest) reset();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-2xl font-bold">{host.name}</h3>
        <p className="text-gray-500 mt-1">{event?.name ?? "Unknown event"}</p>
        <p className="mt-3">
          Quota {used}/{host.capacity} · Remaining {remaining}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-2xl shadow p-6 flex gap-3"
      >
        <div className="flex-1">
          <input
            type="text"
            placeholder="Guest name"
            className="w-full border rounded-xl px-4 py-3"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          Issue pass
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Guest passes</h3>
        {hostGuests.length === 0 ? (
          <p className="text-gray-500">No guests issued yet.</p>
        ) : (
          <div className="space-y-3">
            {hostGuests.map((guest) => (
              <div
                key={guest.id}
                className="flex justify-between border rounded-xl p-4"
              >
                <div>
                  <p className="font-medium">{guest.name}</p>
                  <p className="text-sm text-gray-500 font-mono">{guest.code}</p>
                </div>
                <span
                  className={`text-sm ${
                    guest.entered ? "text-green-600" : "text-yellow-600"
                  }`}
                >
                  {guest.entered ? "Entered" : "Not entered"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Gate entries</h3>
        {hostEntries.length === 0 ? (
          <p className="text-gray-500">No scans for this host.</p>
        ) : (
          <div className="space-y-3">
            {hostEntries.map((entry) => (
              <div key={entry.id} className="flex justify-between text-sm">
                <span>
                  {entry.guestName} · {entry.code}
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

export default HostDetail;
