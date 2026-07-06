import { useState } from "react";

function CreateEventModal({ isOpen, onClose }) {
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">

        <h2 className="text-2xl font-bold mb-6">
          Create Event
        </h2>

        <div className="space-y-4">

          <div>
            <label className="block text-sm font-medium mb-2">
              Event Name
            </label>

            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Annual Event 2027"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Venue
            </label>

            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Venue Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Event Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

        </div>

        <div className="flex gap-3 mt-8">

          <button
            onClick={onClose}
            className="flex-1 border rounded-xl py-3 font-semibold"
          >
            Cancel
          </button>

          <button
            className="flex-1 bg-blue-600 text-white rounded-xl py-3 font-semibold"
          >
            Create Event
          </button>

        </div>

      </div>
    </div>
  );
}

export default CreateEventModal;