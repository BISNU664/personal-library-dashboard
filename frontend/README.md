# Personal Library — Frontend

React + TypeScript single-page app built with Vite. See the [project README](../README.md) for full setup.

## Scripts

| Command           | Description                              |
| ----------------- | ---------------------------------------- |
| `npm run dev`     | Start the dev server at http://localhost:5173 |
| `npm run build`   | Type-check and build for production      |
| `npm run lint`    | Run ESLint                               |
| `npm run preview` | Preview the production build             |

## Structure

```
src/
  api.ts              API client for the backend
  App.tsx             App shell, shared state and add/edit/delete/recommendation handlers
  components/         Sidebar, top bar, chip bar, pins, modals, cover images…
  hooks/              useReadingGoals (persisted in localStorage)
  pages/              Home (AI picks feed), Library, Analytics
  types/              Shared Book / Recommendation types and constants
  utils/              Filtering, sorting and reading-year helpers
```

The backend URL defaults to `http://127.0.0.1:8000` and can be changed with `VITE_API_URL` (see `.env.example`).
