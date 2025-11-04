import { Field, Label, Input, Button } from "@headlessui/react";
import { primaryInputStyle } from "@src/components/styles/Input.styles";
import { primaryButtonStyles } from "@src/components/styles/Button.styles";
import { shortString } from "@src/utils/common";
import clsx from "clsx";

interface InvoiceSectionProps {
  amount: string;
  amountError: string;
  message: string;
  messageError: string;
  invoiceAddress: `0x${string}` | null;
  isGenerating: boolean;
  showCopiedTooltip: boolean;
  onAmountChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onGenerate: () => void;
  onCopyAddress: () => void;
}

export const InvoiceSection = ({
  amount,
  amountError,
  message,
  messageError,
  invoiceAddress,
  isGenerating,
  showCopiedTooltip,
  onAmountChange,
  onMessageChange,
  onGenerate,
  onCopyAddress,
}: InvoiceSectionProps) => {
  return (
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
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            disabled={isGenerating}
          />
          {amountError && (
            <div className="text-red-400 text-sm mt-1">{amountError}</div>
          )}
        </Field>
      </div>

      {/* Message/Invoice ID Input (Required for Invoice) */}
      <div className="mb-4">
        <Field>
          <Label className="text-base/6 font-medium text-white mb-2 block">
            Invoice ID / Message *
          </Label>
          <Input
            type="text"
            className={primaryInputStyle}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder="e.g., INV-2024-001"
            maxLength={32}
            disabled={isGenerating}
          />
          {messageError && (
            <div className="text-red-400 text-sm mt-1">{messageError}</div>
          )}
          <div className="text-sm text-white/60 mt-1">
            Required to generate invoice (max 32 characters)
          </div>
        </Field>
      </div>

      {/* Generate Invoice Button */}
      {!invoiceAddress && (
        <Button
          onClick={onGenerate}
          disabled={
            isGenerating ||
            !amount ||
            parseFloat(amount) <= 0 ||
            !message ||
            message.trim().length === 0
          }
          className={clsx(
            primaryButtonStyles.regular,
            "w-full",
            (isGenerating ||
              !amount ||
              parseFloat(amount) <= 0 ||
              !message ||
              message.trim().length === 0) &&
              "opacity-50 cursor-not-allowed",
          )}
        >
          {isGenerating ? "Generating..." : "Generate Invoice Address"}
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
              onClick={onCopyAddress}
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
            {showCopiedTooltip && (
              <div className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                Copied!
              </div>
            )}
          </div>
          <div className="text-sm text-white/60 mt-2">
            ⚠️ This address will automatically deposit received tokens to your
            private balance
          </div>
        </div>
      )}
    </div>
  );
};
