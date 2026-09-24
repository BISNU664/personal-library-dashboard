import { useEffect, useState } from "react";

export const DEFAULT_READING_GOAL = 20;

// Goals are stored per reader, so people sharing a browser keep their own.
const storageKey = (userId: string) => `readingGoals:${userId}`;

/** Reading goals keyed by year, e.g. { 2026: 20 }. */
export type ReadingGoals = Record<number, number>;

function loadGoals(userId: string): ReadingGoals {
  try {
    const saved = localStorage.getItem(storageKey(userId));

    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Corrupted or unavailable storage: fall back to the defaults.
  }

  return {};
}

export function useReadingGoals(userId: string) {
  const [goals, setGoals] = useState<ReadingGoals>(() => loadGoals(userId));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(goals));
    } catch {
      // Storage is unavailable (e.g. private mode); goals last for the session.
    }
  }, [goals, userId]);

  const getGoal = (year: number) => goals[year] ?? DEFAULT_READING_GOAL;

  const setGoal = (year: number, goal: number) =>
    setGoals((previousGoals) => ({ ...previousGoals, [year]: goal }));

  return { goals, getGoal, setGoal };
}
