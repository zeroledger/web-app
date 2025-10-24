import { useState, useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import type { DepositFeesData } from "@src/services/ledger/Fees";

export const useInvoiceGeneration = (feesData: DepositFeesData) => {
  const { ledger } = useContext(LedgerContext);
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
    try {
      setInvoiceAddress(
        (
          await ledger?.invoicing?.generateInvoice(
            BigInt(amount),
            message,
            feesData,
          )
        )?.invoiceAddress || null,
      );
      setIsGenerating(false);

      return true;
    } catch (error) {
      console.error("Error generating invoice:", error);
      setIsGenerating(false);
      return false;
    }
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
