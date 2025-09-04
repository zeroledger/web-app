import { Address } from "viem";
import { useState } from "react";

export const useCopyAddress = (address: Address | undefined) => {
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

  const handleCopyAddress = async () => {
    try {
      if (!address) return;
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
