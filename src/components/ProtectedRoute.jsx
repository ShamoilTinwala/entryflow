import { Navigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { canAccessRoute, homeForRole } from "../lib/roles";
import Layout from "./Layout";

function ProtectedRoute() {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

export default ProtectedRoute;

export function RoleRoute({ children }) {
  const { user, hosts } = useApp();
  const location = useLocation();
  const hostRoute = location.pathname.match(/^\/hosts\/(\d+)/);
  const routeHost = hostRoute ? hosts.find((host) => host.id === Number(hostRoute[1])) : null;
  const hostIsInScope = user?.role !== "Superhost" || !hostRoute || Number(routeHost?.eventId) === Number(user?.eventId);

  if (!canAccessRoute(user?.role, location.pathname, user?.eventId) || !hostIsInScope) {
    return <Navigate to={homeForRole(user?.role, user?.eventId)} replace />;
  }

  return children;
}
