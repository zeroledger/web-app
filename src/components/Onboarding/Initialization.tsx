import { Button } from "@headlessui/react";
import { primaryButtonStyles } from "@src/components/styles/Button.styles";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";
import { useInitialization } from "@src/components/Onboarding/useInitialization";

export default function Initialization() {
  const { isConnecting, error, init } = useInitialization();
  if (isConnecting) {
    return <DumpLoadingScreen />;
  }
  if (error) {
    return (
      <div className="mt-4">
        <div className="text-base/6 text-red-400 text-center">
          <p className="error-message">{error.message}</p>
        </div>
        <div className="flex justify-center mt-4">
          <Button className={primaryButtonStyles.regular} onClick={init}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
}
