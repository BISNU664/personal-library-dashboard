import { useState, type SubmitEvent } from "react";
import {
  continueAsGuest,
  errorMessage,
  logIn,
  signUp,
  upgradeGuest,
  type User,
} from "../api";

type Mode = "signup" | "login";

const MIN_PASSWORD_LENGTH = 8;

interface AuthFormProps {
  onAuthenticated: (user: User) => void;
  /** Guest turning into a full account: sign-up fields only, no tabs or guest option. */
  isUpgrade?: boolean;
}

/** Create-account and log-in form, switchable with tabs. */
function AuthForm({ onAuthenticated, isUpgrade = false }: AuthFormProps) {
  const [mode, setMode] = useState<Mode>("signup");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSignUp = mode === "signup";

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const details = { display_name: displayName, email, password };
      const user = isUpgrade
        ? await upgradeGuest(details)
        : isSignUp
          ? await signUp(details)
          : await logIn({ email, password });
      onAuthenticated(user);
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      onAuthenticated(await continueAsGuest());
    } catch (err) {
      setError(errorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isUpgrade ? "auth-card auth-card-plain" : "auth-card"}>
      {!isUpgrade && (
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={isSignUp}
            className={isSignUp ? "active" : ""}
            onClick={() => switchMode("signup")}
          >
            Create account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={!isSignUp}
            className={!isSignUp ? "active" : ""}
            onClick={() => switchMode("login")}
          >
            Log in
          </button>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignUp && (
          <label className="form-field">
            <span>Your name</span>
            <input
              type="text"
              required
              maxLength={40}
              autoComplete="nickname"
              placeholder="Shown on your reviews"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </label>
        )}

        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Password</span>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={isSignUp ? MIN_PASSWORD_LENGTH : undefined}
              maxLength={128}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="text-button"
              onClick={() => setShowPassword((shown) => !shown)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {isSignUp && (
            <small className="field-hint">
              At least {MIN_PASSWORD_LENGTH} characters.
            </small>
          )}
        </label>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting
            ? isSignUp
              ? "Creating account…"
              : "Logging in…"
            : isSignUp
              ? "Create account"
              : "Log in"}
        </button>
      </form>

      {!isUpgrade && (
        <div className="auth-guest">
          <span>or</span>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleGuest}
            disabled={isSubmitting}
          >
            Continue as guest
          </button>
        </div>
      )}
    </div>
  );
}

export default AuthForm;
