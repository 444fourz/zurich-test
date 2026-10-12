import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const commonLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/apply", label: "Apply" },
  { to: "/applications", label: "My applications" },
  { to: "/referrals", label: "Referrals" },
];

const guestLinks = [
  { to: "/login", label: "Log in" },
  { to: "/register", label: "Register" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links: { to: string; label: string; end?: boolean }[] = user
    ? commonLinks
    : [...commonLinks, ...guestLinks];

  async function handleLogout() {
    await logout();
    navigate("/");
  }

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

          {user && (
            <>
              <span>{user.fullName}</span>
              <button type="button" className="button-link" onClick={handleLogout}>
                Log out
              </button>
            </>
          )}
        </nav>
      </header>

      <Outlet />

      <footer className="site-footer">
        Prototype only. Do not enter real personal or health data.
      </footer>
    </>
  );
}
