import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "../context/AppContext";

const schema = z.object({
  eventId: z.string().min(1, "Select an event"),
  name: z.string().trim().min(2, "Enter a host name"),
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
  isSuperHost: z.boolean().optional(),
});

function CreateHostModal({ isOpen, onClose, eventId }) {
  const { events, createHost } = useApp();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: eventId ? String(eventId) : "",
      name: "",
      capacity: 20,
      isSuperHost: false,
    },
  });

  if (!isOpen) return null;

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values) => {
    createHost(values);
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-3xl w-full max-w-md p-6"
      >
        <h2 className="text-2xl font-bold mb-6">Add Host</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event</label>
            <select
              {...register("eventId")}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select event</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            {errors.eventId && (
              <p className="text-sm text-red-600 mt-1">{errors.eventId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Host Name</label>
            <input
              type="text"
              {...register("name")}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Host A"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Quota</label>
            <input
              type="number"
              min="1"
              {...register("capacity")}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.capacity && (
              <p className="text-sm text-red-600 mt-1">{errors.capacity.message}</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("isSuperHost")} />
            Super host / supervisor
          </label>
        </div>

        <div className="flex gap-3 mt-8">
          <button
            type="button"
            onClick={close}
            className="flex-1 border rounded-xl py-3 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold"
          >
            Add Host
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateHostModal;
