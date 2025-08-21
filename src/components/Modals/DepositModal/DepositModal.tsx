import clsx from "clsx";
import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { SuccessMessage } from "@src/components/Modals/SuccessMessage";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { DepositForm } from "./DepositForm";
import { SigningPreview } from "@src/components/SigningPreview";
import { Button } from "@src/components/Button";
import { primaryButtonStyle } from "@src/components/Button";
import { formatEther } from "viem";
import { shortString } from "@src/utils/common";
import { UseFormReturn } from "react-hook-form";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { type TransactionDetails } from "@src/services/ledger";
import { DepositParams } from "@src/utils/vault/types";
import { useMemo } from "react";

interface DepositFormData {
  amount: string;
}

interface DepositModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  currentStep: "form" | "params" | "preview";
  onFormSubmit: (data: DepositFormData) => void;
  onApprove: () => void;
  onSign: () => void;
  onBack: () => void;
  formMethods: UseFormReturn<DepositFormData>;
  metaTransactionData?: {
    metaTransaction?: UnsignedMetaTransaction;
    coveredGas?: string;
    transactionDetails?: TransactionDetails;
  };
  decimals?: number;
  depositParamsData?: {
    depositParams: DepositParams;
    gasToCover: bigint;
  };
}

export default function DepositModal({
  isOpen,
  isLoading,
  isSuccess,
  isError,
  currentStep,
  onFormSubmit,
  onApprove,
  onSign,
  onBack,
  formMethods,
  metaTransactionData,
  depositParamsData,
}: DepositModalProps) {
  const { handleSubmit } = formMethods;

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onFormSubmit)();
    }
  };

  const depositTransactionDetails = useMemo(
    () =>
      metaTransactionData?.transactionDetails
        ? [
            {
              label: "From",
              value: shortString(metaTransactionData.transactionDetails.from),
            },
            {
              label: "To",
              value: shortString(metaTransactionData.transactionDetails.to),
            },
            {
              label: "Vault Contract",
              value: shortString(
                metaTransactionData.transactionDetails.vaultContract,
              ),
            },
            {
              label: "Token",
              value: shortString(metaTransactionData.transactionDetails.token),
            },
            {
              label: "Outputs",
              value: (
                <>
                  {metaTransactionData.transactionDetails.outputs.map(
                    (output) => (
                      <div key={output}>{shortString(output.toString())}</div>
                    ),
                  )}
                </>
              ),
            },
            {
              label: "Amount",
              value: `${formatEther(metaTransactionData.transactionDetails.value)} USD`,
            },
            {
              label: "Fee",
              value: `${formatEther(metaTransactionData.transactionDetails.fee)} USD`,
            },
            {
              label: "Gas",
              value: metaTransactionData.coveredGas,
            },
            {
              label: "Paymaster",
              value: shortString(
                metaTransactionData.transactionDetails.paymaster,
              ),
            },
          ]
        : [],
    [metaTransactionData?.transactionDetails, metaTransactionData?.coveredGas],
  );

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full h-dhv",
        "transition-all duration-500 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center">
        <div
          className={clsx(
            "flex flex-col w-full h-full px-6 md:w-[50%]",
            "md:max-w-md md:rounded-xl bg-gray-900",
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",
            isOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          {isError && (
            <div className="flex-1 content-center flex-col justify-center py-5 animate-fade-in">
              <ErrorMessage />
            </div>
          )}
          {isLoading && (
            <div className="flex-1 content-center mx-auto py-5 animate-fade-in">
              <Loader />
            </div>
          )}
          {isSuccess && (
            <div className="flex-1 content-center flex-col justify-center py-5 animate-fade-in">
              <SuccessMessage message="Deposit Successful!" />
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
                <DepositForm formMethods={formMethods} onEnter={onEnter} />
              </form>
            </div>
          )}
          {!isLoading && !isSuccess && !isError && currentStep === "params" && (
            <div className="flex-1 content-center py-5">
              <BackButton onClick={onBack} />
              <div className="flex flex-col pt-20">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Review Deposit
                  </h1>
                  <p className="text-gray-400 text-sm">
                    Review the deposit parameters before proceeding
                  </p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-6">
                  <h3 className="text-white font-semibold mb-3">
                    Deposit Parameters
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Vault Address:</span>
                      <span className="text-white font-mono">
                        {shortString(depositParamsData?.depositParams.contract)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Amount:</span>
                      <span className="text-white font-mono">
                        {depositParamsData
                          ? formatEther(
                              depositParamsData.depositParams.depositStruct
                                .total_deposit_amount +
                                depositParamsData.depositParams.depositStruct
                                  .fee,
                            )
                          : "0"}{" "}
                        USD
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    className={clsx(primaryButtonStyle, "w-full")}
                    onClick={onApprove}
                  >
                    Approve Deposit
                  </Button>
                </div>
              </div>
            </div>
          )}
          {!isLoading &&
            !isSuccess &&
            !isError &&
            currentStep === "preview" && (
              <div className="flex-1 content-center py-5">
                <BackButton onClick={onBack} />
                <div className="flex flex-col pt-20">
                  <SigningPreview
                    isSigning={isLoading}
                    isSuccess={isSuccess}
                    title="Sign Deposit Transaction"
                    description="Review and sign the deposit transaction"
                    messageData={depositTransactionDetails}
                    onSign={onSign}
                    buttonText="Sign & Deposit"
                    successText="Deposit Successful!"
                  />
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
