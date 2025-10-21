import { lazy, useEffect, useState } from "react";
import { LoadingScreen } from "@src/components/LoadingScreen";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { DumpLoadingScreen } from "@src/components/LoadingScreen";
const urgentMessage = import.meta.env.VITE_URGENT_MESSAGE;

const RegisterForm = lazy(
  () => import("@src/components/Onboarding/RegisterForm"),
);

const Connect = lazy(() => import("@src/components/Onboarding/Connect"));

export default function Onboarding() {
  const { wallets } = useWalletAdapter();

  const [connecting, setConnecting] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConnecting(false);
    }, 1_500);
    return () => clearTimeout(timer);
  }, []);

  const Component = wallets.length ? RegisterForm : Connect;

  return (
    <>
      {connecting ? (
        <DumpLoadingScreen />
      ) : (
        <LoadingScreen>
          {urgentMessage && (
            <div className="text-white text-center bg-amber-500 p-4 mb-10">
              {urgentMessage}
            </div>
          )}
          <Component />
        </LoadingScreen>
      )}
    </>
  );
}
