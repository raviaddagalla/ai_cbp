// Home.tsx — Dashboard / Home page
// Shows a hero card to start translation, quick-access cards, and recent history.

import { Link } from "react-router-dom";
import { Camera, BookOpen, ChevronRight, Zap, MessageSquare } from "lucide-react";
import { useHistory } from "../hooks/useHistory";
import ConfidenceChip from "../components/ConfidenceChip";

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN"; u.rate = 0.95;
  window.speechSynthesis.speak(u);
}

export default function Home() {
  const { entries } = useHistory();
  const recentEntries = entries.slice(0, 3);

  return (
    <div className="flex flex-col w-full px-4 pb-6 gap-4 pt-2">

      {/* PWA Status pill */}
      <div className="flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface-variant shadow-sm">
        <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
        <span className="text-[11px] font-medium text-on-surface">PWA Ready • Offline Dictionary Enabled</span>
      </div>

      {/* Page title */}
      <div>
        <h1 className="font-manrope font-bold text-[28px] leading-9 text-primary tracking-tight">
          Welcome to SignBridge
        </h1>
        <p className="text-[15px] text-on-surface-variant mt-0.5">
          Translate Indian Sign Language into text and speech in real-time.
        </p>
      </div>

      {/* ── Hero Card: Start Translation ── */}
      <div className="relative overflow-hidden rounded-xl bg-primary text-on-primary p-4 shadow-xl">
        {/* Decorative blur circle */}
        <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-secondary-container/20 blur-2xl pointer-events-none" />

        <div className="relative flex flex-col gap-3">
          {/* Badge row */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary-container text-on-primary-container text-[11px] font-semibold uppercase tracking-wider">
              <Camera size={13} />
              Vision AI Core
            </div>
            <div className="flex items-center gap-1 text-on-tertiary-container text-[11px] bg-white/10 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container" />
              Camera Ready
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="font-manrope font-bold text-[22px] leading-7">Live Sign Translation</h2>
            <p className="text-[13px] text-primary-fixed mt-0.5">
              Translate your gestures in real-time using on-device neural landmark detection.
            </p>
          </div>

          {/* CTA button */}
          <Link
            to="/translate"
            className="relative group flex items-center justify-center gap-2.5 w-full py-3.5 px-4 rounded-xl bg-surface-container-lowest text-primary shadow-md hover:bg-surface-container-low active:scale-[0.98] transition-all"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-container opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
            </span>
            <Camera size={20} />
            <span className="text-[14px] font-bold tracking-tight">Start Camera Translation</span>
            <ChevronRight size={18} className="ml-auto text-secondary" />
          </Link>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md">
              <Zap size={16} className="text-on-tertiary-container" />
              <div className="flex flex-col">
                <span className="text-[9px] text-primary-fixed uppercase tracking-wider">Avg Latency</span>
                <span className="font-manrope font-bold text-[16px] text-on-primary">~85ms</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 backdrop-blur-md">
              <MessageSquare size={16} className="text-primary-fixed-dim" />
              <div className="flex flex-col">
                <span className="text-[9px] text-primary-fixed uppercase tracking-wider">Supported</span>
                <span className="font-manrope font-bold text-[16px] text-on-primary">35 Signs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Learn ISL Dictionary Card ── */}
      <div className="rounded-xl bg-surface-container-low p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-variant text-primary flex items-center justify-center flex-shrink-0">
            <BookOpen size={24} />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="font-manrope font-bold text-[17px] text-on-surface truncate">Learn ISL Dictionary</span>
              <span className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed">Lookup</span>
            </div>
            <p className="text-[13px] text-on-surface-variant mt-0.5">
              Text to gesture visualization and step-by-step hand motion guides.
            </p>
          </div>
        </div>

        {/* Preview chips */}
        <div className="grid grid-cols-2 gap-2">
          {["🙏 Namaste", "💧 Water"].map((item) => (
            <div key={item} className="flex items-center gap-2.5 p-2 rounded-lg bg-surface-container-lowest shadow-sm">
              <span className="text-2xl">{item.split(" ")[0]}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-semibold text-on-surface truncate">{item.split(" ")[1]}</span>
                <span className="text-[10px] text-on-surface-variant">ISL Sign</span>
              </div>
            </div>
          ))}
        </div>

        <Link
          to="/dictionary"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-lg bg-secondary-fixed text-on-secondary-fixed hover:bg-surface-variant active:scale-[0.98] transition-all text-[13px] font-semibold"
        >
          <span className="material-symbols-outlined text-[17px]">search</span>
          Open Visual Dictionary
        </Link>
      </div>

      {/* ── Quick Practice Packs ── */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
          Quick Practice Packs
        </span>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {[
            { icon: "pin",       label: "Practice Numbers" },
            { icon: "emergency", label: "Emergency Signs" },
            { icon: "waving_hand", label: "Greetings" },
          ].map(({ icon, label }) => (
            <Link
              key={label}
              to="/dictionary"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-lowest text-on-surface shadow-sm active:scale-95 transition-transform flex-shrink-0 text-[12px] font-medium"
            >
              <span className="material-symbols-outlined text-[17px] text-secondary">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Academic Disclaimer ── */}
      <div className="rounded-xl bg-surface-container-high p-4 shadow-sm flex gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[17px]">school</span>
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-bold text-on-surface">Academic Prototype Note</span>
            <span className="px-1.5 rounded bg-surface-container-highest text-on-surface-variant text-[9px] uppercase font-bold">Research</span>
          </div>
          <p className="text-[13px] text-on-surface-variant leading-5">
            This system supports a curated vocabulary of <strong>35 ISL signs</strong> (Greetings, Needs, Emergency). Designed for inclusive pedagogy and accessibility research.
          </p>
        </div>
      </div>

      {/* ── Recent Translations ── */}
      {recentEntries.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[19px] text-primary">history</span>
              <h2 className="font-manrope font-bold text-[17px] text-on-surface">Recent Translations</h2>
            </div>
            <Link to="/history" className="text-[12px] text-secondary font-bold hover:underline">
              View All
            </Link>
          </div>

          <div className="flex flex-col gap-2">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[19px]">sign_language</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-manrope font-bold text-[14px] text-on-surface truncate">
                      {entry.signSequence}
                    </span>
                    <ConfidenceChip confidence={entry.confidence} />
                  </div>
                </div>
                <button
                  aria-label={`Speak: ${entry.signSequence}`}
                  onClick={() => speakText(entry.signSequence)}
                  className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center active:scale-90 transition-transform shadow-sm flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[19px]">volume_up</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

