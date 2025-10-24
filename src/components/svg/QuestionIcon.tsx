interface QuestionIconProps {
  className?: string;
}

export default function QuestionIcon({ className = "" }: QuestionIconProps) {
  return (
    <svg
      className={`ml-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16h.01M12 12a2 2 0 10-2-2 2 2 0 002 2zm0 0v2"
      />
    </svg>
  );
}
