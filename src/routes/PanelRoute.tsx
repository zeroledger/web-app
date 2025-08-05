import { lazy, useEffect } from "react";
import { prover } from "@src/utils/prover";
import { LoadingScreen } from "@src/components/LoadingScreen";

// Lazy load the Panel component
const Panel = lazy(() => import("@src/components/Panel"));

export default function PanelRoute() {
  useEffect(() => {
    // do not wait for sequential circuits load
    void prover.preloadVitalCircuits();
  }, []);

  return (
    <div className="dark:text-white h-dvh flex justify-center items-center overflow-hidden">
      <LoadingScreen message="Preparing wallet modules...">
        <Panel />
      </LoadingScreen>
    </div>
  );
}
