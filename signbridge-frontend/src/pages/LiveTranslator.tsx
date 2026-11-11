// LiveTranslator.tsx
// The main recognition screen.
//
// Flow:
//   1. Request camera permission and start the video stream.
//   2. Load MediaPipe HandLandmarker (runs in the browser).
//   3. Each animation frame → detect hand landmarks → draw skeleton on canvas overlay.
//   4. Collect landmarks into a 30-frame rolling buffer.
//   5. Every time the buffer fills, send it to the FastAPI /predict endpoint (or use
//      the demo fallback if the backend is offline).
//   6. Display the predicted sign + confidence in the output card below the camera.
//   7. Accumulate predicted words into a sentence buffer.
//   8. User can Speak, Copy, or Clear the sentence.

import { useEffect, useRef, useState, useCallback } from "react";
import { Volume2, Copy, Trash2, FlipHorizontal, Play, Square } from "lucide-react";
import { useMediaPipe, type Landmark } from "../hooks/useMediaPipe";
import { useGRUModel, type PredictionResult } from "../hooks/useGRUModel";
import { useHistory } from "../hooks/useHistory";
import ConfidenceChip from "../components/ConfidenceChip";

// How many frames to collect before making a prediction
const FRAME_BUFFER_SIZE = 30;
// Minimum frames needed for a valid prediction (allow partial buffer)
const MIN_FRAMES        = 15;
// Milliseconds to wait between predictions (cooldown)
const PREDICTION_COOLDOWN_MS = 1200;



export default function LiveTranslator() {
  // ── Refs ──
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number>(0);
  const frameBuffer   = useRef<Landmark[][]>([]);
  const lastPredTime  = useRef<number>(0);
  const facingModeRef = useRef<"user" | "environment">("user");

  // ── State ──
  const [isRunning,     setIsRunning]     = useState(false);
  const [cameraError,   setCameraError]   = useState<string | null>(null);
  const [currentSign,   setCurrentSign]   = useState<PredictionResult | null>(null);
  const [tokenBuffer,   setTokenBuffer]   = useState<Array<{ word: string; conf: number }>>([]);
  const [handsVisible,  setHandsVisible]  = useState(false);
  const [fps,           setFps]           = useState(0);
  const [isSpeaking,    setIsSpeaking]    = useState(false);
  const [copied,        setCopied]        = useState(false);

  // ── Hooks ──
  const { initMediaPipe, detectHands, drawLandmarks, cleanup } = useMediaPipe();
  const { predict, checkBackend }                              = useGRUModel();
  const { addEntry }                                           = useHistory();

  // ── Derived sentence from token buffer ──
  const sentence = tokenBuffer.map((t) => t.word).join(" ");

  // ── Start camera ──
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingModeRef.current,
          width:  { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      await initMediaPipe();
      await checkBackend();
      setIsRunning(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Camera access denied";
      setCameraError(msg);
    }
  }, [initMediaPipe, checkBackend]);

  // ── Stop camera ──
  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsRunning(false);
    setHandsVisible(false);
  }, []);

  // ── Flip camera ──
  const flipCamera = useCallback(() => {
    facingModeRef.current = facingModeRef.current === "user" ? "environment" : "user";
    if (isRunning) startCamera();
  }, [isRunning, startCamera]);

  // ── Main recognition loop ──
  useEffect(() => {
    if (!isRunning) return;

    let frameCount = 0;
    let lastFpsTime = performance.now();

    async function processFrame() {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const now    = performance.now();
      const result = detectHands(video, now);

      // FPS counter (update every second)
      frameCount++;
      if (now - lastFpsTime >= 1000) {
        setFps(frameCount);
        frameCount  = 0;
        lastFpsTime = now;
      }

      if (result && result.landmarks.length > 0) {
        setHandsVisible(true);
        const landmarks = result.landmarks[0] as Landmark[];

        // Draw skeleton overlay (pass mirrored=true for front camera)
        drawLandmarks(canvas, result, video.videoWidth, video.videoHeight, facingModeRef.current === "user");

        // Collect frames into rolling buffer
        frameBuffer.current.push(landmarks);
        if (frameBuffer.current.length > FRAME_BUFFER_SIZE) {
          frameBuffer.current.shift(); // keep only the last 30 frames
        }

        // Predict when buffer has enough frames AND cooldown has elapsed
        const bufferFull = frameBuffer.current.length >= MIN_FRAMES;
        const cooledDown = now - lastPredTime.current > PREDICTION_COOLDOWN_MS;

        if (bufferFull && cooledDown) {
          lastPredTime.current = now;
          // Run prediction (non-blocking — doesn't stall the render loop)
          predict([...frameBuffer.current]).then((result) => {
            if (result.confidence >= 0.5) {
              setCurrentSign(result);
            }
          });
        }
      } else {
        setHandsVisible(false);
        // Clear canvas when no hands
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }

      rafRef.current = requestAnimationFrame(processFrame);
    }

    rafRef.current = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRunning, detectHands, drawLandmarks, predict]);

  // ── Add recognized word to sentence buffer ──
  const addWordToBuffer = useCallback(() => {
    if (!currentSign || currentSign.confidence < 0.5) return;
    setTokenBuffer((prev) => [...prev, { word: currentSign.sign, conf: currentSign.confidence }]);
    setCurrentSign(null);
    frameBuffer.current = [];
  }, [currentSign]);

  // ── Speak sentence ──
  const handleSpeak = () => {
    if (!sentence) return;
    setIsSpeaking(true);
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(sentence);
      u.lang = "en-IN"; u.rate = 0.95;
      u.onend = () => setIsSpeaking(false);
      u.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } else {
      setTimeout(() => setIsSpeaking(false), 1500);
    }
    // Save to history
    if (tokenBuffer.length > 0) {
      const avgConf = tokenBuffer.reduce((s, t) => s + t.conf, 0) / tokenBuffer.length;
      addEntry(sentence, avgConf);
    }
  };

  // ── Copy sentence ──
  const handleCopy = () => {
    if (!sentence) return;
    navigator.clipboard?.writeText(sentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    if (tokenBuffer.length > 0) {
      const avgConf = tokenBuffer.reduce((s, t) => s + t.conf, 0) / tokenBuffer.length;
      addEntry(sentence, avgConf);
    }
  };

  // ── Clear sentence ──
  const handleClear = () => {
    setTokenBuffer([]);
    setCurrentSign(null);
    frameBuffer.current = [];
  };

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      stopCamera();
      cleanup();
    };
  }, [stopCamera, cleanup]);

  return (
    <div className="flex flex-col w-full">

      {/* ── Camera Viewport ── */}
      <div className="relative w-full aspect-[4/3] max-h-[380px] bg-inverse-surface overflow-hidden shadow-md flex items-center justify-center">

        {/* Video feed */}
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Gradient overlay for HUD legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-inverse-surface/70 via-transparent to-inverse-surface/80 pointer-events-none" />

        {/* Landmark canvas overlay — mirroring is handled in JS, not CSS */}
        <canvas
          ref={canvasRef}
          className="camera-overlay z-10"
        />

        {/* Idle / error screen */}
        {!isRunning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-inverse-surface/60">
            <span className="material-symbols-outlined text-[64px] text-inverse-on-surface/60">
              center_focus_weak
            </span>
            {cameraError ? (
              <div className="text-center px-6">
                <p className="text-on-error font-semibold text-[14px]">Camera Error</p>
                <p className="text-inverse-on-surface/70 text-[12px] mt-1">{cameraError}</p>
              </div>
            ) : (
              <p className="text-inverse-on-surface/60 text-[13px]">Camera not started</p>
            )}
            <button
              onClick={startCamera}
              className="px-6 py-3 rounded-xl bg-primary text-on-primary font-semibold text-[14px] shadow-lg active:scale-95 transition-all"
            >
              Start Camera
            </button>
          </div>
        )}

        {/* Top HUD row */}
        {isRunning && (
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
            {/* FPS + latency badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-inverse-surface/75 backdrop-blur-md text-inverse-on-surface shadow-sm">
              <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
              <span className="text-[11px] tracking-wide">{fps} FPS</span>
              <span className="text-surface-variant/40 text-[11px]">|</span>
              <span className="text-[11px] text-surface-variant/80">
                {currentSign?.source === "demo" ? "Demo Mode" : "AI Model"}
              </span>
            </div>

            {/* Flip camera button */}
            <button
              aria-label="Flip camera"
              onClick={flipCamera}
              className="w-9 h-9 rounded-full bg-inverse-surface/75 backdrop-blur-md text-inverse-on-surface flex items-center justify-center hover:bg-inverse-surface active:scale-95 transition-all"
            >
              <FlipHorizontal size={18} />
            </button>
          </div>
        )}

        {/* Bottom HUD row */}
        {isRunning && (
          <div className="absolute bottom-3 inset-x-3 flex items-center justify-between z-20">
            {/* Hand tracking status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-inverse-surface/85 backdrop-blur-md shadow-md text-inverse-on-surface">
              <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                pan_tool
              </span>
              <span className="text-[11px] font-medium">
                {handsVisible ? "Hand Detected" : "No Hand Visible"}
              </span>
            </div>

            {/* Stop / Resume button */}
            <button
              onClick={isRunning ? stopCamera : startCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-[11px] shadow-md active:scale-95 transition-all bg-error text-on-error"
            >
              {isRunning ? (
                <><Square size={12} className="fill-current" /> STOP AI</>
              ) : (
                <><Play size={12} /> RESUME</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Below camera: Output cards ── */}
      <div className="px-4 flex flex-col gap-3 py-3">

        {/* Recognition state banner */}
        {currentSign && (
          <div className="w-full bg-surface-container-lowest p-3 rounded-xl shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-on-tertiary-container/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[17px] text-on-tertiary-container">check_circle</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Recognition State</span>
                <span className="text-[13px] font-semibold text-on-surface truncate">
                  Sign Recognized: &quot;{currentSign.sign.toUpperCase()}&quot;
                </span>
              </div>
            </div>
            <ConfidenceChip confidence={currentSign.confidence} />
          </div>
        )}

        {/* Main sign + sentence card */}
        <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
          {/* Current sign display */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider">
              Currently Recognized
            </span>
            {currentSign && (
              <button
                onClick={addWordToBuffer}
                className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-[11px] font-semibold active:scale-95 transition-all"
              >
                + Add to Sentence
              </button>
            )}
          </div>

          {currentSign ? (
            <div className="flex items-baseline justify-between pt-0.5">
              <h2 className="font-manrope font-bold text-[28px] text-primary tracking-tight">
                {currentSign.sign.toUpperCase()}
              </h2>
              <div className="flex items-center gap-1 text-on-tertiary-container font-bold text-[13px]">
                <span className="material-symbols-outlined text-[17px]">verified</span>
                {Math.round(currentSign.confidence * 100)}% Match
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2">
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[19px] text-on-surface-variant">pan_tool</span>
              </div>
              <span className="text-[14px] text-on-surface-variant">
                {isRunning ? "Show your hand to the camera…" : "Start the camera to begin"}
              </span>
            </div>
          )}

          {/* Confidence bar */}
          {currentSign && (
            <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full confidence-bar transition-all duration-300"
                style={{ width: `${Math.round(currentSign.confidence * 100)}%` }}
              />
            </div>
          )}

          {/* Token / sentence buffer */}
          {tokenBuffer.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-on-surface-variant">Active Sentence</span>
                <span className="text-[11px] text-outline">{tokenBuffer.length} words</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 min-h-[38px]">
                {tokenBuffer.map((t, i) => (
                  <div
                    key={i}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold ${
                      i === tokenBuffer.length - 1
                        ? "bg-primary-fixed text-on-primary-fixed"
                        : "bg-surface-container text-on-surface"
                    }`}
                  >
                    {t.word}
                    <span className="text-[10px] px-1 rounded bg-white/40 text-current opacity-70">
                      {Math.round(t.conf * 100)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sentence output box */}
          {tokenBuffer.length > 0 && (
            <div className="p-3 rounded-lg bg-surface-container-low flex flex-col gap-1">
              <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">neurology</span>
                English Output
              </span>
              <p className="font-manrope font-bold text-[17px] text-on-surface">
                &ldquo;{sentence}&rdquo;
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleSpeak}
              disabled={!sentence}
              className="h-12 rounded-xl bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm transition-transform disabled:opacity-40"
            >
              {isSpeaking
                ? <><span className="material-symbols-outlined text-[19px]">graphic_eq</span> Playing…</>
                : <><Volume2 size={18} /> Speak</>
              }
            </button>
            <button
              onClick={handleCopy}
              disabled={!sentence}
              className={`h-12 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-40 ${
                copied ? "bg-on-tertiary-container text-white" : "bg-surface-container-high text-primary"
              }`}
            >
              <Copy size={16} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={handleClear}
              className="h-12 rounded-xl bg-surface-container-high text-on-surface-variant font-semibold text-[13px] flex items-center justify-center gap-1.5 hover:bg-error-container hover:text-on-error-container active:scale-[0.98] transition-all"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </div>
        </div>

        {/* Alternative candidates */}
        {currentSign && currentSign.topK.length > 1 && (
          <div className="w-full bg-surface-container-lowest rounded-xl p-4 shadow-sm flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-manrope font-semibold text-[16px] text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[17px] text-secondary">model_training</span>
                Alternative Candidates
              </span>
              <span className="text-[11px] text-on-surface-variant">Top-k Disambiguation</span>
            </div>
            <div className="flex flex-col gap-2">
              {currentSign.topK.slice(1).map((alt) => (
                <div
                  key={alt.sign}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary-container" />
                    <span className="text-[13px] text-on-surface font-medium">{alt.sign}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-on-surface-variant">
                      {Math.round(alt.confidence * 100)}%
                    </span>
                    <button
                      onClick={() => setTokenBuffer((prev) => [...prev, { word: alt.sign, conf: alt.confidence }])}
                      className="px-2 py-0.5 rounded bg-surface-container-high text-secondary text-[11px] font-semibold hover:bg-surface-variant active:scale-95"
                    >
                      Use
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-container-high text-on-surface-variant">
              <span className="material-symbols-outlined text-[17px] text-primary flex-shrink-0">lightbulb</span>
              <span className="text-[12px]">
                Tip: Ensure good lighting and keep your hand fully visible for best accuracy.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
