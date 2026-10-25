import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useApp } from "../context/AppContext";

const schema = z.object({
  code: z.string().trim().min(3, "Enter a pass code"),
  gate: z.string().min(1),
});

function Scanner() {
  const { events, guests, scanPass } = useApp();
  const [result, setResult] = useState(null);
  const liveEvents = events.filter((event) => event.status === "Live");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "", gate: "Main Gate" },
  });

  const onSubmit = (values) => {
    const scan = scanPass(values);
    setResult(scan);
    if (scan.ok) reset({ code: "", gate: values.gate });
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-gray-500 mb-4">
          Live events: {liveEvents.length === 0 ? "none" : liveEvents.map((event) => event.name).join(", ")}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Camera scanning is not wired yet. Enter a guest pass code (for example{" "}
          <span className="font-mono">EF-2C-001</span> is already used; issue a
          new pass from an event, then scan it here).
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pass code</label>
            <input
              type="text"
              autoCapitalize="characters"
              className="w-full border rounded-xl px-4 py-3 font-mono"
              placeholder="EF-1A-001"
              {...register("code")}
            />
            {errors.code && (
              <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Gate</label>
            <select
              className="w-full border rounded-xl px-4 py-3 bg-white"
              {...register("gate")}
            >
              <option>Main Gate</option>
              <option>VIP Gate</option>
              <option>Side Gate</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-xl"
          >
            Scan pass
          </button>
        </form>
      </div>

      {result && (
        <div
          className={`rounded-2xl p-6 ${
            result.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {result.ok
            ? `${result.guest.name} admitted with ${result.guest.code}`
            : result.message}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="font-semibold mb-3">Unused live passes</h3>
        {guests.filter((guest) => {
          const event = events.find((item) => item.id === guest.eventId);
          return event?.status === "Live" && !guest.entered;
        }).length === 0 ? (
          <p className="text-gray-500 text-sm">
            No unused passes on live events. Mark an event Live and issue a pass.
          </p>
        ) : (
          <div className="space-y-2 text-sm font-mono">
            {guests
              .filter((guest) => {
                const event = events.find((item) => item.id === guest.eventId);
                return event?.status === "Live" && !guest.entered;
              })
              .map((guest) => (
                <p key={guest.id}>
                  {guest.code} · {guest.name}
                </p>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Scanner;
