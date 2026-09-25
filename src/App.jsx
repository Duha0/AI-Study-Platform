import { useEffect, useState } from "react";
import "./App.css";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";
import Progress from "./pages/Progress";
import Profile from "./pages/Profile";
import {
  readTheme,
  writeTheme,
  getToken,
  cacheUser,
  getCachedUser,
  clearAuth,
  getInitials,
} from "./lib/storage";
import { authApi, subjectsApi, ApiError } from "./lib/api";

const navItems = [
  { name: "Dashboard", icon: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" },
  { name: "Subjects", icon: "M4 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4v13h4z" },
  { name: "Progress", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
  {
    name: "Profile",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20c0-4.2 3.4-7 7.5-7s7.5 2.8 7.5 7",
  },
];

// The pages that require a real backend session. Guarded by deriving what to
// render from isLoggedIn — a logged-out visitor can never reach them (and
// with no token, no API data can be fetched either).
const PROTECTED_PAGES = ["Dashboard", "Subjects", "Progress", "Profile"];

/* ---------------------------------------------------------------------------
   Small building blocks used only in this file.
   --------------------------------------------------------------------------- */

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
      <span className="theme-toggle-label">
        {isDark ? "Light mode" : "Dark mode"}
      </span>
    </button>
  );
}

function Sidebar({ active, onNavigate, theme, onToggleTheme, onLogout, userName }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-mark">S</span>
        <span className="sidebar-name">StudyAI</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.name}
            type="button"
            className={
              item.name === active ? "nav-link nav-link-active" : "nav-link"
            }
            aria-current={item.name === active ? "page" : undefined}
            onClick={() => onNavigate(item.name)}
          >
            <svg
              className="nav-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={item.icon} />
            </svg>
            {item.name}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />

        <div className="sidebar-user-row">
          <div className="sidebar-avatar">{getInitials(userName)}</div>
          <div>
            <p className="sidebar-user">{userName || "Student"}</p>
            <p className="sidebar-plan">Free plan</p>
          </div>
        </div>

        <button type="button" className="sidebar-logout" onClick={onLogout}>
          Log Out
        </button>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------------
   The app shell
   --------------------------------------------------------------------------- */

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(getToken()));
  // What to render on first paint while the token is being validated:
  // logged-out users see Landing; logged-in users see the app skeleton.
  const [activePage, setActivePage] = useState(() =>
    getToken() ? "Dashboard" : "Landing"
  );
  const [theme, setTheme] = useState(readTheme);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [user, setUser] = useState(getCachedUser);
  const [isBooting, setIsBooting] = useState(() => Boolean(getToken()));
  const [bootError, setBootError] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeTheme(theme);
  }, [theme]);

  // Session restoration: validate the stored token against the backend and
  // load the user's real subjects. Without a valid token this skips quietly
  // and the visitor lands on the public pages.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!getToken()) {
        setIsBooting(false);
        return;
      }
      try {
        const me = await authApi.fetchMe();
        if (cancelled) return;
        setUser(me);
        cacheUser(me);
        const data = await subjectsApi.listSubjects();
        if (cancelled) return;
        setSubjects(data);
      } catch (error) {
        if (cancelled) return;
        if (!(error instanceof ApiError) || error.status !== 401) {
          // Server reachable but something else failed — show the app with
          // a retry banner rather than kicking the person out.
          setBootError(
            error instanceof Error ? error.message : "Could not load your data."
          );
        }
      } finally {
        if (!cancelled) setIsBooting(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  // Re-fetch subjects from the backend — the one source of truth.
  async function refreshSubjects() {
    const data = await subjectsApi.listSubjects();
    setSubjects(data);
    return data;
  }

  async function handleCreateSubject(name, description) {
    await subjectsApi.createSubject(name, description);
    await refreshSubjects();
  }

  async function handleDeleteSubject(subjectId) {
    await subjectsApi.deleteSubject(subjectId);
    setSelectedSubjectId((current) => (current === subjectId ? null : current));
    await refreshSubjects();
  }

  // The one navigation function for the whole app — sidebar (Dashboard /
  // Subjects / Progress / Profile) and the public pages alike.
  function handleNavigate(pageName) {
    setActivePage(pageName);
    setSelectedSubjectId(null);
  }

  // Called by Login success: session established, straight to Dashboard.
  function handleAuthenticated(token, authenticatedUser) {
    setTokenAndUser(token, authenticatedUser);
    handleNavigate("Dashboard");
  }

  // Called after Register: session established, but first-run personalization
  // (Onboarding) comes before the Dashboard.
  function handleRegistered(token, registeredUser) {
    setTokenAndUser(token, registeredUser);
    handleNavigate("Onboarding");
  }

  // Called when Onboarding completes: persist nothing here (the page already
  // updated the profile via the API) — just carry the fresh user and move on.
  function handleOnboarded(updatedUser) {
    setUser(updatedUser);
    cacheUser(updatedUser);
    handleNavigate("Dashboard");
  }

  function setTokenAndUser(token, authenticatedUser) {
    setUser(authenticatedUser);
    cacheUser(authenticatedUser);
    setIsLoggedIn(true);
    refreshSubjects().catch(() => {
      // Banner-less failure: the page-level error UI covers refetches.
    });
  }

  async function handleLogout() {
    // JWT is stateless — clearing the stored token client-side IS the logout.
    clearAuth();
    setIsLoggedIn(false);
    setUser(null);
    setSubjects([]);
    setSelectedSubjectId(null);
    handleNavigate("Landing");
  }

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId);

  // What should actually render: if the active page is a protected one but
  // there's no session, fall back to the Landing page. Plain derivation —
  // no effects, no cascading state — and the stored page is left untouched
  // so logging back in returns the user to where they were.
  const visiblePage =
    !isLoggedIn && PROTECTED_PAGES.includes(activePage) ? "Landing" : activePage;

  if (isBooting) {
    return (
      <div className="app-boot">
        <p>Signing you in…</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <>
        {visiblePage === "Register" ? (
          <Register
            onRegistered={handleRegistered}
            onNavigateLogin={() => handleNavigate("Login")}
          />
        ) : visiblePage === "Login" ? (
          <Login
            onLoginSuccess={handleAuthenticated}
            onNavigateRegister={() => handleNavigate("Register")}
          />
        ) : visiblePage === "Onboarding" ? (
          <Onboarding onComplete={handleOnboarded} />
        ) : (
          <Landing
            onGetStarted={() => handleNavigate("Register")}
            onLogIn={() => handleNavigate("Login")}
          />
        )}
      </>
    );
  }

  return (
    <div className="app">
      <Sidebar
        active={visiblePage}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
        userName={user?.full_name}
      />

      <main className="main">
        {bootError && (
          <div className="app-banner app-banner-error">
            <p>{bootError}</p>
            <button
              type="button"
              className="button-secondary"
              onClick={() => {
                setBootError(null);
                refreshSubjects().catch((error) =>
                  setBootError(error.message || "Could not load your data.")
                );
              }}
            >
              Try again
            </button>
          </div>
        )}

        {visiblePage === "Dashboard" && (
          <Dashboard
            subjects={subjects}
            onCreateSubject={handleCreateSubject}
            userName={user?.full_name}
            onNavigate={handleNavigate}
          />
        )}

        {visiblePage === "Subjects" &&
          (selectedSubject ? (
            <SubjectDetails
              subject={selectedSubject}
              onBack={() => setSelectedSubjectId(null)}
              onDataChanged={refreshSubjects}
              onNavigate={handleNavigate}
            />
          ) : (
            <Subjects
              subjects={subjects}
              onCreateSubject={handleCreateSubject}
              onSelectSubject={setSelectedSubjectId}
              onDeleteSubject={handleDeleteSubject}
            />
          ))}

        {/* A user who has just registered is logged in but lands on
            Onboarding first — it renders inside the app shell as the
            pre-Dashboard step. */}
        {visiblePage === "Onboarding" && <Onboarding onComplete={handleOnboarded} />}

        {visiblePage === "Progress" && <Progress onNavigate={handleNavigate} />}

        {visiblePage === "Profile" && (
          <Profile
            user={user}
            theme={theme}
            onSetTheme={setTheme}
            onLogout={handleLogout}
            onProfileUpdated={(updatedUser) => {
              setUser(updatedUser);
              cacheUser(updatedUser);
            }}
          />
        )}
      </main>
    </div>
  );
}

export default App;
