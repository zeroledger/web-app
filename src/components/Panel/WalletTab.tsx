import { useContext } from "react";
import { type Address } from "viem";
import clsx from "clsx";

import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";

import { primaryButtonStyle } from "@src/components/styles/Button.styles";
import { TwoStepSpendModal } from "@src/components/Modals/TwoStepSpendModal";
import { ReceiveModal } from "@src/components/Modals/ReceiveModal";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { useCopyAddress } from "@src/components/Modals/ReceiveModal";

import { formatBalance } from "@src/utils/common";

import { SCAN_URL } from "@src/common.constants";

import { useTwoStepSpendModal } from "./hooks/useSpendModal";
import { useReceiveModal } from "./hooks/useReceiveModal";
import { Avatar } from "../EnsProfile/Avatar";
import { Name } from "../EnsProfile/Name";

export default function WalletTab() {
  const {
    privateBalance,
    error,
    blocksToSync,
    decimals,
    isLoading,
    consolidationRatio,
    balanceForConsolidation,
  } = useContext(PanelContext);
  const { wallet } = useWalletAdapter();
  const { ensProfile, isEnsLoading, targetChain } = useContext(LedgerContext);

  const address = wallet?.address as Address | undefined;

  const { showCopiedTooltip, handleCopyAddress } = useCopyAddress(address);
  const {
    state,
    setState,
    form,
    onModalOpen,
    handleFormSubmit,
    handleSign,
    handleBack,
    onConsolidationOpen,
  } = useTwoStepSpendModal(decimals, address!, balanceForConsolidation);
  const { isReceiveModalOpen, onReceiveModalOpen, onReceiveModalClose } =
    useReceiveModal();

  return (
    <div className="flex flex-col items-center gap-4 justify-center h-full px-4 pt-4">
      <a
        href={`${SCAN_URL[targetChain.id]}/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-4 relative hover:cursor-pointer"
        onClick={(e) => {
          // Allow the link to work, but also show copy tooltip on click
          e.preventDefault();
          handleCopyAddress();
          // Open the link after a short delay to show the copy feedback
          setTimeout(() => {
            window.open(
              `${SCAN_URL[targetChain.id]}/address/${address}`,
              "_blank",
              "noopener,noreferrer",
            );
          }, 100);
        }}
      >
        {!isEnsLoading && (
          <Avatar
            avatar={ensProfile?.avatar}
            address={address}
            className="h-15 w-15 rounded-lg"
          />
        )}
        {isEnsLoading && (
          <div className="bg-gray-700 h-15 w-15 rounded-lg animate-pulse" />
        )}
        {!isEnsLoading && address && (
          <Name
            className={clsx("text-center", {
              "text-2xl": ensProfile?.name,
              "text-lg": !ensProfile?.name,
            })}
            name={ensProfile?.name}
            address={address}
          />
        )}
        {isEnsLoading && (
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
      </a>
      {error && <div className="text-white">{error.message}</div>}
      {isLoading && (
        <>
          <div className="h-10 animate-pulse flex items-center justify-center text-lg">
            {blocksToSync && blocksToSync > 0n
              ? `Syncing ${blocksToSync.toString()} blocks...`
              : ""}
          </div>
        </>
      )}
      {!isLoading && !error && (
        <div className="text-4xl h-10 font-extrabold text-white">{`$${formatBalance(privateBalance, decimals)}`}</div>
      )}
      {!isLoading && !error && consolidationRatio < 1 && (
        <div className="text-sm text-yellow-100/70 text-center px-4">
          To spend more than {Math.round(consolidationRatio * 100)}% of account
          balance you need first{" "}
          <button
            onClick={onConsolidationOpen}
            className="text-white/70 hover:cursor-pointer underline hover:text-white"
          >
            consolidate
          </button>{" "}
          your commitments.
        </div>
      )}
      <div className="flex gap-6 mt-2">
        <button
          onClick={onModalOpen}
          className={`${primaryButtonStyle} text-lg flex items-center justify-center rounded-xl`}
          disabled={isLoading}
        >
          Send
        </button>
        <button
          onClick={onReceiveModalOpen}
          className={`${primaryButtonStyle} text-lg flex items-center justify-center rounded-xl`}
          disabled={isLoading}
        >
          Receive
        </button>
      </div>

      <TwoStepSpendModal
        state={state}
        setState={setState}
        onFormSubmit={handleFormSubmit}
        onSign={handleSign}
        onBack={handleBack}
        formMethods={form}
        type="Payment"
      />

      <ReceiveModal isOpen={isReceiveModalOpen} onClose={onReceiveModalClose} />
    </div>
  );
}
