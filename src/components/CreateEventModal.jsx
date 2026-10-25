import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "../context/AppContext";

const schema = z.object({
  name: z.string().trim().min(2, "Enter an event name"),
  venue: z.string().trim().min(2, "Enter a venue"),
  date: z.string().min(1, "Choose a date"),
});

function CreateEventModal({ isOpen, onClose }) {
  const { createEvent } = useApp();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", venue: "", date: "" },
  });

  if (!isOpen) return null;

  const close = () => {
    reset();
    onClose();
  };

  const onSubmit = (values) => {
    createEvent(values);
    close();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white rounded-3xl w-full max-w-md p-6"
      >
        <h2 className="text-2xl font-bold mb-6">Create Event</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name</label>
            <input
              type="text"
              {...register("name")}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Annual Event 2027"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Venue</label>
            <input
              type="text"
              {...register("venue")}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Venue Name"
            />
            {errors.venue && (
              <p className="text-sm text-red-600 mt-1">{errors.venue.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Date</label>
            <input
              type="date"
              {...register("date")}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && (
              <p className="text-sm text-red-600 mt-1">{errors.date.message}</p>
            )}
          </div>
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
            Create Event
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateEventModal;
