import React from "react";

interface FaucetIconProps {
  className?: string;
}

export const FaucetIcon: React.FC<FaucetIconProps> = ({ className = "" }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2.5C12 2.5 5 8.5 5 13.5C5 17.5 8 20 12 20C16 20 19 17.5 19 13.5C19 8.5 12 2.5 12 2.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
