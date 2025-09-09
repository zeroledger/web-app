import CheckCircleIcon from "@src/components/svg/CheckCircleIcon";

export const SuccessMessage = ({ message }: { message: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
    <CheckCircleIcon className="w-16 h-16 text-white" />
    <div className="text-2xl font-bold text-white">{message}</div>
  </div>
);
