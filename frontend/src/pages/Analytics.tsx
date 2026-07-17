import { useMemo, useState } from "react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

import type { Book } from "../types/book";

interface AnalyticsProps {
  books: Book[];
  readingGoals: Record<number, number>;
  setReadingGoals: React.Dispatch<
    React.SetStateAction<Record<number, number>>
  >;
}

function Analytics({
  books,
  readingGoals,
  setReadingGoals,
}: AnalyticsProps) {
  const currentYear = new Date().getFullYear();

  const availableYears = useMemo(() => {
    const years = new Set<number>([currentYear]);

    books.forEach((book) => {
      if (book.started_at) {
        years.add(new Date(book.started_at).getFullYear());
      }

      if (book.completed_at) {
        years.add(new Date(book.completed_at).getFullYear());
      }
    });

    Object.keys(readingGoals).forEach((year) => {
      years.add(Number(year));
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [books, currentYear, readingGoals]);

  const [selectedYear, setSelectedYear] = useState(currentYear);

  const readingGoal = readingGoals[selectedYear] ?? 20;

  const getBookAnalyticsYear = (book: Book) => {
    if (book.completed_at) {
      return new Date(book.completed_at).getFullYear();
    }

    if (book.started_at) {
      return new Date(book.started_at).getFullYear();
    }

    // Books without dates are treated as current-year entries
    // so they are not hidden from the analytics page.
    return currentYear;
  };

  const booksForSelectedYear = useMemo(() => {
    return books.filter(
      (book) => getBookAnalyticsYear(book) === selectedYear
    );
  }, [books, selectedYear, currentYear]);

  const totalBooks = booksForSelectedYear.length;

  const completedBooks = booksForSelectedYear.filter(
    (book) => book.status === "Completed"
  ).length;

  const readingBooks = booksForSelectedYear.filter(
    (book) => book.status === "Reading"
  ).length;

  const toReadBooks = booksForSelectedYear.filter(
    (book) => book.status === "To Read"
  ).length;

  const totalPages = booksForSelectedYear.reduce(
    (total, book) => total + book.pages,
    0
  );

  const ratedBooks = booksForSelectedYear.filter(
    (book) => book.rating > 0
  );

  const averageRating =
    ratedBooks.length > 0
      ? (
          ratedBooks.reduce(
            (total, book) => total + book.rating,
            0
          ) / ratedBooks.length
        ).toFixed(1)
      : "0.0";

  const goalProgress =
    readingGoal > 0
      ? Math.min(
          Math.round((completedBooks / readingGoal) * 100),
          100
        )
      : 0;

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const monthlyData = monthNames.map((month, index) => {
    const started = books.filter((book) => {
      if (!book.started_at) {
        return false;
      }

      const date = new Date(book.started_at);

      return (
        date.getFullYear() === selectedYear &&
        date.getMonth() === index
      );
    }).length;

    const completed = books.filter((book) => {
      if (!book.completed_at) {
        return false;
      }

      const date = new Date(book.completed_at);

      return (
        date.getFullYear() === selectedYear &&
        date.getMonth() === index
      );
    }).length;

    return {
      month,
      started,
      completed,
    };
  });

  const statusData = [
    { name: "Completed", value: completedBooks },
    { name: "Reading", value: readingBooks },
    { name: "To Read", value: toReadBooks },
  ];

  const visibleStatusData = statusData.filter(
    (item) => item.value > 0
  );

  const ratingData = Array.from(
    { length: 7 },
    (_, rating) => ({
      rating: `${rating} stars`,
      books: booksForSelectedYear.filter(
        (book) => book.rating === rating
      ).length,
    })
  );

  const chartColours = [
    "#16a34a",
    "#2563eb",
    "#f59e0b",
  ];

  const handleGoalChange = (value: string) => {
    const nextGoal = Number(value);

    if (Number.isNaN(nextGoal)) {
      return;
    }

    setReadingGoals((previousGoals) => ({
      ...previousGoals,
      [selectedYear]: Math.max(1, nextGoal),
    }));
  };

  return (
    <main className="container">
      <div className="section-header">
        <div>
          <h2>Analytics</h2>
          <p className="section-subtitle">
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

            <div className="analytics-goal-value">
              {goalProgress}%
            </div>
          </div>

          <div
            className="goal-progress-track"
            role="progressbar"
            aria-label={`${selectedYear} reading goal progress`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={goalProgress}
          >
            <div
              className="goal-progress-fill"
              style={{ width: `${goalProgress}%` }}
            />
          </div>

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
                onChange={(event) =>
                  handleGoalChange(event.target.value)
                }
              />
            </label>
          </div>
        </section>

        <aside
          className="year-selector"
          aria-label="Analytics year"
        >
          {availableYears.map((year) => (
            <button
              key={year}
              type="button"
              className={
                selectedYear === year ? "active" : ""
              }
              onClick={() => setSelectedYear(year)}
            >
              {year}
            </button>
          ))}
        </aside>
      </div>

      <div className="analytics-grid">
        <div className="stat-card">
          <h3>Total Books</h3>
          <p>{totalBooks}</p>
        </div>

        <div className="stat-card">
          <h3>Completed</h3>
          <p>{completedBooks}</p>
        </div>

        <div className="stat-card">
          <h3>Reading</h3>
          <p>{readingBooks}</p>
        </div>

        <div className="stat-card">
          <h3>To Read</h3>
          <p>{toReadBooks}</p>
        </div>

        <div className="stat-card">
          <h3>Average Rating</h3>
          <p>{averageRating}/6</p>
        </div>

        <div className="stat-card">
          <h3>Total Pages</h3>
          <p>{totalPages}</p>
        </div>
      </div>

      <div className="analytics-chart-card">
        <h3>Reading Status — {selectedYear}</h3>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={visibleStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
              >
                {visibleStatusData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={
                      chartColours[
                        index % chartColours.length
                      ]
                    }
                  />
                ))}
              </Pie>

              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-chart-card">
        <div className="chart-header">
          <h3>Monthly Reading Activity</h3>
          <span>{selectedYear}</span>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />

              <Line
                type="monotone"
                dataKey="started"
                name="Books Started"
                stroke="#2563eb"
                strokeWidth={3}
              />

              <Line
                type="monotone"
                dataKey="completed"
                name="Books Completed"
                stroke="#16a34a"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="analytics-chart-card">
        <h3>Rating Distribution — {selectedYear}</h3>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis allowDecimals={false} />
              <Tooltip />

              <Bar
                dataKey="books"
                name="Books"
                fill="#2563eb"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}

export default Analytics;
