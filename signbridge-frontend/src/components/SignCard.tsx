// SignCard.tsx
// A card component for the ISL dictionary that shows one sign entry.
// Clicking it opens the detail modal sheet.

interface Sign {
  id:          number;
  label:       string;
  category:    string;
  description: string;
  emoji:       string;
  hands:       string;
}

interface SignCardProps {
  sign:    Sign;
  onClick: (sign: Sign) => void;
}

const CATEGORY_STYLES: Record<string, { badge: string; border: string }> = {
  greetings: { badge: "bg-primary-fixed text-on-primary-fixed",    border: "" },
  daily:     { badge: "bg-secondary-fixed text-on-secondary-fixed", border: "" },
  emergency: { badge: "bg-error-container text-on-error-container", border: "border-l-2 border-error/40" },
  family:    { badge: "bg-surface-container-high text-primary",     border: "" },
  numbers:   { badge: "bg-surface-container text-on-surface-variant", border: "" },
};

export default function SignCard({ sign, onClick }: SignCardProps) {
  const style = CATEGORY_STYLES[sign.category] ?? CATEGORY_STYLES.daily;
  const categoryLabel =
    sign.category.charAt(0).toUpperCase() + sign.category.slice(1);

  return (
    <article
      onClick={() => onClick(sign)}
      className={`flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-all active:scale-[0.99] cursor-pointer group ${style.border}`}
    >
      {/* Left: emoji + text */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Emoji icon */}
        <div className="w-[72px] h-[72px] rounded-xl bg-surface-container-high flex-shrink-0 flex items-center justify-center text-4xl select-none">
          {sign.emoji}
        </div>

        {/* Text block */}
        <div className="flex flex-col min-w-0">
          {/* Category + hands badges */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${style.badge}`}>
              {categoryLabel}
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-[10px] font-semibold">
              {sign.hands}
            </span>
          </div>
          <h3 className="font-manrope font-bold text-[18px] leading-6 text-on-surface truncate">
            {sign.label}
          </h3>
          <p className="text-[13px] text-on-surface-variant truncate mt-0.5">
            {sign.description.slice(0, 55)}…
          </p>
        </div>
      </div>

      {/* Right: chevron */}
      <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0 text-on-surface-variant group-hover:bg-primary-fixed group-hover:text-on-primary-fixed transition-colors">
        <span className="material-symbols-outlined text-[20px]">chevron_right</span>
      </div>
    </article>
  );
}

