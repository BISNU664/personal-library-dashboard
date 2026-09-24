import { useEffect, useState } from "react";
import {
  errorMessage,
  fetchCurrentUser,
  logOut,
  logOutEverywhere,
  setUnauthorizedHandler,
  type User,
} from "./api";
import { useTheme } from "./hooks/useTheme";
import App from "./App";
import Landing from "./pages/Landing";

type Status = "loading" | "ready" | "offline";

/** Logged-out visitors see the landing page; readers see their library. */
function Root() {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // If the session ends mid-visit (expired, or logged out elsewhere),
    // any API call returns 401 and we drop back to the landing page.
    setUnauthorizedHandler(() => setUser(null));

    fetchCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
        setStatus("ready");
      })
      .catch(() => setStatus("offline"));
  }, [attempt]);

  const handleLogOut = async (everywhere: boolean) => {
    try {
      await (everywhere ? logOutEverywhere() : logOut());
    } catch (err) {
      // Still leave the app locally; the cookie is cleared server-side on success.
      console.warn(errorMessage(err));
    }
    setUser(null);
  };

  if (status === "loading") {
    return <div className="app-loading" aria-label="Loading" />;
  }

  if (status === "offline") {
    return (
      <main className="app-offline">
        <h1>Can't reach the server</h1>
        <p>Make sure the backend is running, then try again.</p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setStatus("loading");
            setAttempt((n) => n + 1);
          }}
        >
          Try again
        </button>
      </main>
    );
  }

  if (!user) {
    return <Landing theme={theme} onToggleTheme={toggleTheme} onAuthenticated={setUser} />;
  }

  // Keyed by user so switching accounts starts from a clean slate.
  return (
    <App
      key={user.id}
      user={user}
      theme={theme}
      onToggleTheme={toggleTheme}
      onLogOut={() => handleLogOut(false)}
      onLogOutEverywhere={() => handleLogOut(true)}
      onUserUpdated={setUser}
    />
  );
}

export default Root;
