import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { SuccessMessage } from "@src/components/Modals/SuccessMessage";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { DepositForm } from "./DepositForm";
import { SigningPreview } from "@src/components/SigningPreview";
import { formatUnits } from "viem";
import { shortString } from "@src/utils/common";
import { type UseFormReturn } from "react-hook-form";
import { useContext } from "react";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import {
  type DepositFormData,
  type DepositModalState,
} from "@src/components/Panel/hooks/useDepositModal";
import { BaseModal } from "@src/components/Modals/BaseModal";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";

interface DepositModalProps {
  onFormSubmit: (data: DepositFormData) => void;
  onApprove: () => void;
  onSign: () => void;
  onBack: () => void;
  formMethods: UseFormReturn<DepositFormData>;
  state: DepositModalState;
  setState: React.Dispatch<React.SetStateAction<DepositModalState>>;
}

export default function DepositModal({
  onFormSubmit,
  onApprove,
  onSign,
  onBack,
  formMethods,
  state,
  setState,
}: DepositModalProps) {
  const { handleSubmit } = formMethods;
  const { decimals } = useContext(PanelContext);
  const style = useDynamicHeight("h-dvh");

  const {
    depositParams,
    transactionDetails,
    depositFees,
    isModalLoading,
    isModalSuccess,
    isModalError,
    isModalOpen,
    step,
  } = state;

  const shouldShowParams =
    step === "params" && !isModalSuccess && !isModalLoading && !isModalError;
  const shouldShowPreview =
    step === "preview" && !isModalSuccess && !isModalLoading && !isModalError;
  const shouldShowForm =
    step === "form" && !isModalSuccess && !isModalLoading && !isModalError;

  const depositTransactionDetails =
    transactionDetails && depositFees
      ? [
          {
            label: "From",
            value: shortString(transactionDetails.from),
          },
          {
            label: "To",
            value: shortString(transactionDetails.to),
          },
          {
            label: "Vault Contract",
            value: shortString(transactionDetails.vaultContract),
          },
          {
            label: "Token",
            value: shortString(transactionDetails.token),
          },
          {
            label: "Outputs",
            value: (
              <>
                {transactionDetails.outputs.map((output) => (
                  <div key={output}>{shortString(output.toString())}</div>
                ))}
              </>
            ),
          },
          {
            label: "Amount",
            value: `${formatUnits(transactionDetails.value, decimals)} USD`,
          },
          {
            label: "Protocol Fee",
            value: `${formatUnits(depositFees.depositFee, decimals)} USD`,
          },
          {
            label: "Paymaster Fee",
            value: `${formatUnits(depositFees.fee, decimals)} USD`,
          },
          {
            label: "Paymaster",
            value: shortString(depositFees.paymasterAddress),
          },
          {
            label: "Gas",
            value: depositFees.coveredGas.toString(),
          },
        ]
      : [];

  return (
    <BaseModal
      isOpen={isModalOpen}
      onClose={onBack}
      closeOnOverlayClick={false}
      contentClassName="relative justify-center overflow-y-auto"
      style={style}
    >
      <div className="px-6 py-5 h-full grid grid-cols-1">
        {isModalError && (
          <div className="flex-1 place-self-center animate-fade-in">
            <ErrorMessage message={state.errorMessage} />
          </div>
        )}
        {isModalLoading && (
          <Loader className="flex-1 place-self-center animate-fade-in flex justify-center" />
        )}
        {isModalSuccess && (
          <div className="flex-1 place-self-center animate-fade-in">
            <SuccessMessage message="Deposit Successful!" />
          </div>
        )}
        {!isModalError && !isModalLoading && !isModalSuccess && (
          <BackButton onClick={onBack} className="place-self-start" />
        )}
        {shouldShowForm && (
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex">
            <DepositForm
              formMethods={formMethods}
              setState={setState}
              isModalOpen={isModalOpen}
              handleBack={onBack}
            />
          </form>
        )}
        {shouldShowParams && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onApprove();
            }}
            className="flex flex-col"
          >
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
                    {shortString(depositParams?.contract)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white font-mono">
                    {depositParams && depositFees
                      ? formatUnits(
                          depositParams.depositStruct.amount +
                            depositFees.fee +
                            depositFees.depositFee,
                          decimals,
                        )
                      : "0"}{" "}
                    USD
                  </span>
                </div>
              </div>
            </div>

            <MobileConfirmButton
              disabled={isModalLoading}
              label={
                depositFees?.withPermit ? "Permit Deposit" : "Approve Deposit"
              }
              autoFocus
            />
          </form>
        )}
        {shouldShowPreview && (
          <div className="flex flex-col pt-5">
            <SigningPreview
              isSigning={isModalLoading}
              isSuccess={isModalSuccess}
              title="Sign Deposit Transaction"
              description="Review and sign the deposit transaction"
              messageData={depositTransactionDetails}
              onSign={onSign}
              buttonText="Sign & Deposit"
              successText="Deposit Successful!"
            />
          </div>
        )}
      </div>
    </BaseModal>
  );
}
