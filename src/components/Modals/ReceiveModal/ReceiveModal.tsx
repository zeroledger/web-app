import { BackButton } from "@src/components/Buttons/BackButton";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { useEnsProfile } from "@src/context/ledger/useEnsProfile";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { useCopyAddress, useCopyEns } from ".";
import { shortString } from "@src/utils/common";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { BaseModal } from "@src/components/Modals/BaseModal";
import { useState } from "react";
import { Field, Label, Input } from "@headlessui/react";
import { primaryInputStyle } from "@src/components/styles/Input.styles";

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

  const amountRegex = /^\d*\.?\d*$/;

  const handleAmountChange = (value: string) => {
    if (!amountRegex.test(value)) return;
    setAmount(value);
    setAmountError("");
  };

  const generateQRData = () => {
    if (!wallet?.address) return "";

    if (amount && parseFloat(amount) > 0) {
      // Include both address and amount in QR code
      return `zeroledger:address=${wallet.address}&amount=${amount}`;
    }

    // Just the address if no amount specified
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
          <div className="flex justify-center mb-8">
            <QRCodeDisplay value={generateQRData()} size={192} />
          </div>

          {/* Amount Input */}
          <div className="mb-6">
            <Field>
              <Label className="text-base/6 font-medium text-white mb-2 block">
                Request Amount (USD)
              </Label>
              <Input
                type="text"
                className={primaryInputStyle}
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
              />
              {amountError && (
                <div className="text-red-400 text-sm mt-1">{amountError}</div>
              )}
              <div className="text-sm text-white/60 mt-1">
                Leave empty to receive any amount
              </div>
            </Field>
          </div>

          {/* User Profile Section */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            {/* ENS Name (if available) */}
            {ensProfile?.name && (
              <div className="mb-4">
                <div className="block text-gray-400 text-sm mb-2">ENS Name</div>
                <div className="relative">
                  <div className="bg-gray-700 rounded-lg p-3 pr-12">
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
            <div>
              <div className="block text-gray-400 text-sm mb-2">
                Wallet Address
              </div>
              <div className="relative">
                <div className="bg-gray-700 rounded-lg p-3 pr-12">
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
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
