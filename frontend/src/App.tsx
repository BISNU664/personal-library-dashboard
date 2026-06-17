import { useEffect, useState } from "react";

interface Book {
  id: number;
  title: string;
  author: string;
  status: string;
}

function App() {
  const [books, setBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/books")
      .then((response) => response.json())
      .then((data) => setBooks(data));
  }, []);

  return (
    <div>
      <h1>📚 Personal Library Dashboard</h1>

      {books.map((book) => (
        <div key={book.id}>
          <h2>{book.title}</h2>
          <p>Author: {book.author}</p>
          <p>Status: {book.status}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default App;