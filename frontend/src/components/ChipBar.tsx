interface ChipBarProps<T extends string> {
  options: readonly T[];
  active: T;
  onSelect: (option: T) => void;
  label: string;
}

/** A row of Pinterest-style filter tabs. */
function ChipBar<T extends string>({
  options,
  active,
  onSelect,
  label,
}: ChipBarProps<T>) {
  return (
    <div className="chip-bar" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`chip ${option === active ? "active" : ""}`}
          aria-pressed={option === active}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default ChipBar;
