import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import CreateHostModal from "../components/CreateHostModal";
import { useApp } from "../context/AppContext";

const guestSchema = z.object({
  name: z.string().trim().min(2, "Enter a guest name"),
  hostId: z.string().min(1, "Select a host"),
});

const statuses = ["Draft", "Ready", "Live", "Closed", "Archived"];

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { events, hosts, guests, entries, updateEventStatus, createGuest } =
    useApp();
  const [showHostModal, setShowHostModal] = useState(false);

  const eventId = Number(id);
  const event = events.find((item) => item.id === eventId);
  const eventHosts = hosts.filter((host) => host.eventId === eventId);
  const eventGuests = guests.filter((guest) => guest.eventId === eventId);
  const eventEntries = entries.filter((entry) => entry.eventId === eventId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(guestSchema),
    defaultValues: { name: "", hostId: "" },
  });

  if (!event) {
    return (
      <div>
        <p className="text-gray-500">Event not found.</p>
        <button
          type="button"
          className="mt-4 text-blue-600"
          onClick={() => navigate("/events")}
        >
          Back to events
        </button>
      </div>
    );
  }

  const onAddGuest = (values) => {
    const guest = createGuest({
      eventId,
      hostId: values.hostId,
      name: values.name,
    });
    if (guest) reset();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">{event.name}</h3>
            <p className="text-gray-500 mt-1">
              {event.venue} · {event.date}
            </p>
          </div>
          <span className="self-start rounded-full bg-gray-100 px-3 py-1 text-sm">
            {event.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => updateEventStatus(eventId, status)}
              className={`px-4 py-2 rounded-xl text-sm ${
                event.status === status
                  ? "bg-blue-600 text-white"
                  : "border hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-gray-500">Hosts</p>
          <p className="text-3xl font-bold">{eventHosts.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-gray-500">Guests</p>
          <p className="text-3xl font-bold">{eventGuests.length}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow">
          <p className="text-gray-500">Entries</p>
          <p className="text-3xl font-bold">{eventEntries.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Hosts</h3>
          <button
            type="button"
            onClick={() => setShowHostModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl"
          >
            + Add Host
          </button>
        </div>
        {eventHosts.length === 0 ? (
          <p className="text-gray-500">No hosts on this event.</p>
        ) : (
          <div className="space-y-3">
            {eventHosts.map((host) => {
              const used = eventGuests.filter((guest) => guest.hostId === host.id)
                .length;
              return (
                <Link
                  key={host.id}
                  to={`/hosts/${host.id}`}
                  className="flex justify-between border rounded-xl p-4 hover:bg-gray-50"
                >
                  <span>
                    {host.name}
                    {host.isSuperHost ? " · Super host" : ""}
                  </span>
                  <span className="text-gray-500">
                    {used}/{host.capacity}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit(onAddGuest)}
        className="bg-white rounded-2xl shadow p-6 space-y-4"
      >
        <h3 className="text-lg font-semibold">Issue guest pass</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
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
          <div>
            <select
              className="w-full border rounded-xl px-4 py-3 bg-white"
              {...register("hostId")}
            >
              <option value="">Assign host</option>
              {eventHosts.map((host) => (
                <option key={host.id} value={host.id}>
                  {host.name} (
                  {eventGuests.filter((guest) => guest.hostId === host.id).length}
                  /{host.capacity})
                </option>
              ))}
            </select>
            {errors.hostId && (
              <p className="text-sm text-red-600 mt-1">{errors.hostId.message}</p>
            )}
          </div>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-5 py-3 rounded-xl"
        >
          Issue pass
        </button>
      </form>

      <CreateHostModal
        key={eventId}
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        eventId={eventId}
      />
    </div>
  );
}

export default EventDetail;
