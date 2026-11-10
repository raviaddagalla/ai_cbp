// ConfidenceChip.tsx
// A small pill badge that shows the confidence level of a prediction.
// Green  = high confidence (≥ 80%)
// Amber  = medium confidence (50–79%)
// Gray   = low confidence (< 50%)

interface ConfidenceChipProps {
  confidence: number;  // 0.0 – 1.0
  className?: string;
}

export default function ConfidenceChip({ confidence, className = "" }: ConfidenceChipProps) {
  const pct = Math.round(confidence * 100);

  const style =
    pct >= 80
      ? "bg-[#dcfce7] text-[#15803d]"   // green
      : pct >= 50
      ? "bg-[#fef3c7] text-[#b45309]"   // amber
      : "bg-surface-container text-on-surface-variant";  // gray

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-none ${style} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          pct >= 80 ? "bg-[#16a34a]" : pct >= 50 ? "bg-[#d97706]" : "bg-outline"
        }`}
      />
      {pct}% Conf.
    </span>
  );
}

