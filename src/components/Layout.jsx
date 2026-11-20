import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

const titles = {
  "/admin": "Overview", "/events": "Events", "/hosts": "Hosts", "/scanner": "Gate scanner",
  "/live": "Live stats", "/settings": "Settings & audit", "/my-event": "My event",
  "/my-passes": "My guest passes", "/supervisor": "Gate overview",
};

export default function Layout() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? (pathname.startsWith("/hosts/") ? "Host passes" : "Event details");
  return <div className="app-shell flex min-h-dvh flex-col md:flex-row">
    <Sidebar />
    <div className="workspace min-w-0 flex-1">
      <h1 className="page-heading">{title}</h1>
      <main><Outlet /></main>
    </div>
  </div>;
}
