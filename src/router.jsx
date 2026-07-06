import { createBrowserRouter } from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import Hosts from "./pages/Hosts";
import Events from "./pages/Events";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Events />, // Temporary until auth is built
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/admin",
    element: <AdminDashboard />,
  },
  {
    path: "/events",
    element: <Events />,
  },
  {
    path: "/hosts",
    element: <Hosts />,
  },
]);

export default router;