import { Button } from "@headlessui/react";
import {
  linkButtonStyle,
  primaryButtonStyles,
} from "@src/components/styles/Button.styles";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { SiWalletconnect } from "react-icons/si";
import clsx from "clsx";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";

export default function ConnectWallet() {
  const {
    isExternalWalletConnecting,
    connectExternalWallet: handleLink,
    setConnectionWalletPreference,
  } = useContext(LedgerContext);
  const navigate = useNavigate();
  const handleSkip = () => {
    setConnectionWalletPreference(false);
    navigate("/");
  };

  return (
    <div className="mx-auto w-full md:max-w-md px-3">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          Select Connection Mode
        </h2>
        <p className="text-sm text-white/60">
          Connection mode decides whether ZeroLedger uses a wallet built into
          the app or one you connect from outside.
        </p>
      </div>
      <div className="flex flex-col items-center gap-3 max-w-xs mx-auto">
        <Button
          className={clsx(primaryButtonStyles.small, {
            "opacity-50 cursor-not-allowed": isExternalWalletConnecting,
          })}
          onClick={handleLink}
          disabled={isExternalWalletConnecting}
        >
          {isExternalWalletConnecting ? (
            <>
              <svg className="mr-2 size-4 animate-spin" viewBox="0 0 24 24">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12H19C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12H2C2 17.5228 6.47715 22 12 22Z"
                  fill="currentColor"
                />
              </svg>
              Connecting...
            </>
          ) : (
            <>
              External Wallet
              <SiWalletconnect className="ml-1" />
            </>
          )}
        </Button>
        <Button
          className={clsx(linkButtonStyle, "hover:cursor-pointer")}
          onClick={handleSkip}
          disabled={isExternalWalletConnecting}
        >
          Build In Wallet
        </Button>
      </div>
    </div>
  );
}
