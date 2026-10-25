import {
  FiHome,
  FiUsers,
  FiCamera,
  FiBarChart2,
  FiSettings,
  FiUser,
  FiCalendar,
  FiLogOut,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";
import { useApp } from "../context/AppContext";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 w-full p-4 rounded-xl font-medium transition ${
    isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"
  }`;

function Sidebar() {
  const { user, logout } = useApp();

  return (
    <div className="w-72 h-screen sticky top-0 bg-white border-r flex flex-col">
      <div className="p-8 border-b">
        <h1 className="text-3xl font-bold text-blue-600">EntryFlow</h1>
        <p className="text-gray-500 mt-1">Event Entry System</p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <NavLink to="/admin" className={linkClass}>
          <FiHome size={20} />
          Dashboard
        </NavLink>

        <NavLink to="/events" className={linkClass}>
          <FiCalendar size={20} />
          Events
        </NavLink>

        <NavLink to="/hosts" className={linkClass}>
          <FiUsers size={20} />
          Hosts
        </NavLink>

        <NavLink to="/scanner" className={linkClass}>
          <FiCamera size={20} />
          Scanner
        </NavLink>

        <NavLink to="/live" className={linkClass}>
          <FiBarChart2 size={20} />
          Live Stats
        </NavLink>

        <NavLink to="/settings" className={linkClass}>
          <FiSettings size={20} />
          Settings
        </NavLink>
      </div>

      <div className="border-t p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <FiUser />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.name ?? "Admin"}</p>
            <p className="text-sm text-gray-500">{user?.role ?? "Organizer"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-red-600"
        >
          <FiLogOut />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
