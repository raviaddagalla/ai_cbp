// TextToSign.tsx — Text-to-Sign Reverse Lookup Page
// User types an English word or phrase and sees matching ISL sign entries.
// Also provides quick-fill suggestion chips and voice input hint.

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, Mic, ChevronRight, Volume2, Camera } from "lucide-react";
import signsData from "../data/signs.json";

interface Sign {
  id:          number;
  label:       string;
  category:    string;
  description: string;
  emoji:       string;
  hands:       string;
}

const SIGNS: Sign[] = signsData as Sign[];

const QUICK_PHRASES = [
  "Namaste",
  "I want water",
  "Help",
  "Doctor",
  "Thank You",
  "Emergency",
];

function tokenizeQuery(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

function matchSigns(query: string): Sign[] {
  if (!query.trim()) return [];
  const tokens = tokenizeQuery(query);
  return SIGNS.filter((s) =>
    tokens.some(
      (t) =>
        s.label.toLowerCase().includes(t) ||
        s.description.toLowerCase().includes(t) ||
        s.category.toLowerCase().includes(t)
    )
  );
}

function speakWord(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-IN"; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

export default function TextToSign() {
  const [query, setQuery] = useState("I want water");

  const results = useMemo(() => matchSigns(query), [query]);

  return (
    <div className="flex flex-col w-full px-4 gap-4 pb-10">

      {/* Page header */}
      <div className="flex flex-col gap-1 pt-2">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[11px] font-semibold tracking-wide">
            <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
            TWO-WAY ACCESSIBILITY
          </span>
        </div>
        <h1 className="font-manrope font-bold text-[22px] text-primary tracking-tight">
          Text-to-Sign Lookup
        </h1>
        <p className="text-[13px] text-on-surface-variant leading-relaxed">
          Type an English word or phrase to find the matching ISL gesture steps.
        </p>
      </div>

      {/* Input card */}
      <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="text-query" className="text-[12px] text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-secondary">edit_note</span>
              English Sentence or Phrase
            </label>
            <span className="text-[11px] text-outline">{query.length} / 120 chars</span>
          </div>

          <div className="relative rounded-xl bg-surface-container-low focus-within:bg-surface-container-lowest focus-within:shadow-md transition-all">
            <textarea
              id="text-query"
              rows={3}
              maxLength={120}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type an English word or phrase (e.g. 'I want water', 'Doctor', 'Namaste')…"
              className="w-full bg-transparent px-4 py-3 text-[14px] text-on-surface placeholder:text-outline focus:outline-none resize-none"
            />
            <div className="flex items-center justify-between px-4 pb-3 pt-1">
              <button
                onClick={() => setQuery("")}
                className="text-[11px] text-on-surface-variant hover:text-error transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">backspace</span>
                Clear
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-primary text-[11px] hover:bg-surface-container-high active:scale-95 transition-all"
                title="Voice input (use browser mic)"
                onClick={() => {
                  // The Web Speech API SpeechRecognition is vendor-prefixed
                  const SR =
                    (window as any).SpeechRecognition ||
                    (window as any).webkitSpeechRecognition;
                  if (!SR) {
                    alert("Speech recognition is not supported in this browser. Please type your query.");
                    return;
                  }
                  const rec = new SR();
                  rec.lang = "en-IN";
                  rec.onresult = (e: any) => setQuery(e.results[0][0].transcript);
                  rec.start();
                }}
              >
                <Mic size={16} className="text-secondary" />
                Voice Input
              </button>
            </div>
          </div>
        </div>

        {/* Quick fill chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <span className="text-[11px] text-outline shrink-0">Try:</span>
          {QUICK_PHRASES.map((phrase) => (
            <button
              key={phrase}
              onClick={() => setQuery(phrase)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-medium hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors"
            >
              &ldquo;{phrase}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Lexical parsing visualization */}
      {query.trim() && (
        <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-primary flex items-center gap-1.5 font-semibold">
              <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">token</span>
              Lexical Parsing
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
              {results.length} matched
            </span>
          </div>

          {/* Token chips */}
          <div className="flex flex-wrap gap-2">
            {tokenizeQuery(query).map((token, i) => {
              const matched = SIGNS.some((s) => s.label.toLowerCase().includes(token));
              return (
                <div
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold shadow-sm ${
                    matched
                      ? "bg-tertiary-container text-on-tertiary font-bold"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${matched ? "bg-on-tertiary-container" : "bg-outline"}`} />
                  {token.toUpperCase()}
                  {matched && <span className="text-[9px] opacity-70">✓ ISL</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Matched sign results */}
      {results.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-manrope font-semibold text-[16px] text-on-surface flex items-center gap-2">
            <Search size={17} className="text-primary" />
            Matching ISL Signs ({results.length})
          </h2>

          <div className="flex flex-col gap-3">
            {results.map((sign) => (
              <div
                key={sign.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm flex flex-col gap-3"
              >
                {/* Sign header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-container-high flex items-center justify-center text-4xl flex-shrink-0">
                    {sign.emoji}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-[10px] font-semibold capitalize">
                        {sign.category}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
                        {sign.hands}
                      </span>
                    </div>
                    <h3 className="font-manrope font-bold text-[18px] text-on-surface">{sign.label}</h3>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-surface-container-low p-3 rounded-xl">
                  <p className="text-[13px] text-on-surface leading-5">{sign.description}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => speakWord(sign.label)}
                    className="flex-1 h-10 rounded-xl bg-surface-container text-primary text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] hover:bg-surface-variant transition-all"
                  >
                    <Volume2 size={16} />
                    Pronounce
                  </button>
                  <Link
                    to="/translate"
                    className="flex-1 h-10 rounded-xl bg-primary text-on-primary text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] shadow-sm transition-all"
                  >
                    <Camera size={16} />
                    Practice
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {query.trim() && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 bg-surface-container-lowest rounded-2xl shadow-sm text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-on-surface-variant">search_off</span>
          </div>
          <h3 className="font-manrope font-bold text-[17px] text-on-surface">No ISL signs found</h3>
          <p className="text-[13px] text-on-surface-variant max-w-xs">
            Try simpler root words like "Water", "Help", or "Doctor".
          </p>
        </div>
      )}

      {/* Idle state — no query yet */}
      {!query.trim() && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
          <span className="text-[72px]">🤟</span>
          <p className="text-[14px] text-on-surface-variant">
            Type an English phrase above to find matching ISL signs.
          </p>
          <Link
            to="/dictionary"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-on-surface text-[13px] font-semibold hover:bg-surface-variant transition-all"
          >
            Browse Full Dictionary
            <ChevronRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}

