export const SuccessMessage = ({ message }: { message: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-16 h-16 text-white"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
    <div className="text-2xl font-bold text-white">{message}</div>
  </div>
);
