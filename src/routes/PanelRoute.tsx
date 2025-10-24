import { lazy } from "react";
import { LoadingScreen } from "@src/components/LoadingScreen";
import PageContainer from "@src/components/PageContainer";

// Lazy load the Panel component
const Panel = lazy(() => import("@src/components/Panel"));
const PanelProvider = lazy(() =>
  import("@src/components/Panel/context/panel/panel.provider").then(
    ({ PanelProvider }) => ({ default: PanelProvider }),
  ),
);

export default function PanelRoute() {
  return (
    <PageContainer>
      <LoadingScreen message="Preparing wallet modules...">
        <PanelProvider>
          <LoadingScreen message="Loading panel dashboard...">
            <Panel />
          </LoadingScreen>
        </PanelProvider>
      </LoadingScreen>
    </PageContainer>
  );
}
