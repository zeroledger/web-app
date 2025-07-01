import { useDepositModal } from "./hooks/useDepositModal";
import DepositModal from "./DepositModal";
import { useCollaborativeRedemption } from "./hooks/useCollaborativeRedemption";
import { usePruneModal } from "./hooks/usePruneModal";
import { useFaucet } from "./hooks/useFaucet";
import PruneConfirmModal from "./PruneConfirmModal";
import { ArrowIcon } from "@src/components/svg/ArrowIcon";
import { QuestionIcon } from "@src/components/svg/QuestionIcon";
import { TrashIcon } from "@src/components/svg/TrashIcon";
import { FaucetIcon } from "@src/components/svg/FaucetIcon";
import { Loader } from "@src/components/Loader";

export default function MenuTab() {
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

  const { isRedeeming, safeCollaborativeRedemption } =
    useCollaborativeRedemption();

  const { isPruneModalOpen, onPruneModalOpen, onPruneModalClose, handlePrune } =
    usePruneModal();

  const { isFauceting, handleFaucet, amount } = useFaucet();

  const buttonStyle =
    "w-full h-14 text-2xl flex items-center justify-between pl-6 pr-6 bg-transparent text-white font-semibold focus:outline-none transition";

  const disabledButtonStyle =
    isRedeeming || isFauceting ? "opacity-50 cursor-not-allowed" : "";

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center">
        {isRedeeming && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <Loader />
            <div className="text-white md:text-lg text-xl mt-2">
              Redeeming...
            </div>
          </div>
        )}
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
          onClick={safeCollaborativeRedemption}
          disabled={isRedeeming || isFauceting}
        >
          Withdraw
          <ArrowIcon rotate={90} />
        </button>
        <button
          onClick={onDepositModalOpen}
          className={`${buttonStyle} ${disabledButtonStyle}`}
          disabled={isRedeeming || isFauceting}
        >
          Deposit
          <ArrowIcon />
        </button>
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          disabled={isRedeeming || isFauceting}
        >
          F.A.Q
          <QuestionIcon />
        </button>
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          onClick={onPruneModalOpen}
          disabled={isRedeeming || isFauceting}
        >
          Prune Wallet
          <TrashIcon />
        </button>
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          onClick={handleFaucet}
          disabled={isRedeeming || isFauceting}
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

      <PruneConfirmModal
        isOpen={isPruneModalOpen}
        onConfirm={handlePrune}
        onCancel={onPruneModalClose}
      />
    </div>
  );
}
