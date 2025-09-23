import { useState } from "react";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import debounce from "debounce";

export const useFaucet = () => {
  const [isFauceting, setIsFauceting] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const { ledger } = useContext(LedgerContext);
  const handleFaucet = debounce(async () => {
    setIsFauceting(true);
    const value = Math.ceil(Math.random() * 69 + 30).toString();
    setAmount(value);
    await ledger!.transactions.faucet(value);
    setIsFauceting(false);
  }, 50);

  return {
    isFauceting,
    handleFaucet,
    amount,
  };
};
