import { useApp } from "../context/AppContext";

function Settings() {
  const { user, audit, allEvents } = useApp();
  const eventName = (eventId) => allEvents.find((event) => event.id === eventId)?.name ?? "All events";
  return <div className="space-y-6">
    <section className="rounded-2xl bg-white p-6 shadow"><h3 className="text-lg font-semibold">Global Admin account</h3><p className="mt-2">Name: {user?.name}</p><p>Email: {user?.email}</p><p>Role: {user?.role}</p><p className="mt-3 text-sm text-amber-700">This prototype stores event records in this browser. Login passwords are not verified; use a backend identity service before production.</p></section>
    <section className="rounded-2xl bg-white p-6 shadow"><div className="mb-4"><h3 className="text-lg font-semibold">All user activity</h3><p className="text-sm text-gray-500">Audit entries are retained with event records, including deleted events.</p></div>{audit.length === 0 ? <p className="text-gray-500">No activity has been recorded yet.</p> : <div className="max-h-[65vh] space-y-3 overflow-auto">{[...audit].reverse().map((item) => <article key={item.id} className="rounded-xl border p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">{item.action.replaceAll("-", " ")}</p><time className="text-sm text-gray-500">{new Date(item.createdAt).toLocaleString()}</time></div><p className="mt-1 text-sm text-gray-600">{item.actorName} · {item.actorRole} · {eventName(item.eventId)} · {item.target}</p>{Object.keys(item.details ?? {}).length > 0 && <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs text-gray-600">{JSON.stringify(item.details, null, 2)}</pre>}</article>)}</div>}</section>
  </div>;
}
export default Settings;
