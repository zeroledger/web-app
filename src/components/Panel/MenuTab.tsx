import { DepositModal } from "@src/components/Modals/DepositModal";
import { ConfirmModal } from "@src/components/Modals/ConfirmModal";
import { ArrowIcon } from "@src/components/svg/ArrowIcon";
import { QuestionIcon } from "@src/components/svg/QuestionIcon";
import { TrashIcon } from "@src/components/svg/TrashIcon";
import { FaucetIcon } from "@src/components/svg/FaucetIcon";
import { Loader } from "@src/components/Loader";

import { useResetWalletModal } from "./hooks/useResetWalletModal";
import { useFaucet } from "./hooks/useFaucet";
import { useContext } from "react";
import { TwoStepSpendModal } from "@src/components/Modals/TwoStepSpendModal";
import { useTwoStepWithdrawModal } from "./hooks/useWithdrawModal";
import { useMultiStepDepositModal } from "./hooks/useDepositModal";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { LANDING_URL } from "@src/common.constants";

export default function MenuTab() {
  const { decimals, isLoading } = useContext(PanelContext);
  const {
    isModalOpen: isDepositModalOpen,
    isModalLoading: isDepositModalLoading,
    isModalSuccess: isDepositModalSuccess,
    isModalError: isDepositModalError,
    currentStep: depositCurrentStep,
    form: depositForm,
    onModalOpen: onDepositModalOpen,
    handleFormSubmit: handleDepositFormSubmit,
    handleParamsApprove: handleDepositParamsApprove,
    handleSign: handleDepositSign,
    handleBack: handleDepositBack,
    depositParamsData,
    metaTransactionData,
  } = useMultiStepDepositModal(decimals);

  const {
    isModalOpen,
    isModalLoading,
    isModalSuccess,
    errorMessage,
    currentStep: withdrawCurrentStep,
    form,
    onModalOpen: onWithdrawModalOpen,
    handleFormSubmit: handleWithdrawFormSubmit,
    handleSign: handleWithdrawSign,
    handleBack: handleWithdrawBack,
    metaTransactionData: withdrawMetaTransactionData,
  } = useTwoStepWithdrawModal(decimals);

  const {
    isResetWalletModalOpen,
    onResetWalletModalOpen,
    onResetWalletModalClose,
    handleResetWallet,
  } = useResetWalletModal();

  const { isFauceting, handleFaucet, amount } = useFaucet();

  const buttonStyle =
    "w-full h-14 text-2xl flex items-center justify-between pl-6 pr-6 bg-transparent text-white/80 hover:text-white/90 font-semibold focus:outline-none transition hover:cursor-pointer";

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
        <a
          href={`${LANDING_URL}/#faq`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonStyle}
        >
          F.A.Q
          <QuestionIcon className="w-6 h-6" />
        </a>
        <button
          className={`${buttonStyle} ${disabledButtonStyle}`}
          onClick={onResetWalletModalOpen}
          disabled={isFauceting || isLoading}
        >
          Reset Wallet
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
        onFormSubmit={handleDepositFormSubmit}
        onApprove={handleDepositParamsApprove}
        onSign={handleDepositSign}
        onBack={handleDepositBack}
        currentStep={depositCurrentStep}
        formMethods={depositForm}
        isError={isDepositModalError}
        metaTransactionData={metaTransactionData}
        depositParamsData={depositParamsData}
      />

      <ConfirmModal
        isOpen={isResetWalletModalOpen}
        onConfirm={handleResetWallet}
        onCancel={onResetWalletModalClose}
        title="Confirm Wallet Reset"
        description="This will permanently delete all your wallet data. This action cannot be undone."
        buttonText="Reset Wallet"
      />

      <TwoStepSpendModal
        isOpen={isModalOpen}
        isLoading={isModalLoading}
        isSuccess={isModalSuccess}
        currentStep={withdrawCurrentStep}
        onFormSubmit={handleWithdrawFormSubmit}
        onSign={handleWithdrawSign}
        onBack={handleWithdrawBack}
        formMethods={form}
        errorMessage={errorMessage}
        type="Withdraw"
        metaTransactionData={withdrawMetaTransactionData}
      />
    </div>
  );
}
