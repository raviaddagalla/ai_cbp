// Dictionary.tsx — ISL Sign Dictionary Page
// Searchable, filterable grid of all 35 ISL signs.
// Clicking a card opens a bottom-sheet modal with full instructions.

import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, X, Volume2, Camera } from "lucide-react";
import signsData from "../data/signs.json";
import SignCard from "../components/SignCard";

interface Sign {
  id:          number;
  label:       string;
  category:    string;
  description: string;
  emoji:       string;
  hands:       string;
}

const SIGNS: Sign[] = signsData as Sign[];

const CATEGORIES = [
  { key: "all",       label: "All Signs", count: SIGNS.length },
  { key: "greetings", label: "Greetings",  count: SIGNS.filter((s) => s.category === "greetings").length },
  { key: "emergency", label: "Emergency",  count: SIGNS.filter((s) => s.category === "emergency").length },
  { key: "daily",     label: "Daily Needs",count: SIGNS.filter((s) => s.category === "daily").length },
  { key: "family",    label: "People",     count: SIGNS.filter((s) => s.category === "family").length },
  { key: "numbers",   label: "Numbers",    count: SIGNS.filter((s) => s.category === "numbers").length },
];

function speakSign(label: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(label);
  u.lang = "en-IN"; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function Dictionary() {
  const [query,    setQuery]    = useState("");
  const [category, setCategory] = useState("all");
  const [modal,    setModal]    = useState<Sign | null>(null);

  // Filtered list based on search + category
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return SIGNS.filter((s) => {
      const matchCat   = category === "all" || s.category === category;
      const matchQuery = !q || s.label.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [query, category]);

  const closeModal = useCallback(() => setModal(null), []);

  return (
    <div className="flex flex-col w-full px-4 pb-10 gap-3">

      {/* Offline status banner */}
      <div className="flex items-center justify-between gap-2 bg-surface-container-high px-4 py-2.5 rounded-xl mt-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container animate-pulse flex-shrink-0" />
          <span className="text-[12px] text-primary font-semibold truncate">
            Offline Dictionary Ready • {SIGNS.length} Signs Cached
          </span>
        </div>
        <span className="material-symbols-outlined text-[17px] text-primary flex-shrink-0">cloud_done</span>
      </div>

      {/* Page header */}
      <div>
        <h1 className="font-manrope font-bold text-[22px] text-primary tracking-tight">ISL Dictionary</h1>
        <p className="text-[13px] text-on-surface-variant mt-0.5">
          Browse all {SIGNS.length} supported Indian Sign Language gestures.
        </p>
      </div>

      {/* Search input */}
      <div className="relative w-full flex items-center">
        <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search signs by word or topic…"
          className="w-full h-12 pl-10 pr-10 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 text-[14px] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {CATEGORIES.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all active:scale-95 ${
              category === key
                ? "bg-primary text-on-primary shadow-sm"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-variant"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-secondary">database</span>
          <span className="text-[12px] text-on-surface-variant font-semibold">
            Showing {filtered.length} of {SIGNS.length} signs
          </span>
        </div>
        <span className="text-[12px] text-primary font-semibold">A – Z</span>
      </div>

      {/* Sign cards grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((sign) => (
            <SignCard key={sign.id} sign={sign} onClick={setModal} />
          ))}
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-2xl shadow-sm text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">manage_search</span>
          </div>
          <h3 className="font-manrope font-bold text-[17px] text-on-surface">No signs found</h3>
          <p className="text-[13px] text-on-surface-variant max-w-xs">
            Try searching for simple words like "Food", "Help", or "Doctor".
          </p>
          <button
            onClick={() => { setQuery(""); setCategory("all"); }}
            className="px-4 py-2.5 rounded-xl bg-primary text-on-primary text-[13px] font-semibold active:scale-95 transition-transform shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Practice callout */}
      <div className="bg-surface-container-low p-4 rounded-2xl flex items-center gap-4 mt-1">
        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 text-on-primary shadow-sm">
          <Camera size={22} />
        </div>
        <div className="flex flex-col min-w-0">
          <h4 className="font-manrope font-bold text-[16px] text-on-surface truncate">Want to test your gestures?</h4>
          <p className="text-[12px] text-on-surface-variant line-clamp-2">
            Switch to the Live Translator to verify your hand posture.
          </p>
        </div>
        <Link
          to="/translate"
          className="flex-shrink-0 px-3 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-semibold active:scale-95 transition-all shadow-sm"
        >
          Try It
        </Link>
      </div>

      {/* ── Detail Modal (bottom sheet) ── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-inverse-surface/60 backdrop-blur-sm flex items-end justify-center"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg bg-surface-container-lowest rounded-t-3xl p-6 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto -mt-2" />

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[11px] font-semibold capitalize">
                    {modal.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[11px]">
                    {modal.hands}
                  </span>
                </div>
                <h2 className="font-manrope font-bold text-[26px] text-on-surface leading-8">
                  {modal.label}
                </h2>
              </div>
              <button
                aria-label="Close"
                onClick={closeModal}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface active:scale-95 transition-transform flex-shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Emoji placeholder (replaces image — no CDN dependency) */}
            <div className="w-full h-48 bg-surface-container-high rounded-2xl flex items-center justify-center shadow-inner relative">
              <span className="text-[80px] select-none">{modal.emoji}</span>
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                <span className="bg-surface-container-lowest/90 backdrop-blur-md px-2.5 py-1 rounded-full text-on-surface text-[11px] font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-on-tertiary-container" />
                  Verified ISL Standard
                </span>
              </div>
            </div>

            {/* How to perform */}
            <div className="flex flex-col gap-1.5 bg-surface-container-low p-4 rounded-xl">
              <span className="text-[11px] text-primary font-bold uppercase tracking-wider">How to Perform:</span>
              <p className="text-[15px] text-on-surface leading-6">{modal.description}</p>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pb-2">
              <button
                onClick={() => speakSign(modal.label)}
                className="h-12 rounded-xl bg-surface-container text-primary font-semibold text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-surface-variant"
              >
                <Volume2 size={18} />
                Audio Pronounce
              </button>
              <Link
                to="/translate"
                onClick={closeModal}
                className="h-12 rounded-xl bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-sm"
              >
                <Camera size={18} />
                Practice Gesture
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

