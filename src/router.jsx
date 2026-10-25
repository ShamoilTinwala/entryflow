import { Navigate, createBrowserRouter } from "react-router-dom";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Hosts from "./pages/Hosts";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import HostDetail from "./pages/HostDetail";
import Scanner from "./pages/Scanner";
import LiveStats from "./pages/LiveStats";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/", element: <Navigate to="/admin" replace /> },
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/events", element: <Events /> },
      { path: "/events/:id", element: <EventDetail /> },
      { path: "/hosts", element: <Hosts /> },
      { path: "/hosts/:id", element: <HostDetail /> },
      { path: "/scanner", element: <Scanner /> },
      { path: "/live", element: <LiveStats /> },
      { path: "/settings", element: <Settings /> },
    ],
  },
]);

export default router;
