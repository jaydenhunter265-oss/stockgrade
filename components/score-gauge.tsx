"use client";

interface ScoreGaugeProps {
  score: number;
  rating: string;
  ratingColor: string;
  size?: number;
}

export default function ScoreGauge({ score, rating, ratingColor, size = 180 }: ScoreGaugeProps) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.min(score, 100)) / 100;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="#262626"
          strokeWidth="7"
        />
        {/* Score arc */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={ratingColor}
          strokeWidth="7"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="gauge-circle"
          style={{ filter: `drop-shadow(0 0 6px ${ratingColor}40)` }}
        />
        {/* Score number */}
        <text
          x="50" y="44"
          textAnchor="middle"
          fill="#fafafa"
          fontSize="22"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          {score}
        </text>
        {/* out of 100 */}
        <text
          x="50" y="55"
          textAnchor="middle"
          fill="#71717a"
          fontSize="7"
          fontFamily="system-ui"
        >
          out of 100
        </text>
        {/* Rating label */}
        <text
          x="50" y="67"
          textAnchor="middle"
          fill={ratingColor}
          fontSize="8"
          fontWeight="bold"
          fontFamily="system-ui"
        >
          {rating}
        </text>
      </svg>
    </div>
  );
}
