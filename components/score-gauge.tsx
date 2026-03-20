"use client";

interface ScoreGaugeProps {
  score: number;
  rating: string;
  ratingColor: string;
  size?: number;
}

export default function ScoreGauge({ score, rating, ratingColor, size = 200 }: ScoreGaugeProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(score, 100)) / 100;

  return (
    <div className="flex flex-col items-center relative">
      <svg width={size} height={size} viewBox="0 0 100 100" className="relative z-10">
        {/* Background ring */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#27272a"
          strokeWidth="6"
        />
        {/* Glow ring (behind) */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={ratingColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="gauge-circle"
          opacity="0.12"
          style={{ filter: "blur(3px)" }}
        />
        {/* Score arc */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={ratingColor}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="gauge-circle"
          style={{ filter: `drop-shadow(0 0 6px ${ratingColor}40)` }}
        />
        {/* Score number */}
        <text
          x="50" y="42"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="24"
          fontWeight="800"
          fontFamily="var(--font-inter), system-ui"
          letterSpacing="-1"
        >
          {score}
        </text>
        {/* out of 100 */}
        <text
          x="50" y="53"
          textAnchor="middle"
          fill="#71717a"
          fontSize="6.5"
          fontFamily="var(--font-inter), system-ui"
          fontWeight="500"
        >
          out of 100
        </text>
        {/* Rating label */}
        <text
          x="50" y="67"
          textAnchor="middle"
          fill={ratingColor}
          fontSize="7.5"
          fontWeight="800"
          fontFamily="var(--font-inter), system-ui"
          letterSpacing="0.5"
        >
          {rating}
        </text>
      </svg>
    </div>
  );
}
