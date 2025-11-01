import { Button } from "@headlessui/react";
import { primaryButtonStyles } from "@src/components/styles/Button.styles";
import { Loader } from "@src/components/Loader";
import { useInitialization } from "@src/components/Onboarding/useInitialization";

export default function Initialization() {
  const { isConnecting, error, init } = useInitialization();
  return (
    <div className="mx-auto">
      {isConnecting && <Loader />}
      {error && (
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
      )}
    </div>
  );
}
