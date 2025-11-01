import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SigningData } from "@src/components/SigningPreview/SigningPreview";
import { shortString } from "@src/utils/common";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import debounce from "debounce";

export const useViewAccountAuthorization = () => {
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error>();
  const navigate = useNavigate();
  const { viewAccount, setAuthorized, evmClients } = useContext(LedgerContext);
  const { primaryWallet, isWalletAddressChanged } = useWalletAdapter();

  const messageData = useMemo(
    (): SigningData[] => [
      {
        label: "Protocol",
        value: "zeroledger",
      },
      {
        label: "Main Address",
        value: shortString(primaryWallet?.address) || "",
      },
      {
        label: "View Address",
        value:
          shortString(viewAccount?.getViewAccount()?.address) || "loading...",
      },
    ],
    [viewAccount, primaryWallet],
  );

  const handleSign = debounce(async () => {
    try {
      setIsSigning(true);
      await viewAccount?.authorize(evmClients!);
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
