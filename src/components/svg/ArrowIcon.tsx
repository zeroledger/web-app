interface ArrowIconProps {
  className?: string;
  rotate?: number;
}

export const ArrowIcon = ({ className = "", rotate = 0 }: ArrowIconProps) => (
  <svg
    className={`w-8 h-8 ml-4 ${className}`}
    style={{ transform: `rotate(${rotate}deg)` }}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M7 17L17 7M7 7h10v10"
    />
  </svg>
);
