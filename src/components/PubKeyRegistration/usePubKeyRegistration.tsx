import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { shortString } from "@src/utils/common";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import useSWR from "swr";

export const usePubKeyRegistration = () => {
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error>();
  const navigate = useNavigate();
  const { isWalletChanged, ledger, chainSupported } = useContext(LedgerContext);

  const { data: metaTransactionData, error: metaTransactionError } = useSWR(
    ledger ? ledger : null,
    async (ledger) => await ledger.prepareRegisterMetaTransaction(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: true,
      suspense: true,
    },
  );

  const messageData = useMemo(() => {
    const details = metaTransactionData?.transactionDetails;
    if (!details) {
      return [];
    }
    return [
      {
        label: "Type",
        value: "Register View Account Public Key",
      },
      {
        label: "Registry Contract",
        value: shortString(details.registry) || "",
      },
      {
        label: "Public Key",
        value: shortString(details.publicKey) || "",
      },
      {
        label: "Owner",
        value: shortString(details.from) || "",
      },
      {
        label: "Fee",
        value: "0",
      },
      {
        label: "Paymaster",
        value: shortString(details.paymaster) || "",
      },
    ];
  }, [metaTransactionData?.transactionDetails]);

  const handleSign = async () => {
    try {
      if (!metaTransactionData) {
        return;
      }
      setIsSigning(true);
      await ledger!.executeMetaTransaction(
        metaTransactionData.metaTransaction,
        metaTransactionData.coveredGas,
      );
      navigate("/panel/wallet");
      setIsSuccess(true);
      setIsSigning(false);
    } catch (error) {
      console.error(error);
      setError(error as Error);
      setIsSigning(false);
    }
  };

  useEffect(() => {
    if (isWalletChanged && chainSupported) {
      navigate("/");
    }
  }, [isWalletChanged, navigate, chainSupported]);

  return {
    isSigning,
    isSuccess,
    error: metaTransactionError || error,
    messageData,
    handleSign,
  };
};
