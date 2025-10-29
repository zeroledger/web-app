import { useState, useEffect, useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import debounce from "debounce";

export const useFaucet = () => {
  const [isFauceting, setIsFauceting] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const [isFaucetSuccess, setIsFaucetSuccess] = useState(false);
  const [isFaucetError, setIsFaucetError] = useState(false);
  const { ledger } = useContext(LedgerContext);
  const handleFaucet = debounce(async () => {
    setIsFauceting(true);
    const value = Math.ceil(Math.random() * 69 + 30).toString();
    setAmount(value);
    try {
      await ledger!.transactions.faucet(value);
      setIsFaucetSuccess(true);
    } catch {
      setIsFaucetError(true);
    } finally {
      setIsFauceting(false);
    }
  }, 50);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isFaucetSuccess) {
      timer = setTimeout(() => setIsFaucetSuccess(false), 6000);
    }
    if (isFaucetError) {
      timer = setTimeout(() => setIsFaucetError(false), 2500);
    }
    return () => clearTimeout(timer);
  }, [isFaucetSuccess, isFaucetError]);

  return {
    isFauceting,
    handleFaucet,
    amount,
    isFaucetSuccess,
    isFaucetError,
  };
};
