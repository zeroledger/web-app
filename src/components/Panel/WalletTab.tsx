import { primaryButtonStyle } from "../Button";
import { SpendModal } from "@src/components/Modals/SpendModal";
import { ShareIcon } from "./ShareIcon";
import { shortString } from "@src/utils/common";
import { useSendModal } from "./hooks/useSendModal";
import { useCopyAddress } from "./hooks/useCopyAddress";
import { formatUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useContext, useEffect, useState } from "react";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { useMetadata } from "@src/hooks/useMetadata";
import { TOKEN_ADDRESS } from "@src/common.constants";

export default function WalletTab() {
  const { ledgerService, privateBalance, isConnecting, error } =
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
    handleSend,
    handleBack,
  } = useSendModal(decimals);
  const [blocksToSync, setBlocksToSync] = useState<bigint>(0n);

  useEffect(() => {
    const fetchSyncStatus = async () => {
      if (!ledgerService) return;
      const { processedBlock, currentBlock } = await ledgerService.syncStatus();
      setBlocksToSync(currentBlock - processedBlock);
    };
    fetchSyncStatus();
    const interval = setInterval(fetchSyncStatus, 300);
    return () => clearInterval(interval);
  }, [ledgerService, isLoading]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 pt-4">
      <div className="text-2xl font-bold text-white mb-4">Private Balance:</div>
      {error && <div className="text-white">{error.message}</div>}
      {isConnecting && (
        <>
          <div className="w-48 h-12 bg-gray-700 rounded-lg animate-pulse" />
          <div className="mt-1">
            Syncing{" "}
            {blocksToSync > 0n ? `${blocksToSync.toString()} blocks` : ""}
          </div>
        </>
      )}
      {!isLoading && !error && (
        <div className="text-4xl h-12 font-extrabold text-white">{`$${formatUnits(privateBalance, decimals).slice(0, 12)}`}</div>
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

      <SpendModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSuccess={isModalSuccess}
        isError={isModalError}
        onSpend={handleSend}
        onBack={handleBack}
        formMethods={form}
        type="Payment"
      />
    </div>
  );
}
