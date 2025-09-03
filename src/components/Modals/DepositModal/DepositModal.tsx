import clsx from "clsx";
import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { SuccessMessage } from "@src/components/Modals/SuccessMessage";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { DepositForm } from "./DepositForm";
import { SigningPreview } from "@src/components/SigningPreview";
import { Button } from "@src/components/Button";
import { primaryButtonStyle } from "@src/components/Button";
import { formatUnits } from "viem";
import { shortString } from "@src/utils/common";
import { UseFormReturn } from "react-hook-form";
import { useContext } from "react";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { type DepositModalState } from "@src/components/Panel/hooks/useDepositModal";

interface DepositFormData {
  amount: string;
}

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

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onFormSubmit)();
    }
  };

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
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full h-dhv",
        "transition-all duration-500 ease-in-out",
        isModalOpen ? "opacity-100" : "opacity-0 pointer-events-none",
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
            isModalOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          {isModalError && (
            <div className="flex-1 content-center flex-col justify-center py-5 animate-fade-in">
              <ErrorMessage />
            </div>
          )}
          {isModalLoading && (
            <div className="flex-1 content-center mx-auto py-5 animate-fade-in">
              <Loader />
            </div>
          )}
          {isModalSuccess && (
            <div className="flex-1 content-center flex-col justify-center py-5 animate-fade-in">
              <SuccessMessage message="Deposit Successful!" />
            </div>
          )}
          {!isModalLoading &&
            !isModalSuccess &&
            !isModalError &&
            isModalOpen &&
            state.step === "form" && (
              <div className="flex-1 content-center py-5">
                <BackButton onClick={onBack} />
                <form
                  onSubmit={handleSubmit(onFormSubmit)}
                  onKeyDown={onEnter}
                  className="flex pt-20"
                >
                  <DepositForm
                    formMethods={formMethods}
                    onEnter={onEnter}
                    setState={setState}
                  />
                </form>
              </div>
            )}
          {!isModalLoading &&
            !isModalSuccess &&
            !isModalError &&
            isModalOpen &&
            state.step === "params" && (
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
          {!isModalLoading &&
            !isModalSuccess &&
            !isModalError &&
            isModalOpen &&
            step === "preview" && (
              <div className="flex-1 content-center py-5">
                <BackButton onClick={onBack} />
                <div className="flex flex-col pt-20">
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
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
