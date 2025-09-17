interface ArrowIconProps {
  className?: string;
  rotate?: number;
}

export default function ArrowIcon({
  className = "",
  rotate = 0,
}: ArrowIconProps) {
  return (
    <svg
      className={className}
      style={{ transform: `rotate(${rotate}deg)` }}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 19L19 5M5 5h14v14"
      />
    </svg>
  );
}
