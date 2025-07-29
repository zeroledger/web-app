import clsx from "clsx";
import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { SuccessMessage } from "@src/components/Modals/SuccessMessage";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { UseFormReturn } from "react-hook-form";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { SpendForm } from "../SpendModal/SpendForm";
import { SigningPreview } from "@src/components/SigningPreview";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { shortString } from "@src/utils/common";
import { toHex, formatUnits } from "viem";
import { TransactionDetails } from "@src/services/ledger/ledger.service";

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

const prepareSigningData = (metaTransaction?: UnsignedMetaTransaction) => {
  if (!metaTransaction) return [];
  return [
    {
      label: "Forwarder Contract",
      value: shortString(metaTransaction.to),
    },
    {
      label: "Gas",
      value: shortString(metaTransaction.gas.toString()),
    },
    { label: "Nonce", value: toHex(metaTransaction.nonce) },
    {
      label: "Deadline",
      value: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      }).format(new Date(parseInt(metaTransaction.deadline.toString()) * 1000)),
    },
    {
      label: "User Transaction",
      value: (
        <a
          href={`https://calldata.swiss-knife.xyz/decoder?calldata=${metaTransaction.data}`}
          target="_blank"
          rel="noopener noreferrer"
          className=" text-gray-300 hover:text-gray-200 transition-colors underline"
        >
          {shortString(metaTransaction.data)}
        </a>
      ),
    },
  ];
};

const formatTransactionDetailsType = (type: TransactionDetails["type"]) => {
  switch (type) {
    case "deposit":
      return "Deposit";
    case "partialWithdraw":
      return "Partial Withdraw";
    case "withdraw":
      return "Withdraw";
    case "send":
      return "Send";
  }
};

const prepareTransactionDetails = (
  transactionDetails?: TransactionDetails,
  decimals?: number,
) => {
  if (!transactionDetails) return [];
  return [
    {
      label: "Type",
      value: formatTransactionDetailsType(transactionDetails.type),
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
      label: "From",
      value: shortString(transactionDetails.from),
    },
    {
      label: "To",
      value: shortString(transactionDetails.to),
    },
    {
      label: "Inputs",
      value: (
        <>
          {transactionDetails.inputs.map((input) => (
            <div key={input}>{shortString(input.toString())}</div>
          ))}
        </>
      ),
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
      label: "Paymaster",
      value: shortString(transactionDetails.paymaster),
    },
    {
      label: "Fee",
      value: shortString(formatUnits(transactionDetails.value, decimals || 18)),
    },
  ];
};

export default function TwoStepSpendModal({
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

  const style = useDynamicHeight("h-dvh");

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onFormSubmit)();
    }
  };

  const getSigningData = prepareSigningData(
    metaTransactionData?.metaTransaction,
  );

  const getTransactionDetails = prepareTransactionDetails(
    metaTransactionData?.transactionDetails,
    decimals,
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
      <div className="fixed inset-0 flex items-center justify-center">
        <div
          className={clsx(
            "flex flex-col w-full h-full px-6 md:w-[50%]",
            "md:max-w-md md:rounded-xl bg-gray-900 md:h-[50vh]",
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",
            isOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          <div className="py-4">
            {!isLoading && !isSuccess && !isError && (
              <BackButton onClick={onBack} />
            )}
          </div>

          {isError && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <ErrorMessage />
            </div>
          )}

          {isLoading && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <Loader />
            </div>
          )}

          {isSuccess && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <SuccessMessage message={`${type} Successful!`} />
            </div>
          )}

          {!isLoading && !isSuccess && !isError && currentStep === "form" && (
            <form
              onSubmit={handleSubmit(onFormSubmit)}
              onKeyDown={onEnter}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <SpendForm
                formMethods={formMethods}
                onEnter={onEnter}
                type={type}
              />
            </form>
          )}

          {!isLoading &&
            !isSuccess &&
            !isError &&
            currentStep === "preview" && (
              <div className="flex-1 flex flex-col items-center justify-center">
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
                    <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-6">
                      <h3 className="text-white font-semibold mb-3">
                        Transaction Details
                      </h3>
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
                  }
                />
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
