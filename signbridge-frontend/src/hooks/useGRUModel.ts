// useGRUModel.ts
// Calls the FastAPI backend /predict endpoint with collected landmark frames.
// The backend runs the PyTorch GRU model and returns the recognized sign + confidence.
//
// In offline/demo mode (when the backend is unreachable), it falls back to
// a simple rule-based heuristic using only hand position on screen.
//
// BUG-FIX: backendAvailable is now periodically retried so the hook recovers
// automatically when the backend comes back online after a transient failure.

import { useCallback, useRef, useEffect } from "react";
import type { Landmark } from "./useMediaPipe";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// How long (ms) to wait before retrying a failed backend connection
const BACKEND_RETRY_INTERVAL_MS = 10_000;

export interface PredictionResult {
  sign:       string;
  confidence: number;
  topK:       Array<{ sign: string; confidence: number }>;
  source:     "model" | "demo";  // tells UI whether backend or demo mode was used
}

// --- Simple demo/fallback prediction ---
// When backend is offline, use the hand's wrist y-position to pick a demo sign.
const DEMO_SIGNS = [
  "Namaste","Hello","Thank You","Water","Food",
  "Help","Yes","No","Doctor","I / Me",
];

function demoPredict(frames: Landmark[][]): PredictionResult {
  if (frames.length === 0 || frames[0].length === 0) {
    return { sign: "...", confidence: 0, topK: [], source: "demo" };
  }
  // Use the wrist (landmark 0) y-position averaged over the last 5 frames
  const recent = frames.slice(-5);
  const avgY = recent.reduce((sum, f) => sum + (f[0]?.y ?? 0.5), 0) / recent.length;
  const idx  = Math.min(Math.floor(avgY * DEMO_SIGNS.length), DEMO_SIGNS.length - 1);
  const sign = DEMO_SIGNS[idx];
  return {
    sign,
    confidence: 0.65 + Math.random() * 0.2,
    topK: [{ sign, confidence: 0.72 }],
    source: "demo",
  };
}

export function useGRUModel() {
  // null = unknown, true = reachable, false = unreachable
  const backendAvailable  = useRef<boolean | null>(null);
  const retryTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Check if the FastAPI backend is online.
   * Sets backendAvailable.current for future calls.
   */
  const checkBackend = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(2000) });
      backendAvailable.current = res.ok;
      return res.ok;
    } catch {
      backendAvailable.current = false;
      return false;
    }
  }, []);

  /**
   * Schedule a background retry when the backend goes offline.
   * Clears itself once the backend is confirmed reachable.
   */
  const scheduleRetry = useCallback(() => {
    if (retryTimerRef.current) return;   // already scheduled
    retryTimerRef.current = setTimeout(async () => {
      retryTimerRef.current = null;
      const ok = await checkBackend();
      if (!ok) scheduleRetry();   // keep retrying until online
    }, BACKEND_RETRY_INTERVAL_MS);
  }, [checkBackend]);

  // Cancel any pending retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    };
  }, []);

  /**
   * Run prediction on a collected sequence of landmark frames.
   *
   * @param frames  Array of frames; each frame is an array of 21 Landmark objects.
   *               Should have at least 15 frames for a stable prediction.
   */
  const predict = useCallback(async (frames: Landmark[][]): Promise<PredictionResult> => {
    // Skip backend call if we already know it's down
    if (backendAvailable.current === false) {
      return demoPredict(frames);
    }

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landmarks: frames }),
        signal: AbortSignal.timeout(3000),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      backendAvailable.current = true;

      return {
        sign:       data.sign,
        confidence: data.confidence,
        topK:       data.top_k ?? [],
        source:     "model",
      };
    } catch {
      // BUG-FIX: schedule a retry instead of leaving stuck in demo mode forever
      backendAvailable.current = false;
      scheduleRetry();
      return demoPredict(frames);
    }
  }, [scheduleRetry]);

  return { predict, checkBackend };
}

