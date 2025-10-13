import { Button } from "@headlessui/react";
import { primaryButtonStyle } from "@src/components/styles/Button.styles";
import WelcomeBanner from "./WelcomeBanner";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { MdEmail } from "react-icons/md";
import { SiWalletconnect } from "react-icons/si";
import clsx from "clsx";
import { ENABLE_EMBEDDED_WALLETS } from "@src/common.constants";

const buttonOverrideStyles = "py-1.5 px-1.5 text-sm/4 w-38";

export default function Connect() {
  const { connect, signIn } = useWalletAdapter();

  const containerClass = clsx(
    "mt-5 mx-auto",
    ENABLE_EMBEDDED_WALLETS && "grid grid-cols-2 gap-3",
  );

  return (
    <>
      <WelcomeBanner />
      <div className={containerClass}>
        <Button
          className={clsx(
            primaryButtonStyle,
            ENABLE_EMBEDDED_WALLETS && buttonOverrideStyles,
          )}
          onClick={connect}
        >
          Connect {ENABLE_EMBEDDED_WALLETS && <SiWalletconnect />}
        </Button>
        {ENABLE_EMBEDDED_WALLETS && (
          <Button
            className={clsx(primaryButtonStyle, buttonOverrideStyles)}
            onClick={signIn}
          >
            Sign in with <MdEmail />
          </Button>
        )}
      </div>
    </>
  );
}
