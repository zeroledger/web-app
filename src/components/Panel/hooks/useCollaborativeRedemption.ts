import { useCallback, useState, useContext } from "react";
import { PryxContext } from "@src/context/pryx.context";
import { WalletContext } from "@src/context/wallet.context";
import { useSwipe } from "./useSwipe";

export function useCollaborativeRedemption() {
  const { clientController } = useContext(PryxContext);
  const { balance } = useContext(WalletContext);
  const { disableSwipe, enableSwipe } = useSwipe();

  const [isRedeeming, setIsRedeeming] = useState(false);

  /**
   * Error is handled by notification
   */
  const safeCollaborativeRedemption = useCallback(async () => {
    if (balance === 0n) {
      return;
    }
    setIsRedeeming(true);
    disableSwipe();
    await clientController?.collaborativeWithdraw();
    setIsRedeeming(false);
    enableSwipe();
  }, [clientController, balance, disableSwipe, enableSwipe]);

  return {
    isRedeeming,
    safeCollaborativeRedemption,
  };
}
