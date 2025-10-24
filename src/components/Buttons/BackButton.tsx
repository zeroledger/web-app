import clsx from "clsx";

interface BackButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export const BackButton = ({
  onClick,
  disabled,
  className,
}: BackButtonProps) => (
  <button
    onClick={onClick}
    className={clsx(
      "py-2 text-white/60 hover:text-white transition-colors hover:cursor-pointer",
      className,
    )}
    disabled={disabled}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-6 h-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  </button>
);
