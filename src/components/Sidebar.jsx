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
import { canAccessRoute, ROLES } from "../lib/roles";

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 w-full p-4 rounded-xl font-medium transition ${
    isActive ? "bg-blue-600 text-white" : "hover:bg-gray-100 text-gray-700"
  }`;

function Sidebar() {
  const { user, logout } = useApp();
  const allLinks = [
    { to: "/admin", label: "Overview", icon: FiHome },
    { to: "/events", label: "All Events", icon: FiCalendar },
    { to: "/my-event", label: "My Event", icon: FiCalendar },
    { to: "/hosts", label: "Hosts", icon: FiUsers },
    { to: "/my-passes", label: "My Guest Passes", icon: FiUsers },
    { to: "/supervisor", label: "Gate Overview", icon: FiBarChart2 },
    { to: "/scanner", label: "Scanner", icon: FiCamera },
    { to: "/live", label: "Live Stats", icon: FiBarChart2 },
    { to: "/settings", label: "Settings & Audit", icon: FiSettings },
  ];
  const links = allLinks.filter(({ to }) => canAccessRoute(user?.role, to, user?.eventId));
  const visibleLinks = user?.role === ROLES.SUPERHOST ? links.filter(({ to }) => to !== "/events") : links;

  return (
    <div className="w-72 h-screen sticky top-0 bg-white border-r flex flex-col">
      <div className="p-8 border-b">
        <h1 className="text-3xl font-bold text-blue-600">EntryFlow</h1>
        <p className="text-gray-500 mt-1">Event Entry System</p>
      </div>

      <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="border-t p-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <FiUser />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{user?.name ?? "Admin"}</p>
            <p className="text-sm text-gray-500">{user?.role ?? ""}</p>
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
