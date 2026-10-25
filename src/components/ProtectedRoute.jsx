import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import Layout from "./Layout";

function ProtectedRoute() {
  const { user } = useApp();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout />;
}

export default ProtectedRoute;
