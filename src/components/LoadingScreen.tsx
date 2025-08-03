import { Loader } from "./Loader";

export const LoadingScreen = ({ message }: { message?: string }) => {
  return (
    <div className="flex-col items-center justify-center h-full content-center">
      <Loader className="flex justify-center" />
      {message && <p className="text-gray-200 mt-5">{message}</p>}
    </div>
  );
};
