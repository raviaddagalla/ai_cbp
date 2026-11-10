// useHistory.ts
// Manages translation history stored in localStorage.
// This keeps data on the user's device without any server or database.

import { useState, useEffect, useCallback } from "react";

export interface HistoryEntry {
  id: string;
  signSequence: string;   // e.g. "I WANT WATER"
  confidence: number;      // 0.0 – 1.0
  timestamp: string;       // ISO 8601 string
}

const STORAGE_KEY = "signbridge_history";

function loadFromStorage(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(entries: HistoryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadFromStorage);

  // Keep localStorage in sync whenever entries change
  useEffect(() => {
    saveToStorage(entries);
  }, [entries]);

  /** Add a new translation to the front of the history list. */
  const addEntry = useCallback((signSequence: string, confidence: number) => {
    const newEntry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      signSequence,
      confidence,
      timestamp: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev].slice(0, 100)); // cap at 100 entries
  }, []);

  /** Remove a single entry by id. */
  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  /** Wipe all history. */
  const clearAll = useCallback(() => {
    setEntries([]);
  }, []);

  return { entries, addEntry, removeEntry, clearAll };
}

