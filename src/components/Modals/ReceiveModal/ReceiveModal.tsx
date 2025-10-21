import { BackButton } from "@src/components/Buttons/BackButton";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { useEnsProfile } from "@src/context/ledger/useEnsProfile";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { useCopyAddress, useCopyEns } from ".";
import { shortString } from "@src/utils/common";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { BaseModal } from "@src/components/Modals/BaseModal";
import { useState } from "react";
import { Field, Label, Input, Switch, Button } from "@headlessui/react";
import { primaryInputStyle } from "@src/components/styles/Input.styles";
import { primaryButtonStyle } from "@src/components/styles/Button.styles";
import clsx from "clsx";

interface ReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiveModal({ isOpen, onClose }: ReceiveModalProps) {
  const { wallet } = useWalletAdapter();
  const { data: ensProfile } = useEnsProfile(wallet?.address as `0x${string}`);
  const { showCopiedTooltip: showAddressCopied, handleCopyAddress } =
    useCopyAddress(wallet?.address as `0x${string}`);
  const { showCopiedTooltip: showEnsCopied, handleCopyEns } = useCopyEns(
    ensProfile?.name,
  );
  const style = useDynamicHeight("h-dvh");

  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [messageRequest, setMessageRequest] = useState("");
  const [isPublicPayment, setIsPublicPayment] = useState(false);
  const [invoiceAddress, setInvoiceAddress] = useState<`0x${string}` | null>(
    null,
  );
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const amountRegex = /^\d*\.?\d*$/;

  // Copy hook for invoice address
  const {
    showCopiedTooltip: showInvoiceCopied,
    handleCopyAddress: handleCopyInvoice,
  } = useCopyAddress(invoiceAddress || ("" as `0x${string}`));

  const handleAmountChange = (value: string) => {
    if (!amountRegex.test(value)) return;
    setAmount(value);
    setAmountError("");

    // Reset invoice when amount changes
    if (isPublicPayment && invoiceAddress) {
      setInvoiceAddress(null);
    }
  };

  const handleMessageRequestChange = (value: string) => {
    if (value.length <= 32) {
      setMessageRequest(value);
    }
  };

  const handleGenerateInvoice = async () => {
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      setAmountError("Amount is required for invoice generation");
      return;
    }

    setIsGeneratingInvoice(true);

    // Mock invoice generation - simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock invoice address
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const mockAddress =
      "0x" + Array.from({ length: 40 }, () => randomHex()).join("");

    setInvoiceAddress(mockAddress as `0x${string}`);
    setIsGeneratingInvoice(false);
  };

  // Reset invoice when switching payment types
  const handlePaymentTypeChange = (enabled: boolean) => {
    setIsPublicPayment(enabled);
    if (!enabled) {
      setInvoiceAddress(null);
      setAmountError("");
    }
  };

  const generateQRData = () => {
    // Use invoice address for public payments, otherwise use wallet address
    const targetAddress = isPublicPayment ? invoiceAddress : wallet?.address;
    if (!targetAddress) return "";

    const hasAmount = amount && parseFloat(amount) > 0;
    const hasMessage = messageRequest.trim().length > 0;

    if (isPublicPayment) {
      // For public payments, just return the invoice address (external ERC20 transfer)
      return invoiceAddress;
    }

    // For private payments (ZeroLedger)
    if (hasAmount || hasMessage) {
      // Build QR code with parameters
      let qrData = `zeroledger:address=${wallet.address}`;
      if (hasAmount) {
        qrData += `&amount=${amount}`;
      }
      if (hasMessage) {
        qrData += `&message=${encodeURIComponent(messageRequest)}`;
      }
      return qrData;
    }

    // Just the address if no parameters specified
    return wallet.address;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={true}
      contentClassName="relative justify-center overflow-y-auto"
      style={style}
    >
      <div className="px-6 py-5 h-full grid grid-cols-1">
        <BackButton onClick={onClose} className="place-self-start" />
        <div className="flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Receive Payment
            </h1>
            <p className="text-gray-400 text-sm">
              Share your address to receive payments
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center mb-8 relative">
            <div
              className={clsx(
                "transition-all duration-200",
                isPublicPayment && !invoiceAddress && "blur-lg",
              )}
            >
              <QRCodeDisplay value={generateQRData() || ""} size={192} />
            </div>
            {isPublicPayment && !invoiceAddress && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-white/80 text-sm font-medium">
                  Generate invoice to view QR code
                </p>
              </div>
            )}
          </div>

          {/* Payment Type Toggle */}
          <div className="mb-6">
            <Field>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label className="text-base/6 font-medium text-white">
                    Public Payment (Invoice)
                  </Label>
                  <p className="text-sm text-white/70 mt-1">
                    {isPublicPayment
                      ? "Receive via direct ERC20 transfer to one-time address"
                      : "Receive via ZeroLedger (private with message support)"}
                  </p>
                </div>
                <Switch
                  checked={isPublicPayment}
                  onChange={handlePaymentTypeChange}
                  className={clsx(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    isPublicPayment ? "bg-blue-500" : "bg-white/20",
                  )}
                >
                  <span
                    className={clsx(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      isPublicPayment ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </Switch>
              </div>
            </Field>
          </div>

          {/* Invoice Generation (for public payments) */}
          {isPublicPayment && (
            <div className="mb-4">
              {/* Amount Input (Required for Invoice) */}
              <div className="mb-4">
                <Field>
                  <Label className="text-base/6 font-medium text-white mb-2 block">
                    Invoice Amount (USD) *
                  </Label>
                  <Input
                    type="text"
                    className={primaryInputStyle}
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                    disabled={isGeneratingInvoice}
                  />
                  {amountError && (
                    <div className="text-red-400 text-sm mt-1">
                      {amountError}
                    </div>
                  )}
                  <div className="text-sm text-white/60 mt-1">
                    Required to generate invoice
                  </div>
                </Field>
              </div>

              {/* Generate Invoice Button */}
              {!invoiceAddress && (
                <Button
                  onClick={handleGenerateInvoice}
                  disabled={
                    isGeneratingInvoice || !amount || parseFloat(amount) <= 0
                  }
                  className={clsx(
                    primaryButtonStyle,
                    "w-full",
                    (isGeneratingInvoice ||
                      !amount ||
                      parseFloat(amount) <= 0) &&
                      "opacity-50 cursor-not-allowed",
                  )}
                >
                  {isGeneratingInvoice
                    ? "Generating..."
                    : "Generate Invoice Address"}
                </Button>
              )}

              {/* Invoice Address Display (after generation) */}
              {invoiceAddress && (
                <div className="mt-4">
                  <div className="text-base/6 font-medium text-white mb-2 block">
                    Invoice Address (One-Time Use)
                  </div>
                  <div className="relative">
                    <div className="bg-gray-700/35 rounded-lg p-3 pr-12">
                      <span className="text-white font-mono text-sm">
                        {shortString(invoiceAddress)}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyInvoice}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title="Copy invoice address"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    {showInvoiceCopied && (
                      <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        Copied!
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-white/60 mt-2">
                    ⚠️ This address will automatically deposit received tokens
                    to your private balance
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ZeroLedger-specific fields (only show for private payments) */}
          {!isPublicPayment && (
            <>
              {/* ENS Name (if available) */}
              {ensProfile?.name && (
                <div className="mb-4">
                  <div className="text-base/6 font-medium text-white mb-2 block">
                    ENS Name
                  </div>
                  <div className="relative">
                    <div className="bg-gray-700/35 rounded-lg p-3 pr-12">
                      <span className="text-white font-mono text-sm">
                        {ensProfile.name}
                      </span>
                    </div>
                    <button
                      onClick={handleCopyEns}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      title="Copy ENS name"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                    {showEnsCopied && (
                      <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        Copied!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wallet Address */}
              <div className="mb-4">
                <div className="text-base/6 font-medium text-white mb-2 block">
                  Wallet Address
                </div>
                <div className="relative">
                  <div className="bg-gray-700/35 rounded-lg p-3 pr-12">
                    <span className="text-white font-mono text-sm">
                      {wallet?.address
                        ? shortString(wallet.address)
                        : "No address"}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                    title="Copy wallet address"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  {showAddressCopied && (
                    <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                      Copied!
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                <Field>
                  <Label className="text-base/6 font-medium text-white mb-2 block">
                    Request Amount (USD). Optional.
                  </Label>
                  <Input
                    type="text"
                    className={primaryInputStyle}
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0.00"
                  />
                  {amountError && (
                    <div className="text-red-400 text-sm mt-1">
                      {amountError}
                    </div>
                  )}
                </Field>
              </div>

              {/* Message Request Input */}
              <div className="mb-6">
                <Field>
                  <Label className="text-base/6 font-medium text-white mb-2 block">
                    Request Message. Optional.
                  </Label>
                  <Input
                    type="text"
                    className={primaryInputStyle}
                    value={messageRequest}
                    onChange={(e) => handleMessageRequestChange(e.target.value)}
                    placeholder="e.g., Invoice #123, Coffee payment..."
                    maxLength={32}
                  />
                </Field>
              </div>
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
