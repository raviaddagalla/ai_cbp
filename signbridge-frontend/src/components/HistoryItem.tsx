// HistoryItem.tsx
// Renders a single translation history entry with speak + delete actions.

import { Volume2, Trash2 } from "lucide-react";
import type { HistoryEntry } from "../hooks/useHistory";
import ConfidenceChip from "./ConfidenceChip";

interface HistoryItemProps {
  entry:    HistoryEntry;
  onDelete: (id: string) => void;
}

/** Convert ISO string to a human-readable relative time label. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function speakText(text: string) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance    = new SpeechSynthesisUtterance(text);
  utterance.lang     = "en-IN";
  utterance.rate     = 0.95;
  utterance.pitch    = 1.0;
  window.speechSynthesis.speak(utterance);
}

export default function HistoryItem({ entry, onDelete }: HistoryItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-surface-container-lowest shadow-sm hover:shadow transition-shadow gap-3">

      {/* Icon + text */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-lg bg-surface-container-high text-primary flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[20px]">sign_language</span>
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-manrope font-bold text-[15px] text-on-surface truncate">
            {entry.signSequence}
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-on-surface-variant">{timeAgo(entry.timestamp)}</span>
            <ConfidenceChip confidence={entry.confidence} />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Speak button */}
        <button
          aria-label={`Speak: ${entry.signSequence}`}
          onClick={() => speakText(entry.signSequence)}
          className="w-9 h-9 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center active:scale-90 transition-transform shadow-sm hover:bg-primary-fixed"
        >
          <Volume2 size={18} />
        </button>

        {/* Delete button */}
        <button
          aria-label="Delete entry"
          onClick={() => onDelete(entry.id)}
          className="w-9 h-9 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center active:scale-90 transition-transform hover:bg-error-container hover:text-on-error-container"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

