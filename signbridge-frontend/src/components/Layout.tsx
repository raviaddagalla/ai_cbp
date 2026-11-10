// Layout.tsx
// The persistent app shell: fixed header + bottom navigation bar.
// Every page renders inside this Layout via React Router's <Outlet />.

import { NavLink, Outlet } from "react-router-dom";
import { Home, Camera, BookOpen, History } from "lucide-react";

const NAV_LINKS = [
  { to: "/",           label: "Home",       Icon: Home,      exact: true  },
  { to: "/dictionary", label: "Dictionary", Icon: BookOpen,  exact: false },
  { to: "/history",    label: "History",    Icon: History,   exact: false },
];

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface text-on-surface antialiased">

      {/* ── Fixed Header ── */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 flex items-center justify-between gap-2">

          {/* Brand */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl select-none">🤟</span>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-manrope font-bold text-[18px] leading-6 text-primary tracking-tight truncate">
                  SignBridge
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
                  ISL AI
                </span>
              </div>
              <span className="text-[11px] text-on-surface-variant leading-none">
                Indian Sign Language Recognition
              </span>
            </div>
          </div>

          {/* Model status dot */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-[11px] text-on-surface-variant flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container animate-pulse" />
            <span className="hidden sm:inline">AI Ready</span>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <main className="flex-1 flex flex-col w-full pt-16 pb-24 min-h-0">
        <Outlet />
      </main>

      {/* ── Fixed Bottom Navigation ── */}
      <nav className="fixed bottom-0 w-full z-50 pb-safe bg-surface-container-lowest/95 backdrop-blur-xl shadow-[0_-4px_16px_-2px_rgba(15,23,42,0.06)]">
        <div className="flex justify-around items-center h-16 px-1">

          {/* Regular nav links */}
          {NAV_LINKS.map(({ to, label, Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-16 h-12 gap-0.5 transition-colors focus:outline-none ${
                  isActive
                    ? "text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                  <span
                    className={`text-[11px] leading-none ${
                      isActive ? "font-bold" : "font-medium"
                    }`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Elevated centre Translate FAB */}
          <NavLink
            to="/translate"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center relative -top-3 w-16 h-16 rounded-full shadow-lg transition-all active:scale-95 focus:outline-none ${
                isActive
                  ? "bg-primary-container text-on-primary-container shadow-primary/40"
                  : "bg-primary text-on-primary shadow-primary/25 hover:bg-primary-container"
              }`
            }
          >
            <Camera size={26} strokeWidth={2} />
            <span className="text-[10px] font-semibold tracking-tight mt-0.5">
              Translate
            </span>
          </NavLink>

        </div>
      </nav>
    </div>
  );
}

