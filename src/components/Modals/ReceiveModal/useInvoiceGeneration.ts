import { useState, useContext } from "react";
import { keccak256, toHex } from "viem";
import { deriveStealthAccount } from "@zeroledger/vycrypt";
import { LedgerContext } from "@src/context/ledger/ledger.context";

export const useInvoiceGeneration = () => {
  const { viewAccount } = useContext(LedgerContext);
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

    // Validate that view account is available
    if (!viewAccount) {
      console.error("View account not available");
      return false;
    }

    const viewPrivateKey = viewAccount.viewPrivateKey();
    if (!viewPrivateKey) {
      console.error("View account private key not available");
      return false;
    }

    setIsGenerating(true);

    try {
      // 1. Generate random as hash of amount & message
      const random = keccak256(toHex(`${amount}${message}`));

      // 2. Derive stealth account using view account private key
      const account = deriveStealthAccount(viewPrivateKey, random);

      setInvoiceAddress(account.address as `0x${string}`);
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
