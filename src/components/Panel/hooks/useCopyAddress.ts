import { Address } from "viem";
import { useState } from "react";

export const useCopyAddress = (address: Address) => {
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
  };
};
