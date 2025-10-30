import { Field, Label, Input, Switch } from "@headlessui/react";
import { UseFormReturn } from "react-hook-form";
import { useContext, useEffect, useState } from "react";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { getMaxFormattedValue } from "@src/utils/common";
import { formatUnits, isAddress } from "viem";
import { ens } from "@src/services/Ens";
import { normalize } from "viem/ens";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { SpendModalState } from "@src/components/Panel/hooks/useSpendModal";
import { WithdrawModalState } from "@src/components/Panel/hooks/useWithdrawModal";
import {
  useSpendFees,
  useWithdrawFees,
} from "@src/components/Panel/hooks/useFees";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSettings } from "@src/hooks/useSettings";
import { QRScannerModal } from "./QRScannerModal";
import { CameraIcon } from "@src/components/svg";
import { primaryInputStyle } from "@src/components/styles/Input.styles";
import clsx from "clsx";
import {
  AMOUNT_REGEX,
  SUPPORT_COMMITMENTS_DISCLOSURE,
} from "@src/common.constants";

interface SpendFormData {
  recipient?: string;
  amount: string;
  publicOutput?: boolean;
  message?: string;
}

interface SpendFormProps {
  formMethods: UseFormReturn<SpendFormData>;
  type: "Payment" | "Withdraw";
  setState: React.Dispatch<
    React.SetStateAction<SpendModalState | WithdrawModalState>
  >;
  withdrawAll: boolean;
  setWithdrawAll: (withdrawAll: boolean) => void;
  isModalOpen: boolean;
}

export const SpendForm = ({
  formMethods,
  type,
  setState,
  withdrawAll,
  setWithdrawAll,
  isModalOpen,
}: SpendFormProps) => {
  const {
    register,
    formState: { errors, isSubmitting },
    clearErrors,
    setValue,
  } = formMethods;
  const { privateBalance, decimals } = useContext(PanelContext);
  const { settings } = useSettings();
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const { ledger } = useContext(LedgerContext);
  const {
    data: spendFees,
    isLoading: isSpendLoading,
    error: isSpendError,
  } = useSpendFees(ledger!, decimals, isModalOpen);

  const {
    data: withdrawFeesData,
    isLoading: isWithdrawLoading,
    error: isWithdrawError,
  } = useWithdrawFees(ledger!, decimals, isModalOpen);

  const isFeesLoading = isSpendLoading || isWithdrawLoading;

  const handleQRCodeDetected = (data: string) => {
    // Extract address, amount, and message from QR code data
    let address = data;
    let amount = "";
    let message = "";

    // Check if it's an ethereum: URL format (matches our generation)
    if (data.includes("zeroledger:")) {
      const addressMatch = data.match(/zeroledger:address=([a-fA-F0-9x]+)/);
      if (addressMatch) {
        address = addressMatch[1];
      }

      // Extract amount from query parameter
      const amountMatch = data.match(/[?&]amount=([^&]+)/);
      if (amountMatch) {
        amount = amountMatch[1];
      }

      // Extract message from query parameter
      const messageMatch = data.match(/[?&]message=([^&]+)/);
      if (messageMatch) {
        message = decodeURIComponent(messageMatch[1]);
      }
    } else if (data.includes("/address/")) {
      // Handle other URL formats (like explorer links)
      const match = data.match(/\/address\/([a-fA-F0-9x]+)/);
      if (match) {
        address = match[1];
      }
    } else if (data.startsWith("0x")) {
      // Handle plain address format (matches our generation when no amount)
      address = data;
    }

    // Set the address in the form
    setValue("recipient", address);
    clearErrors("recipient");

    // Set the amount if found and valid
    if (amount && parseFloat(amount) > 0) {
      setValue("amount", amount);
      clearErrors("amount");
    }

    // Set the message if found
    if (message) {
      setValue("message", message);
      clearErrors("message");
    }
  };

  useEffect(() => {
    if (isSpendError || isWithdrawError) {
      setState((prev) => ({
        ...prev,
        isModalError: true,
        errorMessage: "Error getting fees",
      }));
    }
    if (type === "Payment" && spendFees) {
      setState((prev) => ({
        ...prev,
        spendFees,
      }));
    }
    if (type === "Withdraw" && withdrawFeesData && spendFees) {
      setState((prev) => ({
        ...prev,
        ...withdrawFeesData,
        spendFees,
      }));
    }
  }, [
    isSpendError,
    isWithdrawError,
    setState,
    type,
    spendFees,
    withdrawFeesData,
  ]);

  const isPublicTransfer = !!formMethods.watch("publicOutput");

  return (
    <div className="w-full">
      {/* Only show recipient field for Payment type */}
      {type === "Payment" && (
        <Field className="mt-2">
          <Label className="text-base/6 font-medium text-white">
            Recipient address
          </Label>
          <div className="relative mb-2">
            <Input
              className={primaryInputStyle}
              {...register("recipient", {
                required: "Recipient address is required",
                validate: async (value) => {
                  if (!value) return "Recipient address is required";
                  if (value.startsWith("0x")) {
                    return isAddress(value) || "Invalid address";
                  }
                  const ensAddress = await ens.client.getEnsAddress({
                    name: normalize(value),
                  });
                  return (
                    (!!ensAddress && isAddress(ensAddress)) ||
                    "Invalid ENS name"
                  );
                },
              })}
              placeholder="ens.eth or 0x00..."
              onChange={(e) => {
                setValue("recipient", e.target.value);
                clearErrors("recipient");
              }}
            />
            <button
              type="button"
              onClick={() => setIsQRScannerOpen(true)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              title="Scan QR code"
            >
              <CameraIcon />
            </button>
          </div>
          <div
            className={clsx(
              "text-base/6 text-red-400 transition-all duration-200 ease-in-out",
              {
                "opacity-0 h-0": !errors.recipient,
                "opacity-100 h-6": errors.recipient,
              },
            )}
          >
            {errors.recipient && <p>{errors.recipient.message}</p>}
          </div>
        </Field>
      )}
      <Field className="mt-1">
        <Label className="text-base/6 font-medium text-white">
          Amount (USD)
        </Label>
        <Input
          type="string"
          className={primaryInputStyle}
          {...register("amount", {
            required: "Amount is required",
            pattern: {
              value: AMOUNT_REGEX,
              message: "Amount must be a positive number",
            },
          })}
          placeholder="0.00"
          onChange={(e) => {
            if (!AMOUNT_REGEX.test(e.target.value)) return;
            const value = getMaxFormattedValue(
              e.target.value,
              decimals,
              privateBalance,
            );
            setValue("amount", value);

            if (SUPPORT_COMMITMENTS_DISCLOSURE) {
              setWithdrawAll(
                value === formatUnits(privateBalance, decimals) &&
                  type === "Withdraw",
              );
            }

            clearErrors("amount");
          }}
        />
        <div
          className={clsx(
            "text-base/6 mt-1 text-red-400 transition-all duration-200 ease-in-out",
            {
              "opacity-0 h-0": !errors.amount,
              "opacity-100 h-6": errors.amount,
            },
          )}
        >
          {errors.amount && <p>{errors.amount.message}</p>}
        </div>
      </Field>

      {/* Message field - only show for Payment type and private transfers */}
      {type === "Payment" && (
        <div
          className={clsx(
            "transition-all duration-300 ease-in-out overflow-hidden",
            {
              "opacity-100 max-h-32": !isPublicTransfer,
              "opacity-0 max-h-0": isPublicTransfer,
            },
          )}
        >
          <Field className="mt-1">
            <Label className="text-base/6 font-medium text-white">
              Message (optional)
            </Label>
            <Input
              type="text"
              className={primaryInputStyle}
              {...register("message", {
                maxLength: {
                  value: 32,
                  message: "Message must be 32 characters or less",
                },
              })}
              placeholder="Add a message for the recipient..."
              maxLength={32}
              disabled={isPublicTransfer}
            />
            <div
              className={clsx(
                "text-base/6 mt-1 text-red-400 transition-all duration-200 ease-in-out",
                {
                  "opacity-0 h-0": !errors.message,
                  "opacity-100 h-6": errors.message,
                },
              )}
            >
              {errors.message && <p>{errors.message.message}</p>}
            </div>
          </Field>
        </div>
      )}

      <div className="mt-1 text-sm text-white/80 flex items-center gap-2 justify-end min-h-5">
        {isFeesLoading && (
          <div className="animate-pulse h-5 w-1/2 bg-white/10 rounded" />
        )}
        {spendFees && !withdrawAll && !isFeesLoading && (
          <div>
            {type} fee: {spendFees.roundedFee} USD
          </div>
        )}
        {withdrawAll && withdrawFeesData && !isFeesLoading && (
          <div>
            {type} fee: {withdrawFeesData.withdrawFees.roundedFee} USD
          </div>
        )}
      </div>

      {/* Public Output Switcher - only show for Payment type */}
      {type === "Payment" && (
        <Field className="my-4">
          <div className="flex items-center justify-between">
            <Label className="text-base/6 font-medium text-white">
              Send tokens publicly
            </Label>
            <Switch
              checked={isPublicTransfer}
              onChange={(checked) =>
                formMethods.setValue("publicOutput", checked)
              }
              className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isPublicTransfer ? "bg-blue-500" : "bg-white/20",
              )}
            >
              <span
                className={clsx(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isPublicTransfer ? "translate-x-6" : "translate-x-1",
                )}
              />
            </Switch>
          </div>
        </Field>
      )}

      <div
        className={clsx("pb-2", {
          "pt-4": type === "Withdraw",
        })}
      >
        <MobileConfirmButton
          disabled={isSubmitting || isFeesLoading}
          label={settings.showTransactionPreview ? `Review ${type}` : "Confirm"}
        />
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onQRCodeDetected={handleQRCodeDetected}
      />
    </div>
  );
};
