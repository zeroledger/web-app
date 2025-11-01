import clsx from "clsx";
import { primaryButtonStyles } from "@src/components/styles/Button.styles";
import { WalletIcon } from "@src/components/svg";
import { ReactNode } from "react";
import { Button } from "@headlessui/react";

export interface SigningData {
  label: string;
  value: string | ReactNode;
}

export interface SigningPreviewProps {
  isSigning: boolean;
  isSuccess: boolean;
  error?: Error;
  title: string;
  description: string;
  messageData: SigningData[];
  onSign: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  buttonText?: string;
  successText?: string;
  extraContent?: ReactNode;
}

export default function SigningPreview({
  isSigning,
  isSuccess,
  error,
  title,
  description,
  messageData,
  onSign,
  buttonText = "Sign",
  successText = "Success!",
  extraContent,
}: SigningPreviewProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSign();
      }}
      className="mx-auto w-full transition-all duration-500 ease-in-out"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-gray-400 text-sm">{description}</p>
      </div>

      {/* Wallet Signing Animation */}
      <div className="relative mb-4">
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <WalletIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-medium">Wallet</span>
            </div>
            <div className="text-gray-400 text-sm transition-all duration-300 ease-in-out">
              {isSigning ? "Signing..." : "Ready"}
            </div>
          </div>
        </div>
      </div>

      {/* Message Data */}
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-4">
        <h3 className="text-white font-semibold mb-3">Message Data</h3>
        <div className="space-y-3 text-sm">
          {messageData.map((data) => (
            <div key={data.label} className="flex justify-between">
              <span className="text-gray-400">{data.label}:</span>
              <span className="text-white font-mono">{data.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Messages */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isSuccess || error ? "max-h-32 mb-6" : "max-h-0 mb-0"
        }`}
      >
        {isSuccess && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-center animate-fade-in">
            <div className="text-green-400 font-semibold mb-1">
              {successText}
            </div>
            <div className="text-green-300 text-sm">
              Operation completed successfully
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-center animate-fade-in">
            <div className="text-red-400 font-semibold mb-1">
              {error.message ?? "Unknown error"}
            </div>
            <div className="text-red-300 text-sm">
              Failed to complete operation
            </div>
          </div>
        )}
      </div>

      {/* Warning */}
      {extraContent}

      {/* Sign Button */}
      <div className="flex justify-center mb-4">
        <Button
          className={clsx(
            primaryButtonStyles.regular,
            "w-full",
            (isSigning || isSuccess) && "opacity-50 cursor-not-allowed",
          )}
          disabled={isSigning || isSuccess}
          type="submit"
          autoFocus
        >
          {isSigning ? (
            <div className="flex items-center space-x-2 animate-fade-in">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing...</span>
            </div>
          ) : isSuccess ? (
            <span className="animate-fade-in">Signed</span>
          ) : (
            <span className="animate-fade-in">{buttonText}</span>
          )}
        </Button>
      </div>
    </form>
  );
}
