import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { BOOK_STATUSES, MAX_RATING, type Book, type BookStatus } from "../types/book";
import { countByStatus, getBookYear, percentage } from "../utils/books";
import ProgressBar from "../components/ProgressBar";
import StatCard from "../components/StatCard";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Matches the status colours in index.css.
const STATUS_COLOURS: Record<BookStatus, string> = {
  "To Read": "#f2b01e",
  Reading: "#4f8cff",
  Completed: "#2fbf5f",
};

// Tooltips use the theme variables from index.css; axes and gridlines are
// themed in App.css because SVG attributes can't read CSS variables.
const TOOLTIP_PROPS = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border-strong)",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(0, 0, 0, var(--shadow-strength))",
  },
  labelStyle: { color: "var(--text)", fontWeight: 600 },
  itemStyle: { color: "var(--text-soft)" },
  cursor: { fill: "rgba(128, 128, 128, 0.12)" },
};

function isInMonth(date: string | null, year: number, month: number) {
  if (!date) return false;

  const parsed = new Date(date);
  return parsed.getFullYear() === year && parsed.getMonth() === month;
}

interface AnalyticsProps {
  books: Book[];
  readingGoals: Record<number, number>;
  getGoal: (year: number) => number;
  setGoal: (year: number, goal: number) => void;
}

function Analytics({ books, readingGoals, getGoal, setGoal }: AnalyticsProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);

    books.forEach((book) => {
      if (book.started_at) years.add(new Date(book.started_at).getFullYear());
      if (book.completed_at) years.add(new Date(book.completed_at).getFullYear());
    });

    Object.keys(readingGoals).forEach((year) => years.add(Number(year)));

    return Array.from(years).sort((a, b) => b - a);
  }, [books, currentYear, readingGoals]);

  const booksForYear = useMemo(
    () => books.filter((book) => getBookYear(book) === selectedYear),
    [books, selectedYear]
  );

  const readingGoal = getGoal(selectedYear);
  const completedBooks = countByStatus(booksForYear, "Completed");
  const goalProgress = percentage(completedBooks, readingGoal);

  const totalPages = booksForYear.reduce((total, book) => total + book.pages, 0);

  const ratedBooks = booksForYear.filter((book) => book.rating > 0);
  const averageRating =
    ratedBooks.length > 0
      ? (
          ratedBooks.reduce((total, book) => total + book.rating, 0) /
          ratedBooks.length
        ).toFixed(1)
      : "0.0";

  const statusData = BOOK_STATUSES.map((status) => ({
    name: status,
    value: countByStatus(booksForYear, status),
    fill: STATUS_COLOURS[status],
  })).filter((item) => item.value > 0);

  const monthlyData = MONTH_NAMES.map((month, index) => ({
    month,
    started: books.filter((book) =>
      isInMonth(book.started_at, selectedYear, index)
    ).length,
    completed: books.filter((book) =>
      isInMonth(book.completed_at, selectedYear, index)
    ).length,
  }));

  const ratingData = Array.from({ length: MAX_RATING + 1 }, (_, rating) => ({
    rating: rating === 0 ? "Unrated" : `${rating}★`,
    books: booksForYear.filter((book) => book.rating === rating).length,
  }));

  const handleGoalChange = (value: string) => {
    const nextGoal = Number(value);

    if (Number.isNaN(nextGoal)) return;

    setGoal(selectedYear, Math.max(1, Math.round(nextGoal)));
  };

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="page-subtitle">
            View insights about your reading habits.
          </p>
        </div>
      </div>

      <div className="analytics-year-layout">
        <section className="analytics-goal-card">
          <div className="analytics-goal-header">
            <div>
              <h2>{selectedYear} Reading Goal</h2>
              <p>
                {completedBooks} of {readingGoal} books completed
              </p>
            </div>

            <div className="analytics-goal-value">{goalProgress}%</div>
          </div>

          <ProgressBar
            value={goalProgress}
            label={`${selectedYear} reading goal progress`}
            size="large"
          />

          <div className="analytics-goal-footer">
            <p className="goal-remaining">
              {Math.max(readingGoal - completedBooks, 0)} books remaining
            </p>

            <label className="analytics-goal-input">
              Goal
              <input
                type="number"
                min="1"
                value={readingGoal}
                onChange={(event) => handleGoalChange(event.target.value)}
              />
            </label>
          </div>
        </section>

        <nav className="year-selector" aria-label="Analytics year">
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              className={selectedYear === year ? "active" : ""}
              aria-pressed={selectedYear === year}
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </button>
          ))}
        </nav>
      </div>

      <div className="analytics-grid">
        <StatCard label="Total Books" value={booksForYear.length} />
        <StatCard label="Completed" value={completedBooks} />
        <StatCard label="Reading" value={countByStatus(booksForYear, "Reading")} />
        <StatCard label="To Read" value={countByStatus(booksForYear, "To Read")} />
        <StatCard label="Average Rating" value={`${averageRating}/${MAX_RATING}`} />
        <StatCard label="Total Pages" value={totalPages.toLocaleString()} />
      </div>

      <section className="analytics-chart-card">
        <div className="chart-header">
          <h3>Reading Status</h3>
          <span>{selectedYear}</span>
        </div>

        <div className="chart-container">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  stroke="none"
                />

                <Tooltip {...TOOLTIP_PROPS} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="chart-empty">No books for {selectedYear} yet.</p>
          )}
        </div>
      </section>

      <section className="analytics-chart-card">
        <div className="chart-header">
          <h3>Monthly Reading Activity</h3>
          <span>{selectedYear}</span>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Legend />

              <Line
                type="monotone"
                dataKey="started"
                name="Books Started"
                stroke={STATUS_COLOURS.Reading}
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="completed"
                name="Books Completed"
                stroke={STATUS_COLOURS.Completed}
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="analytics-chart-card">
        <div className="chart-header">
          <h3>Rating Distribution</h3>
          <span>{selectedYear}</span>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis allowDecimals={false} />
              <Tooltip {...TOOLTIP_PROPS} />

              <Bar
                dataKey="books"
                name="Books"
                fill={STATUS_COLOURS.Reading}
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </main>
  );
}

export default Analytics;
