import { primaryButtonStyle } from "../Button";
import { SpendModal } from "@src/components/Modals/SpendModal";
import { ShareIcon } from "./ShareIcon";
import { shortHex } from "@src/utils/common";
import { useSendModal } from "./hooks/useSendModal";
import { useCopyAddress } from "./hooks/useCopyAddress";
import { formatUnits } from "viem";
import { WalletContext } from "@src/context/wallet.context";
import { useContext } from "react";

export default function WalletTab() {
  const { showCopiedTooltip, handleCopyAddress, address } = useCopyAddress();
  const { balance, isLoading, error, decimals } = useContext(WalletContext);
  const {
    isModalOpen,
    isModalLoading,
    isModalSuccess,
    isModalError,
    form,
    onModalOpen,
    handleSend,
    handleBack,
  } = useSendModal(decimals);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pt-4">
      <div className="text-2xl font-bold text-white mb-4">Balance (USD)</div>
      {error && <div className="text-white">{error.message}</div>}
      {isLoading && (
        <div className="w-48 h-12 bg-gray-700 rounded-lg animate-pulse" />
      )}
      {!isLoading && !error && (
        <div className="text-4xl h-12 font-extrabold text-white">{`$${formatUnits(balance, decimals)}`}</div>
      )}
      <div className="flex items-center gap-2 mt-2 mb-4 relative">
        <a
          href={`https://sepolia-optimism.etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg text-gray-300 hover:text-gray-200 transition-colors"
        >
          {shortHex(address)}
        </a>
        <div className="relative">
          <ShareIcon onClick={handleCopyAddress} />
          {showCopiedTooltip && (
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-base px-2 py-1 rounded-md whitespace-nowrap">
              Address copied!
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-6 mt-8">
        <button
          onClick={onModalOpen}
          className={`${primaryButtonStyle} w-32 h-12 text-lg flex items-center justify-center rounded-xl`}
        >
          Send
        </button>
      </div>

      <SpendModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSuccess={isModalSuccess}
        isError={isModalError}
        onSend={handleSend}
        onBack={handleBack}
        formMethods={form}
      />
    </div>
  );
}
