import { lazy, Suspense, useEffect, useState } from "react";
import { Loader } from "@src/components/Loader";
import { prover } from "@src/utils/prover";

// Lazy load the Panel component
const Panel = lazy(() => import("@src/components/Panel"));

const LoadingScreen = ({ message }: { message?: string }) => {
  return (
    <div className="flex-col items-center justify-center h-full content-center">
      <Loader className="flex justify-center" />
      <p className="text-gray-200 mt-5">{message}</p>
    </div>
  );
};

const messages = [
  "Preparing wallet modules...",
  "Loading circuits...",
  "Finishing up...",
];

export default function PanelRoute() {
  const [message, setMessage] = useState(messages[0]);

  useEffect(() => {
    const messageTimer = setTimeout(() => {
      setMessage(messages[1]);
    }, 1_000);
    prover.preloadAllCircuits();
    return () => {
      clearTimeout(messageTimer);
    };
  }, []);

  return (
    <div className="dark:text-white h-dvh flex justify-center items-center overflow-hidden">
      <Suspense fallback={<LoadingScreen message={message} />}>
        <Panel />
      </Suspense>
    </div>
  );
}
