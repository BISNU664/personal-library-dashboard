interface ProgressBarProps {
  /** Percentage from 0 to 100. */
  value: number;
  label: string;
  size?: "small" | "large";
}

function ProgressBar({ value, label, size = "small" }: ProgressBarProps) {
  return (
    <div
      className={`progress-track progress-${size}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export default ProgressBar;
