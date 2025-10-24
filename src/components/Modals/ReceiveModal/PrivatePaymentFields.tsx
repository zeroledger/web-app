import { Field, Label, Input } from "@headlessui/react";
import { primaryInputStyle } from "@src/components/styles/Input.styles";
import { shortString } from "@src/utils/common";
import { type Address } from "viem";

interface PrivatePaymentFieldsProps {
  ensName?: string;
  walletAddress?: Address;
  amount: string;
  amountError: string;
  messageRequest: string;
  showEnsCopied: boolean;
  showAddressCopied: boolean;
  onAmountChange: (value: string) => void;
  onMessageRequestChange: (value: string) => void;
  onCopyEns: () => void;
  onCopyAddress: () => void;
}

export const PrivatePaymentFields = ({
  ensName,
  walletAddress,
  amount,
  amountError,
  messageRequest,
  showEnsCopied,
  showAddressCopied,
  onAmountChange,
  onMessageRequestChange,
  onCopyEns,
  onCopyAddress,
}: PrivatePaymentFieldsProps) => {
  return (
    <>
      {/* ENS Name (if available) */}
      {ensName && (
        <div className="mb-4">
          <div className="text-base/6 font-medium text-white mb-2 block">
            ENS Name
          </div>
          <div className="relative">
            <div className="bg-gray-700/35 rounded-lg p-3 pr-12">
              <span className="text-white font-mono text-sm">{ensName}</span>
            </div>
            <button
              onClick={onCopyEns}
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
              {walletAddress ? shortString(walletAddress) : "No address"}
            </span>
          </div>
          <button
            onClick={onCopyAddress}
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
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
          />
          {amountError && (
            <div className="text-red-400 text-sm mt-1">{amountError}</div>
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
            onChange={(e) => onMessageRequestChange(e.target.value)}
            placeholder="e.g., Invoice #123, Coffee payment..."
            maxLength={32}
          />
        </Field>
      </div>
    </>
  );
};
