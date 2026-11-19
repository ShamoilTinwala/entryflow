import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const titles = {
  "/admin": "Admin Dashboard",
  "/events": "Events",
  "/hosts": "Hosts",
  "/scanner": "Scanner",
  "/live": "Live Stats",
  "/settings": "Settings",
  "/my-event": "My Event",
  "/my-passes": "My Guest Passes",
  "/supervisor": "Gate Overview",
};

function pageTitle(pathname) {
  if (pathname.startsWith("/events/") && pathname !== "/events") return "Event";
  if (pathname.startsWith("/hosts/") && pathname !== "/hosts") return "Host";
  return titles[pathname] ?? "EntryFlow";
}

function Layout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 md:flex-row">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <header className="bg-white border-b px-4 py-3 md:px-8 md:py-5">
          <h2 className="text-3xl font-bold text-gray-800">
            {pageTitle(pathname)}
          </h2>
        </header>

        <main className="p-3 sm:p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
