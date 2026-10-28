export const ROLES = {
  GLOBAL_ADMIN: "Global Admin",
  SUPERHOST: "Superhost",
  HOST: "Host",
  SUPERVISOR: "Supervisor",
  GATE_SCANNER: "Gate Scanner",
};

export const ROLE_OPTIONS = Object.values(ROLES);

const ROLE_ROUTES = {
  [ROLES.GLOBAL_ADMIN]: ["/admin", "/events", "/hosts", "/scanner", "/supervisor", "/live", "/settings"],
  [ROLES.SUPERHOST]: ["/my-event", "/events/", "/hosts", "/supervisor", "/live", "/scanner"],
  [ROLES.HOST]: ["/my-passes"],
  [ROLES.SUPERVISOR]: ["/supervisor"],
  [ROLES.GATE_SCANNER]: ["/scanner"],
};

export function canAccessRoute(role, pathname, assignedEventId) {
  const allowedRoutes = ROLE_ROUTES[role] ?? [];
  const allowed = allowedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route.endsWith("/") ? route : `${route}/`),
  );
  if (!allowed) return false;
  if ([ROLES.SUPERHOST, ROLES.HOST, ROLES.SUPERVISOR, ROLES.GATE_SCANNER].includes(role)) {
    const eventRoute = pathname.match(/^\/events\/(\d+)/);
    if (eventRoute && Number(eventRoute[1]) !== Number(assignedEventId)) return false;
  }
  return true;
}

export function homeForRole(role, eventId) {
  if (role === ROLES.GLOBAL_ADMIN) return "/admin";
  if (role === ROLES.SUPERHOST) return eventId ? "/my-event" : "/events";
  if (role === ROLES.HOST) return "/my-passes";
  if (role === ROLES.SUPERVISOR) return "/supervisor";
  return "/scanner";
}
