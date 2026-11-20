import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider } from "./context/AppContext";
import router from "./router";

function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
      <Toaster theme="dark" position="top-right" />
    </AppProvider>
  );
}

export default App;
