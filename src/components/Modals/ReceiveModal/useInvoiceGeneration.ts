import { useState } from "react";

export const useInvoiceGeneration = () => {
  const [invoiceAddress, setInvoiceAddress] = useState<`0x${string}` | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const generateInvoice = async (
    amount: string,
    message: string,
  ): Promise<boolean> => {
    // Validate amount and message
    if (!amount || parseFloat(amount) <= 0) {
      return false;
    }

    if (!message || message.trim().length === 0) {
      return false;
    }

    setIsGenerating(true);

    // Mock invoice generation - simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock invoice address
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const mockAddress =
      "0x" + Array.from({ length: 40 }, () => randomHex()).join("");

    setInvoiceAddress(mockAddress as `0x${string}`);
    setIsGenerating(false);

    return true;
  };

  const resetInvoice = () => {
    setInvoiceAddress(null);
  };

  return {
    invoiceAddress,
    isGenerating,
    generateInvoice,
    resetInvoice,
  };
};
