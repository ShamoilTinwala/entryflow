import { createContext, useContext } from "react";
export const AppContext = createContext(null);
export function useApp() {
  const app = useContext(AppContext);
  if (!app) throw new Error("EntryFlow provider missing");
  return app;
}
