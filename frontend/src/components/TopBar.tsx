import { SearchIcon } from "./Icons";

interface TopBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
}

function TopBar({ search, onSearchChange, placeholder }: TopBarProps) {
  return (
    <header className="topbar">
      <label className="search-pill">
        <SearchIcon />
        <input
          type="search"
          placeholder={placeholder}
          aria-label={placeholder}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
    </header>
  );
}

export default TopBar;
