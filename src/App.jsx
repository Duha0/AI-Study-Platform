import { useEffect, useState } from "react";
import "./App.css";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";

/* ---------------------------------------------------------------------------
   Sample subjects
   Lives here, not in a page file, because both Dashboard (a short preview)
   and Subjects (the full list) need to read and add to the same list.
   --------------------------------------------------------------------------- */

const initialSubjects = [
  {
    id: 1,
    name: "Organic Chemistry",
    initial: "O",
    color: "#2E6B4F",
    materialCount: 24,
    progress: 68,
    lastOpened: "Opened yesterday",
  },
  {
    id: 2,
    name: "Linear Algebra",
    initial: "L",
    color: "#7A5AA6",
    materialCount: 18,
    progress: 41,
    lastOpened: "Opened 3 days ago",
  },
  {
    id: 3,
    name: "World History",
    initial: "W",
    color: "#C08A2E",
    materialCount: 11,
    progress: 15,
    lastOpened: "Opened last week",
  },
];

const navItems = [
  { name: "Dashboard", icon: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" },
  { name: "Subjects", icon: "M4 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4v13h4z" },
  { name: "Progress", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
];

/* ---------------------------------------------------------------------------
   Theme helpers — unchanged from before.
   localStorage can throw in some private-browsing modes, so both reads and
   writes are wrapped. If anything fails we just fall back to light mode.
   --------------------------------------------------------------------------- */

const THEME_KEY = "studyai-theme";

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch (error) {
    // Ignore and use the default.
  }
  return "light"; // Light mode is the default.
}

function saveTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    // Ignore — the theme still works for this session.
  }
}

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

function Sidebar({ active, onNavigate, theme, onToggleTheme }) {
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
          <div className="sidebar-avatar">AM</div>
          <div>
            <p className="sidebar-user">Amara M.</p>
            <p className="sidebar-plan">Free plan</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------------------
   The app shell
   --------------------------------------------------------------------------- */

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [theme, setTheme] = useState(getSavedTheme);
  const [subjects, setSubjects] = useState(initialSubjects);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  function handleAddSubject(newSubject) {
    setSubjects((current) => [...current, newSubject]);
  }

  function handleDashboardCreateClick() {
    // The Dashboard's button stays a placeholder — the modal is only wired
    // up on the Subjects page for this task.
    alert("Head to Subjects to create one — that's where the form lives.");
  }

  return (
    <div className="app">
      <Sidebar
        active={activePage}
        onNavigate={setActivePage}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="main">
        {activePage === "Dashboard" && (
          <Dashboard subjects={subjects} onCreateSubject={handleDashboardCreateClick} />
        )}

        {activePage === "Subjects" && (
          <Subjects subjects={subjects} onAddSubject={handleAddSubject} />
        )}

        {activePage === "Progress" && (
          <p className="coming-soon">Progress tracking is coming soon.</p>
        )}
      </main>
    </div>
  );
}

export default App;
