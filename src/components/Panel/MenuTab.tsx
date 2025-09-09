import { DepositModal } from "@src/components/Modals/DepositModal";
import { MoreModal } from "@src/components/Modals/MoreModal";
import { ArrowIcon } from "@src/components/svg/ArrowIcon";
import { FaucetIcon } from "@src/components/svg/FaucetIcon";
import ThreeDots from "@src/components/svg/ThreeDots";
import { Loader } from "@src/components/Loader";

import { useFaucet } from "./hooks/useFaucet";
import { useContext } from "react";
import { TwoStepSpendModal } from "@src/components/Modals/TwoStepSpendModal";
import { useTwoStepWithdrawModal } from "./hooks/useWithdrawModal";
import { useMultiStepDepositModal } from "./hooks/useDepositModal";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { useModal } from "@src/hooks/useModal";
import { menuButtonStyle } from "@src/components/Button";

export default function MenuTab() {
  const { decimals, isLoading } = useContext(PanelContext);
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

  const { isFauceting, handleFaucet, amount } = useFaucet();

  const buttonStyle = `${menuButtonStyle} w-full h-14 text-2xl`;

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
      <div className="flex flex-col w-full mt-auto px-6">
        <button
          className={buttonStyle}
          onClick={onWithdrawModalOpen}
          disabled={isFauceting || isLoading}
        >
          Withdraw
          <ArrowIcon rotate={90} />
        </button>
        <button
          onClick={onDepositModalOpen}
          className={buttonStyle}
          disabled={isFauceting || isLoading}
        >
          Deposit
          <ArrowIcon />
        </button>
        <button
          className={buttonStyle}
          onClick={handleFaucet}
          disabled={isFauceting || isLoading}
        >
          Faucet
          <FaucetIcon className="mr-1" />
        </button>
        <button
          className={buttonStyle}
          onClick={onMoreModalOpen}
          disabled={isFauceting || isLoading}
        >
          More
          <ThreeDots className="w-8 h-8" />
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
        isFauceting={isFauceting}
        isLoading={isLoading}
      />
    </div>
  );
}
