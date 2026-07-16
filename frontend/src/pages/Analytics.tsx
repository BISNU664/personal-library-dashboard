import { useState } from "react";

import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Bar,
  BarChart,
} from "recharts";



import type { Book } from "../types/book";

interface AnalyticsProps {
  books: Book[];
}

function Analytics({ books }: AnalyticsProps) {
  const totalBooks = books.length;

  const completedBooks = books.filter(
    (book) => book.status === "Completed"
  ).length;

  const readingBooks = books.filter(
    (book) => book.status === "Reading"
  ).length;

  const toReadBooks = books.filter(
    (book) => book.status === "To Read"
  ).length;

  const totalPages = books.reduce(
    (total, book) => total + book.pages,
    0
  );

  const averageRating =
    books.length > 0
      ? (
          books.reduce(
            (total, book) => total + book.rating,
            0
          ) / books.length
        ).toFixed(1)
      : "0.0";

  const statusData = [
    { name: "Completed", value: completedBooks },
    { name: "Reading", value: readingBooks },
    { name: "To Read", value: toReadBooks },
  ];

  const visibleStatusData = statusData.filter(
    (item) => item.value > 0
  );

  const COLORS = ["#16a34a", "#2563eb", "#f59e0b"];

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

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);    

const monthlyData = monthNames.map((month, index) => {
  const started = books.filter((book) => {
    if (!book.started_at) return false;

    const date = new Date(book.started_at);

    return (
      date.getFullYear() === selectedYear &&
      date.getMonth() === index
    );
  }).length;

  const completed = books.filter((book) => {
    if (!book.completed_at) return false;

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

const ratingData = Array.from({ length: 7 }, (_, rating) => ({
  rating: `${rating} stars`,
  books: books.filter((book) => book.rating === rating).length,
}));


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
        <h3>Reading Status</h3>

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
                    fill={COLORS[index]}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

    <div className="analytics-chart-card">
    <h3>Monthly Reading Activity</h3>

    <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
    >
        <option value={currentYear}>{currentYear}</option>
        <option value={currentYear - 1}>{currentYear - 1}</option>
    </select>

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
  <h3>Rating Distribution</h3>

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