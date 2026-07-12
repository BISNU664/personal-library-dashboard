interface NavbarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

function Navbar({ activePage, setActivePage }: NavbarProps) {
  return (
    <header className="navbar">
      <div>
        <h1>Personal Library</h1>
        <p>Track your books, progress, and reading goals.</p>
      </div>

      <nav>
        <button
          className={activePage === "Dashboard" ? "active" : ""}
          onClick={() => setActivePage("Dashboard")}
        >
          Dashboard
        </button>

        <button
          className={activePage === "Library" ? "active" : ""}
          onClick={() => setActivePage("Library")}
        >
          Library
        </button>

        <button
          className={activePage === "Analytics" ? "active" : ""}
          onClick={() => setActivePage("Analytics")}
        >
          Analytics
        </button>
      </nav>
    </header>
  );
}

export default Navbar;