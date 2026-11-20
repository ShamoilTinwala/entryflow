import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useApp } from "../context/AppContext";
import { eventInvitation } from "../lib/sharing";

export default function PublicPass() {
  const { code } = useParams();
  const { allEvents, guests } = useApp();
  const pass = guests.find(item => item.code === code && !item.deletedAt);
  const event = pass && allEvents.find(item => item.id === pass.eventId && !item.deletedAt);
  if (!pass || !event) return <main className="grid min-h-dvh place-items-center p-5">Guest pass not found.</main>;
  const counts = [
    ["Group size", pass.totalCount], ["Remaining", pass.totalCount - pass.enteredCount],
    ["Inside", pass.insideCount], ["Checked out", Math.max(pass.enteredCount - pass.insideCount, 0)],
  ];
  return <main className="grid min-h-dvh place-items-center p-3 sm:p-6"><article className="ticket">
    <header className="feature-tile rounded-none px-5 py-6 sm:p-8"><div className="grooves" aria-hidden="true" />
      <p className="text-sm font-semibold">Guest pass · {event.name}</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{pass.primaryName}</h1>
    </header>
    <div className="px-5 py-6"><QRCodeSVG aria-label="Guest pass QR code" className="public-qr" value={pass.code} size={256} marginSize={4} level="M" />
      <p className="mt-3 text-center font-mono text-xs break-all text-muted-foreground">{pass.code}</p></div>
    <div className="ticket-tear space-y-5 p-5 sm:p-6">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{counts.map(([label, value]) => <div key={label}>
        <dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-2xl font-semibold tabular-nums">{value}</dd></div>)}</dl>
      <section className="whitespace-pre-wrap break-words rounded-xl bg-secondary p-4 text-sm">{eventInvitation(event)}</section>
      {event.mapUrl && <a href={event.mapUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 font-semibold text-primary-foreground">Open event map</a>}
    </div>
  </article></main>;
}
