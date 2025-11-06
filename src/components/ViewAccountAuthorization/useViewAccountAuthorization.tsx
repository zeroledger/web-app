import { useContext, useMemo, useState } from "react";
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
  const { viewAccount, setAuthorized, evmClients } = useContext(LedgerContext);

  const messageData = useMemo(
    (): SigningData[] => [
      {
        label: "Protocol",
        value: "zeroledger",
      },
      {
        label: "Main Address",
        value: shortString(evmClients?.primaryClient()?.account.address) || "",
      },
      {
        label: "Authentication Account Address",
        value:
          shortString(viewAccount?.getViewAccount()?.address) || "loading...",
      },
      {
        label: "Encryption Key",
        value:
          shortString(viewAccount?.getQuantumKeyPair()?.publicKey) ||
          "loading...",
      },
    ],
    [viewAccount, evmClients],
  );

  const handleSign = debounce(async () => {
    try {
      setIsSigning(true);
      await viewAccount?.authorize(
        evmClients!.primaryClient()!,
        evmClients!.readClient,
      );
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

  return {
    isSigning,
    isSuccess,
    error,
    messageData,
    handleSign,
  };
};
