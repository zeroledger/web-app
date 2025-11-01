import PageContainer from "@src/components/PageContainer";
import Initialization from "@src/components/Onboarding/Initialization";
/**
 * Route that handles ViewAccount initialization.
 * Shows loading state while initializing and error handling.
 */
export default function InitializingRoute() {
  return (
    <PageContainer>
      <Initialization />
    </PageContainer>
  );
}
