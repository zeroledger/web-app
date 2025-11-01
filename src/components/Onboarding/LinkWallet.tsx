import { Button } from "@headlessui/react";
import {
  linkButtonStyle,
  primaryButtonStyles,
} from "@src/components/styles/Button.styles";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { SiWalletconnect } from "react-icons/si";
import clsx from "clsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setLinkWalletPreference } from "./linkWalletPreference";

export default function LinkWallet() {
  const { linkExternalWallet } = useWalletAdapter();
  const navigate = useNavigate();
  const [isLinking, setIsLinking] = useState(false);

  const handleLink = async () => {
    try {
      setIsLinking(true);
      await linkExternalWallet();
      setLinkWalletPreference(true);
      navigate("/");
    } catch (error) {
      console.error("Failed to link wallet:", error);
      setIsLinking(false);
    }
  };

  const handleSkip = () => {
    setLinkWalletPreference(false);
    navigate("/");
  };

  return (
    <div className="mx-auto w-full md:max-w-md px-3">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Connect External Wallet
        </h2>
        <p className="text-sm text-white/60">
          Connect an external wallet to use as your primary wallet for
          transactions. By skipping this step, you will use your email wallet
          instead.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
        <Button
          className={clsx(primaryButtonStyles.small, {
            "opacity-50 cursor-not-allowed": isLinking,
          })}
          onClick={handleLink}
          disabled={isLinking}
        >
          {isLinking ? (
            <>
              <svg className="mr-2 size-4 animate-spin" viewBox="0 0 24 24">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12H19C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12H2C2 17.5228 6.47715 22 12 22Z"
                  fill="currentColor"
                />
              </svg>
              Linking...
            </>
          ) : (
            <>
              Link Wallet <SiWalletconnect className="ml-1" />
            </>
          )}
        </Button>
        <Button
          className={clsx(linkButtonStyle, "hover:cursor-pointer")}
          onClick={handleSkip}
          disabled={isLinking}
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}
