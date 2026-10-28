import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "../context/AppContext";
import { eventInvitation } from "../lib/sharing";

export default function PublicPass() {
  const { code } = useParams();
  const { allEvents, guests } = useApp();
  const pass = guests.find((item) => item.code === decodeURIComponent(code) && !item.deletedAt);
  const event = pass && allEvents.find((item) => item.id === pass.eventId && !item.deletedAt);
  if (!pass || !event) return <main className="grid min-h-dvh place-items-center p-5"><p>Guest pass not found.</p></main>;
  const departed = Math.max(Number(pass.enteredCount) - Number(pass.insideCount), 0);
  return <main className="mx-auto min-h-dvh max-w-xl p-4 sm:grid sm:place-items-center"><article className="w-full rounded-3xl bg-white p-6 shadow sm:p-8"><p className="text-sm font-semibold text-blue-700">{event.name}</p><h1 className="mt-1 text-2xl font-bold">Guest pass</h1><p className="mt-1 text-gray-600">Primary guest: {pass.primaryName}</p><p className="mt-1 text-gray-600">Group size: {pass.totalCount} · Remaining: {pass.totalCount - pass.enteredCount} · Inside: {pass.insideCount} · Checked out: {departed}</p><div className="my-6 flex justify-center rounded-2xl border p-4"><QRCodeSVG value={pass.code} size={240} level="M" /></div><p className="text-center font-mono text-sm">{pass.code}</p><section className="mt-6 whitespace-pre-wrap rounded-2xl bg-slate-50 p-4 text-sm text-gray-700">{eventInvitation(event)}</section>{event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-blue-600 px-5 font-semibold text-white">Open event map</a>}</article></main>;
}
