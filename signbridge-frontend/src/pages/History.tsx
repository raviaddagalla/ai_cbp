// History.tsx — Translation History Page
// Displays all past translation sessions saved in localStorage.
// Supports search, speak, delete, and clear-all.

import { useState, useMemo } from "react";
import { Search, Trash2, ShieldCheck } from "lucide-react";
import { useHistory } from "../hooks/useHistory";
import HistoryItem from "../components/HistoryItem";

export default function History() {
  const { entries, removeEntry, clearAll } = useHistory();
  const [query,          setQuery]          = useState("");
  const [showConfirm,    setShowConfirm]    = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return entries;
    return entries.filter((e) => e.signSequence.toLowerCase().includes(q));
  }, [entries, query]);

  const handleClearAll = () => {
    clearAll();
    setShowConfirm(false);
  };

  return (
    <div className="flex flex-col w-full pb-8">

      {/* Privacy banner */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low shadow-sm">
          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center flex-shrink-0 text-on-primary-fixed">
            <ShieldCheck size={17} />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] text-primary font-bold">100% On-Device Storage</span>
              <span className="inline-flex items-center px-1.5 rounded-full bg-on-tertiary-container/20 text-on-tertiary-container text-[9px] font-semibold uppercase">
                localStorage
              </span>
            </div>
            <p className="text-[11px] text-on-surface-variant truncate">
              Zero cloud telemetry. Logs stay on this device.
            </p>
          </div>
        </div>
      </div>

      {/* Page header */}
      <section className="px-4 py-2 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="font-manrope font-bold text-[22px] text-primary tracking-tight">
              Translation History
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary text-[12px] font-bold">
              {entries.length}
            </span>
          </div>
        </div>
        <p className="text-[13px] text-on-surface-variant">
          {entries.length} translation{entries.length !== 1 ? "s" : ""} saved locally on this device
        </p>
      </section>

      {/* Search + Clear bar */}
      <div className="px-4 py-2 flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search translations…"
            className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 text-[13px] shadow-sm focus:outline-none focus:bg-surface-container-low transition-colors"
          />
        </div>

        {/* Clear all with confirmation */}
        <div className="relative flex-shrink-0">
          <button
            aria-label="Clear all history"
            onClick={() => setShowConfirm(true)}
            disabled={entries.length === 0}
            className="h-11 px-3 rounded-xl bg-error-container text-on-error-container hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm disabled:opacity-40"
          >
            <Trash2 size={18} />
            <span className="text-[12px] font-semibold hidden min-[400px]:inline">Clear</span>
          </button>

          {/* Confirmation flyout */}
          {showConfirm && (
            <div className="absolute right-0 top-12 z-40 w-64 p-3 rounded-2xl bg-surface-container-lowest shadow-xl flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-error text-[19px] mt-0.5">warning</span>
                <div className="flex flex-col">
                  <span className="text-[13px] font-bold text-on-surface">Erase all {entries.length} logs?</span>
                  <span className="text-[11px] text-on-surface-variant">This cannot be undone.</span>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container text-on-surface text-[12px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearAll}
                  className="px-3 py-1.5 rounded-lg bg-error text-on-error text-[12px] font-semibold shadow-sm"
                >
                  Erase All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Entries list */}
      <div className="px-4 flex flex-col gap-2 mt-1">
        {filtered.length > 0 ? (
          filtered.map((entry) => (
            <HistoryItem key={entry.id} entry={entry} onDelete={removeEntry} />
          ))
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 bg-surface-container-lowest rounded-2xl shadow-sm text-center gap-3 mt-2">
            <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-[42px] text-on-surface-variant">history</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-manrope font-bold text-[18px] text-on-surface">
                {query ? "No matching entries" : "No translations yet"}
              </h3>
              <p className="text-[13px] text-on-surface-variant max-w-xs">
                {query
                  ? "Try a different search term."
                  : "Use the Live Translator to start recognizing signs. Your history will appear here."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

