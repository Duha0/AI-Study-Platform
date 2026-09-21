import { useEffect, useState } from "react";
import "./App.css";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Subjects from "./pages/Subjects";
import SubjectDetails from "./pages/SubjectDetails";

/* ---------------------------------------------------------------------------
   Sample subjects
   Lives here, not in a page file, because both Dashboard (a short preview)
   and Subjects (the full list) need to read and add to the same list.

   Each subject now owns its own `materials` array (previously this was one
   shared static list defined inside SubjectDetails.jsx). Moving it here is
   what makes "Materials" a real, per-subject count instead of a separate
   number that could drift out of sync — the stat is just materials.length.
   --------------------------------------------------------------------------- */

function createSampleMaterials() {
  return [
    {
      id: 1,
      filename: "Lecture Notes - Week 1.pdf",
      fileType: "PDF",
      size: "1.2 MB",
      uploaded: "Uploaded 3 days ago",
      description:
        "An overview of the topics covered in the first week, including key definitions and diagrams.",
      status: "ready", // upload processing state — unrelated to completionStatus below
      completionStatus: "completed",
      quizScore: { correct: 4, total: 5 },
    },
    {
      id: 2,
      filename: "Chapter Summary.pdf",
      fileType: "PDF",
      size: "640 KB",
      uploaded: "Uploaded 5 days ago",
      description:
        "A condensed summary of the chapter's main ideas — useful for a quick review before a quiz.",
      status: "ready",
      completionStatus: "in-progress",
      quizScore: null,
    },
    {
      id: 3,
      filename: "Practice Problem Set.pdf",
      fileType: "PDF",
      size: "2.1 MB",
      uploaded: "Uploaded 1 week ago",
      description:
        "A set of practice problems with varying difficulty, for testing how well the material has landed.",
      status: "ready",
      completionStatus: "not-started",
      quizScore: null,
    },
  ];
}

const initialSubjects = [
  {
    id: 1,
    name: "Organic Chemistry",
    description: "Reactions, mechanisms, and the structure of carbon-based compounds.",
    initial: "O",
    color: "#2E6B4F",
    materials: createSampleMaterials(),
    quizzesCompleted: 9,
    lastOpened: "Opened yesterday",
  },
  {
    id: 2,
    name: "Linear Algebra",
    description: "Vectors, matrices, and linear transformations.",
    initial: "L",
    color: "#7A5AA6",
    materials: createSampleMaterials(),
    quizzesCompleted: 5,
    lastOpened: "Opened 3 days ago",
  },
  {
    id: 3,
    name: "World History",
    description: "Major events and turning points from ancient to modern times.",
    initial: "W",
    color: "#C08A2E",
    materials: createSampleMaterials(),
    quizzesCompleted: 2,
    lastOpened: "Opened last week",
  },
];

const navItems = [
  { name: "Dashboard", icon: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" },
  { name: "Subjects", icon: "M4 4h9a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4zM20 4h-4v13h4z" },
  { name: "Progress", icon: "M4 20V10M10 20V4M16 20v-7M22 20H2" },
];

// Colors are assigned to new subjects by cycling through this list, so each
// one gets a distinct identifying color the same way the sample subjects do.
// Lives here (not in a page file) because subject creation is now handled
// in one place and shared by both Dashboard and Subjects.
const CARD_COLORS = ["#2E6B4F", "#7A5AA6", "#C08A2E", "#3B7C99", "#B85C5C"];

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
   Login state — same wrapped-localStorage pattern as theme above. This is
   the only thing that gates which pages are reachable; the account data
   itself (name/email/password) and onboarding answers are read and written
   directly by the Register/Login/Onboarding pages, since App.jsx doesn't
   need them for anything.
   --------------------------------------------------------------------------- */

const LOGIN_KEY = "studyai-logged-in";

function getSavedLoginState() {
  try {
    return localStorage.getItem(LOGIN_KEY) === "true";
  } catch (error) {
    return false;
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

function Sidebar({ active, onNavigate, theme, onToggleTheme, onLogout }) {
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
  const [isLoggedIn, setIsLoggedIn] = useState(getSavedLoginState);
  // Logged-in visitors land on Dashboard; logged-out ones land on Landing.
  // Both read the same saved login state, so a refresh doesn't bounce a
  // logged-in person back out to the Landing page.
  const [activePage, setActivePage] = useState(() =>
    getSavedLoginState() ? "Dashboard" : "Landing"
  );
  const [theme, setTheme] = useState(getSavedTheme);
  const [subjects, setSubjects] = useState(initialSubjects);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    saveTheme(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme(theme === "light" ? "dark" : "light");
  }

  // Builds a full subject object from just a name and description, then
  // adds it to state. Both the Dashboard and Subjects page open the same
  // CreateSubjectModal and call this same function, so a subject created
  // from either place ends up identical.
  function handleCreateSubject(name, description) {
    const newSubject = {
      id: Date.now(), // good enough for local sample data
      name,
      description,
      initial: name.charAt(0).toUpperCase(),
      color: CARD_COLORS[subjects.length % CARD_COLORS.length],
      materials: [],
      quizzesCompleted: 0,
      lastOpened: "Just created",
    };

    setSubjects((current) => [...current, newSubject]);
  }

  function handleDeleteSubject(id) {
    setSubjects((current) => current.filter((subject) => subject.id !== id));

    // If the subject being removed is the one currently open in Subject
    // Details, drop back to the Subjects list instead of showing details
    // for a subject that no longer exists.
    setSelectedSubjectId((current) => (current === id ? null : current));
  }

  function handleAddMaterial(subjectId, newMaterial) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? { ...subject, materials: [...subject.materials, newMaterial] }
          : subject
      )
    );
  }

  function handleUpdateMaterialStatus(subjectId, materialId, newStatus) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              materials: subject.materials.map((material) =>
                material.id === materialId ? { ...material, status: newStatus } : material
              ),
            }
          : subject
      )
    );
  }

  // Opening a material can promote it from "not-started" to "in-progress" —
  // but only from "not-started". A material that's already "in-progress" or
  // "completed" should stay that way just from being reopened.
  function handleMarkMaterialInProgress(subjectId, materialId) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              materials: subject.materials.map((material) =>
                material.id === materialId && material.completionStatus === "not-started"
                  ? { ...material, completionStatus: "in-progress" }
                  : material
              ),
            }
          : subject
      )
    );
  }

  // Finishing a quiz records the score on the material itself (so it
  // survives switching between Summary/Quiz/Flashcards, since those are
  // unmounted when not the active tab) and marks the material Completed.
  function handleCompleteMaterialQuiz(subjectId, materialId, score) {
    setSubjects((current) =>
      current.map((subject) =>
        subject.id === subjectId
          ? {
              ...subject,
              materials: subject.materials.map((material) =>
                material.id === materialId
                  ? { ...material, quizScore: score, completionStatus: "completed" }
                  : material
              ),
            }
          : subject
      )
    );
  }

  // The one navigation function for the whole app — used for the sidebar
  // (Dashboard/Subjects/Progress) and for moving between the pre-login
  // pages (Landing/Register/Login/Onboarding). It always also leaves the
  // Subjects list rather than the details of whichever subject was open.
  function handleNavigate(pageName) {
    setActivePage(pageName);
    setSelectedSubjectId(null);
  }

  // Shared by both "ways in": a successful Login, and finishing Onboarding
  // right after Register. Either way, the person is now logged in and
  // lands on Dashboard.
  function handleAuthenticated() {
    setIsLoggedIn(true);
    try {
      localStorage.setItem(LOGIN_KEY, "true");
    } catch (error) {
      // The session still works even if this couldn't be saved — it just
      // won't be remembered across a refresh.
    }
    handleNavigate("Dashboard");
  }

  function handleLogout() {
    setIsLoggedIn(false);
    try {
      localStorage.removeItem(LOGIN_KEY);
    } catch (error) {
      // Not critical — isLoggedIn is already false for this session.
    }
    // subjects/materials state is untouched here on purpose — logging out
    // never clears what's been created.
    handleNavigate("Landing");
  }

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId);

  if (!isLoggedIn) {
    return (
      <>
        {activePage === "Register" ? (
          <Register
            onRegistered={() => handleNavigate("Onboarding")}
            onNavigateLogin={() => handleNavigate("Login")}
          />
        ) : activePage === "Login" ? (
          <Login
            onLoginSuccess={handleAuthenticated}
            onNavigateRegister={() => handleNavigate("Register")}
          />
        ) : activePage === "Onboarding" ? (
          <Onboarding onComplete={handleAuthenticated} />
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
        active={activePage}
        onNavigate={handleNavigate}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={handleLogout}
      />

      <main className="main">
        {activePage === "Dashboard" && (
          <Dashboard subjects={subjects} onCreateSubject={handleCreateSubject} />
        )}

        {activePage === "Subjects" &&
          (selectedSubject ? (
            <SubjectDetails
              subject={selectedSubject}
              onBack={() => setSelectedSubjectId(null)}
              onAddMaterial={handleAddMaterial}
              onUpdateMaterialStatus={handleUpdateMaterialStatus}
              onMarkMaterialInProgress={handleMarkMaterialInProgress}
              onCompleteMaterialQuiz={handleCompleteMaterialQuiz}
            />
          ) : (
            <Subjects
              subjects={subjects}
              onCreateSubject={handleCreateSubject}
              onSelectSubject={setSelectedSubjectId}
              onDeleteSubject={handleDeleteSubject}
            />
          ))}

        {activePage === "Progress" && (
          <p className="coming-soon">Progress tracking is coming soon.</p>
        )}
      </main>
    </div>
  );
}

export default App;