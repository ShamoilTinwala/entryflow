import { useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { eventInvitation } from "../lib/sharing";

export default function PublicEventInvitation() {
  const { id } = useParams();
  const { allEvents } = useApp();
  const event = allEvents.find((item) => item.id === Number(id) && !item.deletedAt);
  if (!event) return <main className="grid min-h-dvh place-items-center p-5"><p>Event invitation not found.</p></main>;
  return <main className="mx-auto min-h-dvh max-w-xl p-4 sm:grid sm:place-items-center"><article className="w-full rounded-3xl bg-white p-6 shadow sm:p-8"><p className="font-semibold text-blue-700">You’re invited</p><h1 className="mt-2 text-3xl font-bold">{event.name}</h1><p className="mt-4 whitespace-pre-wrap text-gray-700">{eventInvitation(event)}</p>{event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-12 items-center rounded-xl bg-blue-600 px-5 font-semibold text-white">Open in Maps</a>}</article></main>;
}
