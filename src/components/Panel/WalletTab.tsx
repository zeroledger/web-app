import { primaryButtonStyle } from "../Button";
import { TwoStepSpendModal } from "@src/components/Modals/TwoStepSpendModal";
import { ShareIcon } from "./ShareIcon";
import { shortString, formatBalance } from "@src/utils/common";
import { useTwoStepSpendModal } from "./hooks/useTwoStepSpendModal";
import { useCopyAddress } from "./hooks/useCopyAddress";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useContext } from "react";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { useMetadata } from "@src/hooks/useMetadata";
import { TOKEN_ADDRESS } from "@src/common.constants";

export default function WalletTab() {
  const { privateBalance, isConnecting, error, blocksToSync } =
    useContext(LedgerContext);
  const { evmClientService } = useContext(EvmClientsContext);
  const { decimals, isMetadataLoading } = useMetadata(
    TOKEN_ADDRESS,
    evmClientService,
  );
  const isLoading = isMetadataLoading || isConnecting;
  const address = evmClientService!.writeClient!.account.address!;
  const { showCopiedTooltip, handleCopyAddress } = useCopyAddress(address);
  const {
    isModalOpen,
    isModalLoading,
    isModalSuccess,
    isModalError,
    form,
    onModalOpen,
    handleFormSubmit,
    handleSign,
    handleBack,
    currentStep,
    metaTransactionData,
  } = useTwoStepSpendModal(decimals);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pt-4">
      <div className="text-2xl font-bold text-white mb-4">Private Balance:</div>
      {error && <div className="text-white">{error.message}</div>}
      {isConnecting && (
        <>
          <div className="w-48 h-12 bg-gray-700 rounded-lg animate-pulse" />
          <div className="mt-1">
            Syncing{" "}
            {blocksToSync && blocksToSync > 0n
              ? `${blocksToSync.toString()} blocks`
              : ""}
          </div>
        </>
      )}
      {!isLoading && !error && (
        <div className="text-4xl h-12 font-extrabold text-white">{`$${formatBalance(privateBalance, decimals)}`}</div>
      )}
      <div className="flex items-center gap-2 mt-2 mb-4 relative">
        <a
          href={`https://sepolia-optimism.etherscan.io/address/${address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg text-gray-300 hover:text-gray-200 transition-colors"
        >
          {shortString(address)}
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

      <TwoStepSpendModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSuccess={isModalSuccess}
        isError={isModalError}
        onFormSubmit={handleFormSubmit}
        onSign={handleSign}
        onBack={handleBack}
        formMethods={form}
        currentStep={currentStep}
        type="Payment"
        metaTransactionData={metaTransactionData}
      />
    </div>
  );
}
