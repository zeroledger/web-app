import { useState } from "react";

export const useCopyEns = (ensName: string | undefined) => {
  const [showCopiedTooltip, setShowCopiedTooltip] = useState(false);

  const handleCopyEns = async () => {
    try {
      if (!ensName) return;
      await navigator.clipboard.writeText(ensName);
      setShowCopiedTooltip(true);
      setTimeout(() => setShowCopiedTooltip(false), 500);
    } catch (err) {
      console.error("Failed to copy ENS name:", err);
    }
  };

  return {
    showCopiedTooltip,
    handleCopyEns,
  };
};
