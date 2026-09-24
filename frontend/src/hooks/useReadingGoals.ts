import { useEffect, useState } from "react";

export const DEFAULT_READING_GOAL = 20;

const STORAGE_KEY = "readingGoals";

/** Reading goals keyed by year, e.g. { 2026: 20 }. */
export type ReadingGoals = Record<number, number>;

function loadGoals(): ReadingGoals {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // Corrupted or unavailable storage: fall back to the defaults.
  }

  return {};
}

export function useReadingGoals() {
  const [goals, setGoals] = useState<ReadingGoals>(loadGoals);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
    } catch {
      // Storage is unavailable (e.g. private mode); goals last for the session.
    }
  }, [goals]);

  const getGoal = (year: number) => goals[year] ?? DEFAULT_READING_GOAL;

  const setGoal = (year: number, goal: number) =>
    setGoals((previousGoals) => ({ ...previousGoals, [year]: goal }));

  return { goals, getGoal, setGoal };
}
