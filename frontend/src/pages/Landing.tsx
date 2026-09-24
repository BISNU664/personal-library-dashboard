import type { User } from "../api";
import type { Theme } from "../hooks/useTheme";
import AuthForm from "../components/AuthForm";
import { LogoIcon, MoonIcon, SunIcon } from "../components/Icons";

// A few covers for the collage beside the sign-up form.
const COLLAGE_COVERS = [
  "https://is1-ssl.mzstatic.com/image/thumb/Publication122/v4/a6/60/70/a6607071-6dde-70be-3d0a-93ecd1b13af8/9781101147160.d.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Publication1/v4/10/1f/b7/101fb78b-a06b-3427-8876-773ed9bc8351/9780345539793.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Publication211/v4/13/fb/63/13fb6355-fce2-0e4b-08b7-48452037759a/9780593135211.d.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Publication115/v4/0e/c2/f2/0ec2f2ee-2f8c-042f-4271-69d83a7c024a/9780143128809.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Publication1/v4/cb/c8/39/cbc8396d-a2d9-e05d-3090-f71d584000f1/9780345539823.jpg/600x600bb.jpg",
  "https://is1-ssl.mzstatic.com/image/thumb/Publication116/v4/69/8d/7e/698d7e41-a0a6-8a65-a83e-2b5125632ada/cover.jpg/600x600bb.jpg",
];

interface LandingProps {
  theme: Theme;
  onToggleTheme: () => void;
  onAuthenticated: (user: User) => void;
}

function Landing({ theme, onToggleTheme, onAuthenticated }: LandingProps) {
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="landing">
      <header className="landing-header">
        <span className="landing-brand">
          <LogoIcon />
          Personal Library
        </span>

        <button
          type="button"
          className="landing-theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <main className="landing-main">
        <section className="landing-pitch">
          <h1>Your next favourite book is waiting.</h1>
          <p>
            Track what you read, get picks tailored to your taste, and share
            reviews with other readers.
          </p>

          <AuthForm onAuthenticated={onAuthenticated} />
        </section>

        <div className="landing-collage" aria-hidden="true">
          {COLLAGE_COVERS.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>
      </main>
    </div>
  );
}

export default Landing;
