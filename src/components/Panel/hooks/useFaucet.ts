import { useState } from "react";
import { useSwipe } from "./useSwipe";
import { useContext } from "react";
import { WalletContext } from "@src/context/wallet.context";

export const useFaucet = () => {
  const [isFauceting, setIsFauceting] = useState(false);
  const [amount, setAmount] = useState<string | undefined>(undefined);
  const { disableSwipe, enableSwipe } = useSwipe();
  const { walletService } = useContext(WalletContext);
  const handleFaucet = async () => {
    setIsFauceting(true);
    disableSwipe();
    const value = Math.ceil(Math.random() * 69 + 30).toString();
    setAmount(value);
    await walletService?.faucet(value);
    setIsFauceting(false);
    enableSwipe();
  };

  return {
    isFauceting,
    handleFaucet,
    amount,
  };
};
