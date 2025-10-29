import { useState, useEffect, useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import debounce from "debounce";

export const useFaucet = (publicBalance: bigint) => {
  const [isFauceting, setIsFauceting] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [isFaucetSuccess, setIsFaucetSuccess] = useState(false);
  const [faucetErrorMessage, setFaucetErrorMessage] = useState<
    string | undefined
  >(undefined);
  const { ledger } = useContext(LedgerContext);
  const handleFaucet = debounce(async () => {
    setIsFauceting(true);
    if (publicBalance !== 0n) {
      setFaucetErrorMessage(
        "You have Test USD in your public balance. Please deposit them first.",
      );
      setIsFauceting(false);
      return;
    }
    const value = Math.ceil(Math.random() * 69 + 30).toString();
    setAmount(value);
    try {
      await ledger!.transactions.faucet(value);
      setIsFaucetSuccess(true);
    } catch {
      setFaucetErrorMessage(
        "Failed to obtain Test USD. Please try again later.",
      );
    } finally {
      setIsFauceting(false);
    }
  }, 50);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isFaucetSuccess) {
      timer = setTimeout(() => setIsFaucetSuccess(false), 6000);
    }
    if (faucetErrorMessage) {
      timer = setTimeout(() => setFaucetErrorMessage(undefined), 6000);
    }
    return () => clearTimeout(timer);
  }, [isFaucetSuccess, faucetErrorMessage]);

  return {
    isFauceting,
    handleFaucet,
    amount,
    isFaucetSuccess,
    faucetErrorMessage,
  };
};
