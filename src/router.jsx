import { createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Hosts from "./pages/Hosts";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import HostDetail from "./pages/HostDetail";
import Scanner from "./pages/Scanner";
import LiveStats from "./pages/LiveStats";
import Settings from "./pages/Settings";
import HostPasses from "./pages/HostPasses";
import Supervisor from "./pages/Supervisor";
import { HomeRedirect } from "./pages/RouteRedirects";
import ProtectedRoute, { RoleRoute } from "./components/ProtectedRoute";
import InviteClaim from "./pages/InviteClaim";
import PublicEventInvitation from "./pages/PublicEventInvitation";
import PublicPass from "./pages/PublicPass";

function withRoleAccess(element) {
  return <RoleRoute>{element}</RoleRoute>;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  { path: "/invite/:token", element: <InviteClaim /> },
  { path: "/event-invitation/:id", element: <PublicEventInvitation /> },
  { path: "/pass/:code", element: <PublicPass /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <HomeRedirect /> },
      { path: "/my-event", element: withRoleAccess(<EventDetail />) },
      { path: "/my-passes", element: withRoleAccess(<HostPasses />) },
      { path: "/supervisor", element: withRoleAccess(<Supervisor />) },
      { path: "/admin", element: withRoleAccess(<AdminDashboard />) },
      { path: "/events", element: withRoleAccess(<Events />) },
      { path: "/events/:id", element: withRoleAccess(<EventDetail />) },
      { path: "/hosts", element: withRoleAccess(<Hosts />) },
      { path: "/hosts/:id", element: withRoleAccess(<HostDetail />) },
      { path: "/scanner", element: withRoleAccess(<Scanner />) },
      { path: "/live", element: withRoleAccess(<LiveStats />) },
      { path: "/settings", element: withRoleAccess(<Settings />) },
    ],
  },
]);

export default router;
