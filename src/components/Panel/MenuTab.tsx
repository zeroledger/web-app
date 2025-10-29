import { DepositModal } from "@src/components/Modals/DepositModal";
import { MoreModal } from "@src/components/Modals/MoreModal";
import PointsModal from "@src/components/Modals/PointsModal";
import { HiOutlineSparkles, HiDotsHorizontal } from "react-icons/hi";
import { ArrowIcon } from "@src/components/svg";
import { TbDroplet } from "react-icons/tb";
// Loader moved into FaucetStatus
import FaucetStatus from "@src/components/Panel/FaucetStatus";

import { useFaucet } from "./hooks/useFaucet";
import { useContext } from "react";
import { TwoStepSpendModal } from "@src/components/Modals/TwoStepSpendModal";
import { useTwoStepWithdrawModal } from "./hooks/useWithdrawModal";
import { useMultiStepDepositModal } from "./hooks/useDepositModal";
import { usePointsModal } from "./hooks/usePointsModal";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { useModal } from "@src/hooks/useModal";
import { menuButtonStyle } from "@src/components/styles/Button.styles";

export default function MenuTab() {
  const { decimals, isLoading, publicBalance, symbol } =
    useContext(PanelContext);
  const {
    state: depositState,
    form: depositForm,
    onModalOpen: onDepositModalOpen,
    handleFormSubmit: handleDepositFormSubmit,
    handleParamsApprove: handleDepositParamsApprove,
    handleSign: handleDepositSign,
    handleBack: handleDepositBack,
    setState: setDepositState,
  } = useMultiStepDepositModal(decimals);

  const {
    state: withdrawState,
    setState: setWithdrawState,
    form: withdrawForm,
    onModalOpen: onWithdrawModalOpen,
    handleFormSubmit: handleWithdrawFormSubmit,
    handleSign: handleWithdrawSign,
    handleBack: handleWithdrawBack,
  } = useTwoStepWithdrawModal(decimals);

  const {
    isOpen: isMoreModalOpen,
    openModal: onMoreModalOpen,
    closeModal: onMoreModalClose,
  } = useModal();

  const {
    state: pointsState,
    setState: setPointsState,
    form: pointsForm,
    onModalOpen: onPointsModalOpen,
    handleFormSubmit: handlePointsFormSubmit,
    handleBack: handlePointsBack,
  } = usePointsModal();

  const {
    isFauceting,
    handleFaucet,
    amount,
    isFaucetSuccess,
    faucetErrorMessage,
  } = useFaucet(publicBalance, symbol);

  const buttonStyle = `${menuButtonStyle} w-full h-14 text-2xl`;

  const isFaucetActive = isFauceting || isFaucetSuccess || !!faucetErrorMessage;

  return (
    <div className="flex flex-col h-full">
      <FaucetStatus
        isFauceting={isFauceting}
        amount={amount}
        isFaucetSuccess={isFaucetSuccess}
        errorMessage={faucetErrorMessage}
        symbol={symbol}
      />
      <div className="flex flex-col w-full mt-auto px-6">
        <button
          className={buttonStyle}
          onClick={onWithdrawModalOpen}
          disabled={isFaucetActive || isLoading}
        >
          Withdraw
          <ArrowIcon rotate={90} className="w-6 h-6" />
        </button>
        <button
          onClick={onDepositModalOpen}
          className={buttonStyle}
          disabled={isFaucetActive || isLoading}
        >
          Deposit
          <ArrowIcon className="w-6 h-6" />
        </button>
        <button
          className={buttonStyle}
          onClick={handleFaucet}
          disabled={isFaucetActive || isLoading}
        >
          Faucet
          <TbDroplet />
        </button>
        <button
          className={buttonStyle}
          onClick={onPointsModalOpen}
          disabled={true}
        >
          Points
          <HiOutlineSparkles />
        </button>
        <button
          className={buttonStyle}
          onClick={onMoreModalOpen}
          disabled={isFaucetActive || isLoading}
        >
          More
          <HiDotsHorizontal />
        </button>
      </div>

      <DepositModal
        onFormSubmit={handleDepositFormSubmit}
        onApprove={handleDepositParamsApprove}
        onSign={handleDepositSign}
        onBack={handleDepositBack}
        formMethods={depositForm}
        state={depositState}
        setState={setDepositState}
      />

      <TwoStepSpendModal
        state={withdrawState}
        setState={setWithdrawState}
        onFormSubmit={handleWithdrawFormSubmit}
        onSign={handleWithdrawSign}
        onBack={handleWithdrawBack}
        formMethods={withdrawForm}
        type="Withdraw"
      />

      <MoreModal
        isOpen={isMoreModalOpen}
        onClose={onMoreModalClose}
        isFaucetActive={isFaucetActive}
        isLoading={isLoading}
      />

      <PointsModal
        state={pointsState}
        setState={setPointsState}
        formMethods={pointsForm}
        onFormSubmit={handlePointsFormSubmit}
        handleBack={handlePointsBack}
      />
    </div>
  );
}
