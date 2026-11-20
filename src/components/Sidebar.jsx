import { useRef } from "react";
import { FiActivity, FiBarChart2, FiCalendar, FiCamera, FiGrid, FiHome, FiLogOut, FiMoreHorizontal, FiSettings, FiUsers, FiX } from "react-icons/fi";
import { NavLink, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { canAccessRoute, ROLES } from "../lib/roles";

const links = [
  { to: "/admin", label: "Overview", icon: FiHome },
  { to: "/events", label: "Events", icon: FiCalendar },
  { to: "/my-event", label: "My event", icon: FiCalendar },
  { to: "/scanner", label: "Scanner", icon: FiCamera },
  { to: "/my-passes", label: "My passes", icon: FiGrid },
  { to: "/hosts", label: "Hosts", icon: FiUsers },
  { to: "/supervisor", label: "Gate overview", icon: FiActivity },
  { to: "/live", label: "Live stats", icon: FiBarChart2 },
  { to: "/settings", label: "Settings & audit", icon: FiSettings },
];

function NavItem({ item, mobile, onClick }) {
  const Icon = item.icon;
  return <NavLink to={item.to} className={mobile ? "mobile-tab" : "nav-item"} onClick={onClick}>
    <Icon aria-hidden="true" size={19} />{item.label}
  </NavLink>;
}

export default function Sidebar() {
  const { user, logout } = useApp();
  const { pathname } = useLocation();
  const menu = useRef(null);
  const visible = links.filter(item => canAccessRoute(user?.role, item.to, user?.eventId) && !(user.role === ROLES.SUPERHOST && item.to === "/events"));
  const tabs = visible.length > 4 ? visible.slice(0, 3) : visible;
  const extra = visible.slice(tabs.length);

  return <>
    <aside className="flex items-center justify-between border-b border-border bg-card px-4 py-2 md:sticky md:top-0 md:h-dvh md:w-56 md:shrink-0 md:flex-col md:items-stretch md:justify-start md:border-r md:border-b-0 md:px-3 md:py-6">
      <div className="brand md:px-3"><img src="/favicon.svg" alt="" />EntryFlow</div>
      <nav aria-label="Workspace" className="my-8 hidden flex-1 space-y-1 overflow-y-auto md:block">
        {visible.map(item => <NavItem item={item} key={item.to} />)}
      </nav>
      <div className="flex items-center gap-2 md:border-t md:pt-4">
        <div className="hidden h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-tile text-ink font-bold md:grid">{user?.name?.trim().charAt(0)}</div>
        <div className="min-w-0 flex-1"><p className="hidden truncate text-sm font-semibold md:block">{user?.name}</p><p className="text-xs text-muted-foreground">{user?.role}</p></div>
        <button aria-label="Sign out" title="Sign out" onClick={logout} className="grid size-11 place-items-center rounded-full text-muted-foreground hover:bg-secondary"><FiLogOut size={18} /></button>
      </div>
    </aside>
    {visible.length > 1 && <nav className="mobile-tabs" aria-label="Mobile navigation">
      {tabs.map(item => <NavItem item={item} key={item.to} mobile />)}
      {extra.length > 0 && <button className="mobile-tab" aria-haspopup="dialog" data-current={extra.some(item => pathname === item.to || pathname.startsWith(item.to + "/"))}
        onClick={() => menu.current?.showModal()}><FiMoreHorizontal size={20} />More</button>}
    </nav>}
    {extra.length > 0 && <dialog ref={menu} className="mobile-menu" aria-labelledby="menu-heading">
      <div className="mb-2 flex items-center justify-between"><h2 id="menu-heading" className="font-semibold">More pages</h2>
        <button aria-label="Close menu" className="grid size-11 place-items-center" onClick={() => menu.current.close()}><FiX /></button></div>
      {extra.map(item => <NavItem key={item.to} item={item} onClick={() => menu.current.close()} />)}
    </dialog>}
  </>;
}
