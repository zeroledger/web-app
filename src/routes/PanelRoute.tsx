import { lazy, useEffect } from "react";
import { prover } from "@src/utils/prover";
import { LoadingScreen } from "@src/components/LoadingScreen";
import PageContainer from "@src/components/PageContainer";

// Lazy load the Panel component
const Panel = lazy(() => import("@src/components/Panel"));

export default function PanelRoute() {
  useEffect(() => {
    // do not wait for sequential circuits load
    void prover.preloadVitalCircuits();
  }, []);

  return (
    <PageContainer>
      <LoadingScreen message="Preparing wallet modules...">
        <Panel />
      </LoadingScreen>
    </PageContainer>
  );
}
