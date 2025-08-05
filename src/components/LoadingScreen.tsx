import { Suspense } from "react";
import { Loader } from "./Loader";

export const LoadingScreen = ({
  message = "",
  children,
}: {
  message?: string;
  children?: React.ReactNode;
}) => {
  return (
    <Suspense
      fallback={
        <div className="flex-col items-center justify-center h-[100vh] content-center">
          <Loader className="flex justify-center" />
          <p className="text-gray-200 mt-5 h-6.5 text-center">{message}</p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
};
