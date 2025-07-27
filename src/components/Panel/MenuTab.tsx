import { DepositModal } from "@src/components/Modals/DepositModal";
import { PruneModal } from "@src/components/Modals/PruneModal";
import { ArrowIcon } from "@src/components/svg/ArrowIcon";
import { QuestionIcon } from "@src/components/svg/QuestionIcon";
import { TrashIcon } from "@src/components/svg/TrashIcon";
import { FaucetIcon } from "@src/components/svg/FaucetIcon";
import { Loader } from "@src/components/Loader";

import { usePruneModal } from "./hooks/usePruneModal";
import { useDepositModal } from "./hooks/useDepositModal";
import { useFaucet } from "./hooks/useFaucet";
import { useWithdrawModal } from "./hooks/useWithdrawModal";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useContext } from "react";
import { SpendModal } from "../Modals/SpendModal";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { useMetadata } from "@src/hooks/useMetadata";
import { TOKEN_ADDRESS } from "@src/common.constants";

export default function MenuTab() {
  const { isConnecting } = useContext(LedgerContext);
  const { evmClientService } = useContext(EvmClientsContext);
  const { decimals, isMetadataLoading } = useMetadata(
    TOKEN_ADDRESS,
    evmClientService,
  );
  const isLoading = isMetadataLoading || isConnecting;
  const {
    isDepositModalOpen,
    isDepositModalLoading,
    isDepositModalSuccess,
    isDepositModalError,
    depositForm,
    onDepositModalOpen,
    handleDeposit,
    handleDepositBack,
  } = useDepositModal();

  const {
    isModalOpen,
    isModalLoading,
    isModalSuccess,
    isModalError,
    form,
    onModalOpen: onWithdrawModalOpen,
    handleWithdraw,
    handleBack: handleWithdrawBack,
  } = useWithdrawModal(decimals);

  const { isPruneModalOpen, onPruneModalOpen, onPruneModalClose, handlePrune } =
    usePruneModal();

  const { isFauceting, handleFaucet, amount } = useFaucet();

  const buttonStyle =
    "w-full h-14 text-2xl flex items-center justify-between pl-6 pr-6 bg-transparent text-white font-semibold focus:outline-none transition";

  const disabledButtonStyle = isFauceting
    ? "opacity-50 cursor-not-allowed"
    : "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center">
        {isFauceting && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <Loader />
            <div className="text-white md:text-lg text-xl mt-2">
              {`Sending ${amount} Test USD onchain...`}
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-col w-full mt-auto">
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          onClick={onWithdrawModalOpen}
          disabled={isFauceting || isLoading}
        >
          Withdraw
          <ArrowIcon rotate={90} />
        </button>
        <button
          onClick={onDepositModalOpen}
          className={`${buttonStyle} ${disabledButtonStyle}`}
          disabled={isFauceting || isLoading}
        >
          Deposit
          <ArrowIcon />
        </button>
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          disabled={isFauceting || isLoading}
        >
          F.A.Q
          <QuestionIcon />
        </button>
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          onClick={onPruneModalOpen}
          disabled={isFauceting || isLoading}
        >
          Prune Wallet
          <TrashIcon />
        </button>
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          onClick={handleFaucet}
          disabled={isFauceting || isLoading}
        >
          Faucet
          <FaucetIcon className="mr-1" />
        </button>
      </div>

      <DepositModal
        isOpen={isDepositModalOpen}
        isLoading={isDepositModalLoading}
        isSuccess={isDepositModalSuccess}
        onDeposit={handleDeposit}
        onBack={handleDepositBack}
        formMethods={depositForm}
        isError={isDepositModalError}
      />

      <PruneModal
        isOpen={isPruneModalOpen}
        onConfirm={handlePrune}
        onCancel={onPruneModalClose}
      />

      <SpendModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSuccess={isModalSuccess}
        onSpend={handleWithdraw}
        onBack={handleWithdrawBack}
        formMethods={form}
        isError={isModalError}
        type="Withdraw"
      />
    </div>
  );
}
