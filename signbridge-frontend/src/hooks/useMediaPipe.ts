// useMediaPipe.ts
// Wraps the MediaPipe Tasks Vision HandLandmarker.
// Call initMediaPipe() once, then detectHands() on each video frame.
//
// MediaPipe returns 21 landmarks per hand: each has x, y, z (all 0–1 normalized).
// We pass those landmarks to the GRU model for gesture recognition.

import { useRef, useCallback } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  type HandLandmarkerResult,
} from "@mediapipe/tasks-vision";

// CDN path for the HandLandmarker WASM files
const MEDIAPIPE_WASM =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

// Pre-trained hand detection model from Google
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export function useMediaPipe() {
  // Store the HandLandmarker instance in a ref so it persists across renders
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const isInitializedRef = useRef(false);

  /**
   * Initialize the HandLandmarker. Call this once when the camera view mounts.
   * Returns true when ready.
   */
  const initMediaPipe = useCallback(async (): Promise<void> => {
    if (isInitializedRef.current) return;

    // Load the WASM binary files needed by MediaPipe in the browser
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM);

    landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HAND_MODEL_URL,
        delegate: "GPU",          // use GPU if available; falls back to CPU
      },
      runningMode: "VIDEO",       // VIDEO mode → call detectForVideo() per frame
      numHands: 1,                // detect up to 1 hand (simpler for academic demo)
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence:  0.5,
      minTrackingConfidence:      0.5,
    });

    isInitializedRef.current = true;
  }, []);

  /**
   * Run hand detection on a single video frame.
   *
   * @param video     - The <video> element currently showing the camera feed
   * @param timestamp - performance.now() value (MediaPipe requires monotonically
   *                    increasing timestamps in VIDEO mode)
   * @returns HandLandmarkerResult with landmarks[] and worldLandmarks[]
   */
  const detectHands = useCallback(
    (video: HTMLVideoElement, timestamp: number): HandLandmarkerResult | null => {
      if (!landmarkerRef.current) return null;
      return landmarkerRef.current.detectForVideo(video, timestamp);
    },
    []
  );

  /**
   * Draw the detected hand skeleton onto a <canvas> overlay.
   *
   * The canvas is sized to match the *displayed* video dimensions (not the
   * native video resolution) so points align with what the user sees.
   * When the front camera is active the video is CSS-mirrored with
   * scaleX(-1); we compensate by flipping landmark x-coordinates so the
   * skeleton tracks the hand correctly without relying on the CSS transform.
   */
  const drawLandmarks = useCallback(
    (
      canvas: HTMLCanvasElement,
      result: HandLandmarkerResult,
      videoWidth: number,
      videoHeight: number,
      mirrored = false
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Size the canvas to the element's *displayed* size so coordinates
      // map to the pixels the user actually sees (fixes the offset caused
      // by object-cover scaling the native video resolution).
      const rect = canvas.getBoundingClientRect();
      const displayW = rect.width  || videoWidth;
      const displayH = rect.height || videoHeight;

      if (canvas.width !== displayW || canvas.height !== displayH) {
        canvas.width  = displayW;
        canvas.height = displayH;
      }
      ctx.clearRect(0, 0, displayW, displayH);

      if (!result.landmarks || result.landmarks.length === 0) return;

      // Helper: map a normalized [0,1] landmark coord to canvas pixels.
      // When mirrored we flip x so the skeleton follows the hand even though
      // the CSS scaleX(-1) transform is NOT applied to the canvas itself.
      const toX = (nx: number) =>
        mirrored ? (1 - nx) * displayW : nx * displayW;
      const toY = (ny: number) => ny * displayH;

      for (const hand of result.landmarks) {
        const CONNECTIONS: [number, number][] = [
          [0,1],[1,2],[2,3],[3,4],
          [0,5],[5,6],[6,7],[7,8],
          [0,9],[9,10],[10,11],[11,12],
          [0,13],[13,14],[14,15],[15,16],
          [0,17],[17,18],[18,19],[19,20],
          [5,9],[9,13],[13,17],
        ];

        ctx.strokeStyle = "#27c38a";
        ctx.lineWidth   = 2;

        for (const [a, b] of CONNECTIONS) {
          ctx.beginPath();
          ctx.moveTo(toX(hand[a].x), toY(hand[a].y));
          ctx.lineTo(toX(hand[b].x), toY(hand[b].y));
          ctx.stroke();
        }

        for (const lm of hand) {
          ctx.beginPath();
          ctx.arc(toX(lm.x), toY(lm.y), 4, 0, Math.PI * 2);
          ctx.fillStyle   = "#27c38a";
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth   = 2;
          ctx.fill();
          ctx.stroke();
        }
      }
    },
    []
  );

  /** Release the HandLandmarker when the component unmounts. */
  const cleanup = useCallback(() => {
    landmarkerRef.current?.close();
    landmarkerRef.current    = null;
    isInitializedRef.current = false;
  }, []);

  return { initMediaPipe, detectHands, drawLandmarks, cleanup };
}

