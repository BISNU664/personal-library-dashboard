import type { Theme } from "../hooks/useTheme";
import {
  ChartIcon,
  HomeIcon,
  LibraryIcon,
  LogoIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
} from "./Icons";

export type Page = "Home" | "Library" | "Analytics";

const NAV_ITEMS = [
  { page: "Home", Icon: HomeIcon },
  { page: "Library", Icon: LibraryIcon },
  { page: "Analytics", Icon: ChartIcon },
] as const;

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  onAddBook: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

function Sidebar({
  activePage,
  onNavigate,
  onAddBook,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const nextTheme = theme === "dark" ? "Light" : "Dark";

  return (
    <aside className="sidebar">
      <button
        type="button"
        className="sidebar-logo"
        onClick={() => onNavigate("Home")}
        aria-label="Personal Library home"
      >
        <LogoIcon />
      </button>

      <nav className="sidebar-nav" aria-label="Main">
        {NAV_ITEMS.map(({ page, Icon }) => (
          <button
            key={page}
            type="button"
            className={`sidebar-button ${activePage === page ? "active" : ""}`}
            aria-label={page}
            aria-current={activePage === page ? "page" : undefined}
            data-tooltip={page}
            onClick={() => onNavigate(page)}
          >
            <Icon />
          </button>
        ))}

        <button
          type="button"
          className="sidebar-button"
          aria-label="Add book"
          data-tooltip="Add book"
          onClick={onAddBook}
        >
          <PlusIcon />
        </button>
      </nav>

      <button
        type="button"
        className="sidebar-button theme-toggle"
        aria-label={`Switch to ${nextTheme.toLowerCase()} mode`}
        data-tooltip={`${nextTheme} mode`}
        onClick={onToggleTheme}
      >
        {theme === "dark" ? <SunIcon /> : <MoonIcon />}
      </button>
    </aside>
  );
}

export default Sidebar;
