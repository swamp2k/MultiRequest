interface ConsensusMeterProps {
  score: number; // 0–1
  className?: string;
}

/**
 * Horizontal gradient progress bar representing the consensus score.
 * Low score (0) = red (significant revisions by critic)
 * High score (1) = green (draft was mostly accepted as-is)
 */
export default function ConsensusMeter({ score, className = '' }: ConsensusMeterProps) {
  const pct = Math.round(score * 100);

  // Color transitions: red → amber → green
  const color =
    pct >= 80
      ? 'from-green-500 to-emerald-400'
      : pct >= 50
      ? 'from-amber-500 to-yellow-400'
      : 'from-red-600 to-orange-500';

  const label =
    pct >= 80 ? 'Strong Consensus' : pct >= 50 ? 'Partial Agreement' : 'Significant Revision';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Consensus Score</span>
        <span className="font-mono font-semibold text-white">{pct}%</span>
      </div>
      <div className="h-2.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
