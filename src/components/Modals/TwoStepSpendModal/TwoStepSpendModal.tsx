import { useMemo, useState } from "react";
import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { SuccessMessage } from "@src/components/Modals/SuccessMessage";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { UseFormReturn } from "react-hook-form";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { SpendForm } from "./SpendForm";
import { SigningPreview } from "@src/components/SigningPreview";
import {
  prepareSigningData,
  prepareMinimalTransactionDetails,
  prepareFullTransactionDetails,
} from "./TwoStepSpendModal.utils";
import { SecondStepExtraContent } from "./SecondStepExtraContent";
import { type SpendModalState } from "@src/components/Panel/hooks/useSpendModal";
import { type WithdrawModalState } from "@src/components/Panel/hooks/useWithdrawModal";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { useContext } from "react";
import { BaseModal } from "@src/components/Modals/BaseModal";

interface SpendFormData {
  recipient: string;
  amount: string;
}

type TwoStepSpendModalProps = {
  state: SpendModalState | WithdrawModalState;
  setState: React.Dispatch<
    React.SetStateAction<SpendModalState | WithdrawModalState>
  >;
  onFormSubmit: (data: SpendFormData) => void;
  onSign: () => void;
  onBack: () => void;
  formMethods: UseFormReturn<SpendFormData>;
  type: "Payment" | "Withdraw";
  decimals?: number;
};

function TwoStepSpendModal({
  state,
  setState,
  onFormSubmit,
  onSign,
  onBack,
  formMethods,
  type,
}: TwoStepSpendModalProps) {
  const { decimals } = useContext(PanelContext);
  const { handleSubmit } = formMethods;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const style = useDynamicHeight("h-dvh");

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onFormSubmit)();
    }
  };

  const [withdrawAll, setWithdrawAll] = useState<boolean>(false);

  const {
    isModalOpen,
    isModalLoading,
    isModalSuccess,
    errorMessage,
    step,
    metaTransaction,
    transactionDetails,
  } = state;

  const signingData = useMemo(
    () => prepareSigningData(metaTransaction),
    [metaTransaction],
  );

  const fullTransactionDetails = useMemo(
    () =>
      prepareFullTransactionDetails(
        transactionDetails,
        (state as WithdrawModalState).spendFees?.paymasterAddress,
      ),
    [transactionDetails, state],
  );

  const minimalTransactionDetails = useMemo(
    () =>
      prepareMinimalTransactionDetails(
        transactionDetails,
        withdrawAll
          ? (state as WithdrawModalState).withdrawFees?.withdrawFee
          : (state as SpendModalState).spendFees?.spendFee,
        withdrawAll
          ? (state as WithdrawModalState).withdrawFees?.fee
          : (state as SpendModalState).spendFees?.fee,
        decimals,
      ),
    [transactionDetails, decimals, withdrawAll, state],
  );

  const shouldShowForm =
    step === "form" && !isModalSuccess && !isModalLoading && !errorMessage;

  const shouldShowPreview =
    step === "preview" && !isModalSuccess && !isModalLoading && !errorMessage;

  return (
    <BaseModal
      isOpen={isModalOpen}
      onClose={onBack}
      closeOnEscape={true}
      closeOnOverlayClick={false}
      contentClassName="relative justify-center overflow-y-auto"
      style={style}
    >
      <div className="px-6 py-5 h-full flex-col content-center">
        {errorMessage && (
          <div className="flex-1 content-center flex-col justify-center animate-fade-in">
            <ErrorMessage message={errorMessage} />
          </div>
        )}

        {isModalLoading && (
          <div className="flex-1 content-center flex justify-center animate-fade-in">
            <Loader />
          </div>
        )}

        {isModalSuccess && (
          <div className="flex-1 content-center flex-col justify-center animate-fade-in">
            <SuccessMessage message={`${type} Successful!`} />
          </div>
        )}
        {!isModalLoading && !isModalSuccess && !errorMessage && (
          <BackButton onClick={onBack} />
        )}
        {shouldShowForm && (
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            onKeyDown={onEnter}
            className="flex pt-20"
          >
            <SpendForm
              formMethods={formMethods}
              onEnter={onEnter}
              type={type}
              setState={setState}
              withdrawAll={withdrawAll}
              setWithdrawAll={setWithdrawAll}
              isModalOpen={isModalOpen}
            />
          </form>
        )}

        {shouldShowPreview && (
          <div className="flex flex-col pt-12 pb-1">
            <SigningPreview
              isSigning={isModalLoading}
              isSuccess={isModalSuccess}
              title={`Sign & Send ${type} Meta Transaction`}
              description={`Review the transaction details before signing. This action cannot be undone`}
              messageData={signingData}
              onSign={onSign}
              buttonText={`Sign & Send`}
              successText={`${type} Successful!`}
              extraContent={
                <SecondStepExtraContent
                  isDetailsOpen={isDetailsOpen}
                  setIsDetailsOpen={setIsDetailsOpen}
                  fullTransactionDetails={fullTransactionDetails}
                  minimalTransactionDetails={minimalTransactionDetails}
                />
              }
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
}

export default TwoStepSpendModal;
