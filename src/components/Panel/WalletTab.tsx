import { primaryButtonStyle } from "../Button";
import { TwoStepSpendModal } from "@src/components/Modals/TwoStepSpendModal";
import { formatBalance } from "@src/utils/common";
import { useTwoStepSpendModal } from "./hooks/useSpendModal";
import { useCopyAddress } from "./hooks/useCopyAddress";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useContext } from "react";
import { useMetadata } from "@src/hooks/useMetadata";
import { TOKEN_ADDRESS } from "@src/common.constants";
import { useEnsProfile } from "../EnsProfile/useEnsProfile";
import { Avatar } from "../EnsProfile/Avatar";
import { Name } from "../EnsProfile/Name";
import { Address } from "viem";

export default function WalletTab() {
  const { privateBalance, isConnecting, error, blocksToSync } =
    useContext(LedgerContext);
  const { evmClients, wallet, isWalletChanged, chainSupported } =
    useContext(LedgerContext);
  const { decimals, isMetadataLoading } = useMetadata(
    TOKEN_ADDRESS,
    isWalletChanged,
    chainSupported,
    evmClients,
  );

  console.log("decimals", decimals);
  const address = wallet!.address as Address;
  const { data: ensProfile, isLoading: isEnsLoading } = useEnsProfile(address);

  const isLoading = isMetadataLoading || isConnecting || isEnsLoading;

  const { showCopiedTooltip, handleCopyAddress } = useCopyAddress(address);
  const {
    isModalOpen,
    isModalLoading,
    isModalSuccess,
    errorMessage,
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
      <a
        href={`https://sepolia-optimism.etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="hover:cursor-pointer"
      >
        {!isLoading && (
          <Avatar
            avatar={ensProfile?.avatar}
            className="h-15 w-15 rounded-full"
          />
        )}
        {isLoading && (
          <div className="bg-gray-700 h-15 w-15 rounded-full animate-pulse" />
        )}
      </a>
      <div
        className="flex items-center gap-2 relative my-3 hover:cursor-pointer"
        onClick={handleCopyAddress}
      >
        {!isLoading && (
          <Name
            className="text-center text-2xl"
            name={ensProfile?.name}
            address={address}
          />
        )}
        {isLoading && (
          <div className="flex flex-col gap-1">
            <div className="h-8 w-38 bg-gray-700 animate-pulse rounded" />
            <div className="h-4 w-38 bg-gray-700 animate-pulse rounded" />
          </div>
        )}
        {showCopiedTooltip && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-base px-2 py-1 rounded-md whitespace-nowrap">
            Address copied!
          </div>
        )}
      </div>
      {error && <div className="text-white">{error.message}</div>}
      {isLoading && (
        <>
          <div className="h-12 animate-pulse flex items-center justify-center">
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
      <div className="flex gap-6 mt-8">
        <button
          onClick={onModalOpen}
          className={`${primaryButtonStyle} w-32 h-12 text-lg flex items-center justify-center rounded-xl`}
          disabled={isLoading}
        >
          Send
        </button>
      </div>

      <TwoStepSpendModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSuccess={isModalSuccess}
        errorMessage={errorMessage}
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
