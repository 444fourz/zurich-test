import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Home", end: true },
  { to: "/apply", label: "Apply" },
  { to: "/applications", label: "My applications" },
  { to: "/referrals", label: "Referrals" },
  { to: "/login", label: "Log in" },
  { to: "/register", label: "Register" },
];

export default function Layout() {
  return (
    <>
      <header className="site-header">
        <span className="brand">Health Insurance Underwriting</span>
        <nav className="site-nav" aria-label="Main">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />

      <footer className="site-footer">
        Prototype only. Do not enter real personal or health data.
      </footer>
    </>
  );
}
