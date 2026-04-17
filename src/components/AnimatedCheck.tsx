interface AnimatedCheckProps {
  color: string;
  size?: number;
  className?: string;
}

export default function AnimatedCheck({ color, size = 24, className = '' }: AnimatedCheckProps) {
  const strokeWidth = Math.max(1.75, size * 0.11);
  const iconSize = size * 0.6;
  return (
    <div className={`pointer-events-none ${className}`} style={{ width: size, height: size }}>
      <div className="relative w-full h-full">
        <span
          className="absolute inset-0 rounded-full animate-check-ripple"
          style={{ backgroundColor: color }}
        />
        <span
          className="absolute inset-0 rounded-full flex items-center justify-center animate-check-pop"
          style={{
            backgroundColor: color,
            boxShadow: `0 4px 12px -2px ${color}80, 0 0 0 1px rgba(255,255,255,0.15) inset`,
          }}
        >
          <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none">
            <path
              d="M3.5 8.5 L7 11.5 L12.5 5"
              stroke="white"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1}
              className="animate-check-draw"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
