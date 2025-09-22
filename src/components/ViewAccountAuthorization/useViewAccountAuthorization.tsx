import { useWallets } from "@privy-io/react-auth";
import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SigningData } from "@src/components/SigningPreview/SigningPreview";
import { shortString } from "@src/utils/common";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import debounce from "debounce";

export const useViewAccountAuthorization = () => {
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error>();
  const navigate = useNavigate();
  const {
    viewAccount,
    setAuthorized,
    password,
    evmClients,
    isWalletAddressChanged,
  } = useContext(LedgerContext);
  const { wallets } = useWallets();

  const messageData = useMemo(
    (): SigningData[] => [
      {
        label: "Protocol",
        value: "zeroledger",
      },
      {
        label: "Main Address",
        value: shortString(wallets[0]?.address) || "",
      },
      {
        label: "View Address",
        value:
          shortString(viewAccount?.getViewAccount()?.address) || "loading...",
      },
    ],
    [viewAccount, wallets],
  );

  const handleSign = debounce(async () => {
    try {
      setIsSigning(true);
      await viewAccount?.authorize(evmClients!, password!);
      setAuthorized(true);
      setIsSuccess(true);
      setIsSigning(false);
      navigate("/panel/wallet");
    } catch (error) {
      console.error(error);
      setError(error as Error);
      setIsSigning(false);
    }
  }, 50);

  useEffect(() => {
    if (isWalletAddressChanged) {
      navigate("/");
    }
  }, [isWalletAddressChanged, navigate]);

  return {
    isSigning,
    isSuccess,
    error,
    messageData,
    handleSign,
  };
};
