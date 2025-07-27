import { useState } from "react";
import { useSwipe } from "./useSwipe";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";

export const useFaucet = () => {
  const [isFauceting, setIsFauceting] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const { disableSwipe, enableSwipe } = useSwipe();
  const { ledgerService } = useContext(LedgerContext);
  const handleFaucet = async () => {
    setIsFauceting(true);
    disableSwipe();
    const value = Math.ceil(Math.random() * 69 + 30).toString();
    setAmount(value);
    await ledgerService?.faucet(value);
    setIsFauceting(false);
    enableSwipe();
  };

  return {
    isFauceting,
    handleFaucet,
    amount,
  };
};
