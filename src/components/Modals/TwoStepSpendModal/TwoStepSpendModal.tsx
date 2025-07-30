import clsx from "clsx";
import { memo, useMemo, useState } from "react";
import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { SuccessMessage } from "@src/components/Modals/SuccessMessage";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { UseFormReturn } from "react-hook-form";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { SpendForm } from "./SpendForm";
import { SigningPreview } from "@src/components/SigningPreview";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { type TransactionDetails } from "@src/services/ledger/ledger.service";
import {
  prepareSigningData,
  prepareTransactionDetails,
} from "./TwoStepSpendModal.utils";

interface SpendFormData {
  recipient: string;
  amount: string;
}

interface TwoStepSpendModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  currentStep: "form" | "preview";
  onFormSubmit: (data: SpendFormData) => void;
  onSign: () => Promise<void>;
  onBack: () => void;
  formMethods: UseFormReturn<SpendFormData>;
  type: "Payment" | "Withdraw";
  metaTransactionData?: {
    metaTransaction?: UnsignedMetaTransaction;
    coveredGas?: string;
    transactionDetails?: TransactionDetails;
  };
  decimals?: number;
}

function TwoStepSpendModal({
  isOpen,
  isLoading,
  isSuccess,
  isError,
  currentStep,
  onFormSubmit,
  onSign,
  onBack,
  formMethods,
  type,
  metaTransactionData,
  decimals,
}: TwoStepSpendModalProps) {
  const { handleSubmit } = formMethods;
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const style = useDynamicHeight("h-dvh");

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onFormSubmit)();
    }
  };

  const getSigningData = useMemo(
    () => prepareSigningData(metaTransactionData?.metaTransaction),
    [metaTransactionData?.metaTransaction],
  );

  const getTransactionDetails = useMemo(
    () =>
      prepareTransactionDetails(
        metaTransactionData?.transactionDetails,
        decimals,
      ),
    [metaTransactionData?.transactionDetails, decimals],
  );

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full",
        "transition-all duration-500 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      style={style}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto">
        <div
          className={clsx(
            "flex flex-col w-full h-full md:w-[50%]",
            "md:max-w-md md:rounded-xl bg-gray-900",
            "relative justify-center",
            "transition-all duration-500 ease-in-out",
            isOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          <div className="px-6">
            {isError && (
              <div className="flex-1 content-center flex-col justify-center py-5 animate-fade-in">
                <ErrorMessage />
              </div>
            )}

            {isLoading && (
              <div className="flex-1 content-center flex justify-center py-5 animate-fade-in">
                <Loader />
              </div>
            )}

            {isSuccess && (
              <div className="flex-1 content-center flex-col justify-center py-5 animate-fade-in">
                <SuccessMessage message={`${type} Successful!`} />
              </div>
            )}

            {!isLoading && !isSuccess && !isError && currentStep === "form" && (
              <div className="flex-1 content-center py-5">
                <BackButton onClick={onBack} />
                <form
                  onSubmit={handleSubmit(onFormSubmit)}
                  onKeyDown={onEnter}
                  className="flex pt-20"
                >
                  <SpendForm
                    formMethods={formMethods}
                    onEnter={onEnter}
                    type={type}
                  />
                </form>
              </div>
            )}

            {!isLoading &&
              !isSuccess &&
              !isError &&
              currentStep === "preview" && (
                <div className="flex-1 content-center py-5">
                  <BackButton onClick={onBack} />
                  <div className="flex flex-col pt-20 pb-6">
                    <SigningPreview
                      isSigning={isLoading}
                      isSuccess={isSuccess}
                      isError={isError}
                      title={`Sign & Send ${type} Meta Transaction`}
                      description={`Review the transaction details before signing`}
                      messageData={getSigningData}
                      onSign={onSign}
                      buttonText={`Sign & Send`}
                      successText={`${type} Successful!`}
                      errorText="Transaction Failed"
                      warningText="This action cannot be undone"
                      extraContent={
                        <div className="bg-gray-700 rounded-lg border border-gray-600 mb-6 overflow-hidden">
                          <button
                            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                            className="w-full text-left p-4 hover:bg-gray-600 transition-colors border-b border-gray-600"
                          >
                            <div className="flex justify-between items-center">
                              <h3 className="text-white font-semibold">
                                Transaction Details
                              </h3>
                              <span className="text-gray-400 text-sm transition-all duration-200">
                                {isDetailsOpen ? "Hide" : "Show"}
                              </span>
                            </div>
                          </button>
                          <div
                            className={clsx(
                              "transition-all duration-300 ease-in-out overflow-hidden",
                              isDetailsOpen
                                ? "max-h-120 opacity-100"
                                : "max-h-0 opacity-0",
                            )}
                          >
                            <div className="p-4">
                              <div className="space-y-3 text-sm">
                                {getTransactionDetails.map((detail) => (
                                  <div
                                    key={detail.label}
                                    className="flex justify-between"
                                  >
                                    <span className="text-gray-400">
                                      {detail.label}:
                                    </span>
                                    <span className="text-white font-mono">
                                      {detail.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    />
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(TwoStepSpendModal);
