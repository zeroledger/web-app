import { LedgerContext } from "@src/context/ledger.context";
import { useContext, useState } from "react";

export const useCopyAddress = () => {
  const { ledgerServices } = useContext(LedgerContext);
  const address = ledgerServices!.accountService.getAccount()!.address;
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setShowCopiedTooltip(true);
      setTimeout(() => setShowCopiedTooltip(false), 500);
    } catch (err) {
      console.error("Failed to copy address:", err);
    }
  };

  return {
    showCopiedTooltip,
    handleCopyAddress,
    address,
  };
};
