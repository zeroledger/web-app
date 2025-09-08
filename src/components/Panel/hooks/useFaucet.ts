import { useState } from "react";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";

export const useFaucet = () => {
  const [isFauceting, setIsFauceting] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const { ledger } = useContext(LedgerContext);
  const handleFaucet = async () => {
    setIsFauceting(true);
    const value = Math.ceil(Math.random() * 69 + 30).toString();
    setAmount(value);
    await ledger!.transactions.faucet(value);
    setIsFauceting(false);
  };

  return {
    isFauceting,
    handleFaucet,
    amount,
  };
};
