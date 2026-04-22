interface SparkIconProps {
  className?: string;
  size?: number;
}

export function SparkIcon({ className = '', size = 16 }: SparkIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sparkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L13.2 7.8L19 9L13.2 10.2L12 16L10.8 10.2L5 9L10.8 7.8L12 2Z"
        fill="url(#sparkGradient)"
        stroke="#047857"
        strokeWidth="0.5"
      />
      <path
        d="M18.5 15L19 17L21 17.5L19 18L18.5 20L18 18L16 17.5L18 17L18.5 15Z"
        fill="url(#sparkGradient)"
        stroke="#047857"
        strokeWidth="0.3"
      />
      <path
        d="M6 6L6.3 7.2L7.5 7.5L6.3 7.8L6 9L5.7 7.8L4.5 7.5L5.7 7.2L6 6Z"
        fill="url(#sparkGradient)"
        stroke="#047857"
        strokeWidth="0.2"
      />
    </svg>
  );
}