import { useApp } from "../context/AppContext";

function Settings() {
  const { user, logout, resetDemoData } = useApp();

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-2xl shadow p-6 space-y-2">
        <h3 className="text-lg font-semibold">Account</h3>
        <p>Name: {user?.name}</p>
        <p>Email: {user?.email}</p>
        <p>Role: {user?.role}</p>
      </div>

      <div className="bg-white rounded-2xl shadow p-6 space-y-3">
        <h3 className="text-lg font-semibold">Demo data</h3>
        <p className="text-sm text-gray-500">
          Events, hosts, guests, and scans are stored in this browser only. There
          is no server yet.
        </p>
        <button
          type="button"
          onClick={resetDemoData}
          className="border rounded-xl px-4 py-3"
        >
          Reset demo data
        </button>
      </div>

      <button
        type="button"
        onClick={logout}
        className="bg-red-600 text-white rounded-xl px-5 py-3"
      >
        Sign out
      </button>
    </div>
  );
}

export default Settings;
