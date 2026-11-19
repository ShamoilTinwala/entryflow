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
  `flex items-center gap-2 whitespace-nowrap p-2 md:w-full md:p-4 rounded-xl font-medium transition ${
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
    <div className="flex flex-wrap items-center border-b bg-white md:sticky md:top-0 md:h-screen md:w-72 md:shrink-0 md:flex-col md:flex-nowrap md:items-stretch md:border-r">
      <div className="p-3 md:border-b md:p-8">
        <h1 className="text-lg font-bold md:text-3xl text-blue-600">EntryFlow</h1>
        <p className="hidden text-gray-500 mt-1 md:block">Event Entry System</p>
      </div>

      <div className="order-last flex w-full gap-2 overflow-x-auto px-2 py-1 md:order-none md:block md:flex-1 md:space-y-2 md:overflow-y-auto md:px-4 md:py-6">
        {visibleLinks.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="ml-auto px-3 md:ml-0 md:border-t md:p-5">
        <div className="hidden items-center gap-3 md:flex">
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
          className="flex items-center md:mt-4 gap-2 text-sm text-gray-600 hover:text-red-600"
        >
          <FiLogOut />
          Sign out
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
