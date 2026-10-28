import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { homeForRole } from "../lib/roles";

export function HomeRedirect() {
  const { user } = useApp();
  return <Navigate to={homeForRole(user?.role, user?.eventId)} replace />;
}
