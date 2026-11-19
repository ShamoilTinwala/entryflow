import { DemoProvider } from "./DemoProvider";
import { HostedProvider } from "./HostedProvider";
export { useApp } from "./store"; // eslint-disable-line react-refresh/only-export-components
export const AppProvider = import.meta.env.DEV && import.meta.env.VITE_HOSTED !== "true" ? DemoProvider : HostedProvider;
