import {
  FiHome,
  FiUsers,
  FiCamera,
  FiBarChart2,
  FiSettings,
  FiUser,
} from "react-icons/fi";

import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-72 h-screen bg-white border-r flex flex-col">
      {/* Logo */}
      <div className="p-8 border-b">
        <h1 className="text-3xl font-bold text-blue-600">
          EntryFlow
        </h1>

        <p className="text-gray-500 mt-1">
          Event Entry System
        </p>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 space-y-2">

        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex items-center gap-3 w-full p-4 rounded-xl font-medium transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`
          }
        >
          <FiHome size={20} />
          Dashboard
        </NavLink>

        <NavLink
          to="/hosts"
          className={({ isActive }) =>
            `flex items-center gap-3 w-full p-4 rounded-xl font-medium transition ${
              isActive
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            }`
          }
        >
          <FiUsers size={20} />
          Hosts
        </NavLink>

        <button className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-gray-100">
          <FiCamera size={20} />
          Scanner
        </button>

        <button className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-gray-100">
          <FiBarChart2 size={20} />
          Live Stats
        </button>

        <button className="flex items-center gap-3 w-full p-4 rounded-xl hover:bg-gray-100">
          <FiSettings size={20} />
          Settings
        </button>

      </div>

      {/* User */}
      <div className="border-t p-5">
        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <FiUser />
          </div>

          <div>
            <p className="font-semibold">Admin</p>
            <p className="text-sm text-gray-500">
              Organizer
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Sidebar;