import { lazy, useEffect, useState } from "react";
import { prover } from "@src/utils/prover";
import { LoadingScreen } from "@src/components/LoadingScreen";

// Lazy load the Panel component
const Panel = lazy(() => import("@src/components/Panel"));

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
    prover.preloadVitalCircuits();
    return () => {
      clearTimeout(messageTimer);
    };
  }, []);

  return (
    <div className="dark:text-white h-dvh flex justify-center items-center overflow-hidden">
      <LoadingScreen message={message}>
        <Panel />
      </LoadingScreen>
    </div>
  );
}
