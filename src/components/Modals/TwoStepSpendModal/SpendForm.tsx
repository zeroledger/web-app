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

const amountRegex = /^\d*\.?\d*$/;

interface SpendFormData {
  recipient: string;
  amount: string;
  publicOutput: boolean;
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
    // Extract address from QR code data
    // QR codes might contain just the address or a full URL
    let address = data;

    // If it's a URL, try to extract the address from it
    if (data.includes("ethereum:")) {
      const match = data.match(/ethereum:([a-fA-F0-9x]+)/);
      if (match) {
        address = match[1];
      }
    } else if (data.includes("/address/")) {
      const match = data.match(/\/address\/([a-fA-F0-9x]+)/);
      if (match) {
        address = match[1];
      }
    }

    // Set the address in the form
    setValue("recipient", address);
    clearErrors("recipient");
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

  return (
    <div className="w-full">
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
                if (value.startsWith("0x")) {
                  return isAddress(value) || "Invalid address";
                }
                const ensAddress = await ens.client.getEnsAddress({
                  name: normalize(value),
                });
                return (
                  (!!ensAddress && isAddress(ensAddress)) || "Invalid ENS name"
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
              value: amountRegex,
              message: "Amount must be a positive number",
            },
          })}
          placeholder="0.00"
          onChange={(e) => {
            if (!amountRegex.test(e.target.value)) return;
            const value = getMaxFormattedValue(
              e.target.value,
              decimals,
              privateBalance,
            );
            setValue("amount", value);
            setWithdrawAll(
              value === formatUnits(privateBalance, decimals) &&
                type === "Withdraw",
            );
            clearErrors("amount");
          }}
        />
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

      {/* Public Output Switcher - only show for Payment type */}
      {type === "Payment" && (
        <Field className="mt-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label className="text-base/6 font-medium text-white">
                Public Transfer
              </Label>
              <p className="text-sm text-white/70 mt-1">Send tokens publicly</p>
            </div>
            <Switch
              checked={formMethods.watch("publicOutput")}
              onChange={(checked) =>
                formMethods.setValue("publicOutput", checked)
              }
              className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                formMethods.watch("publicOutput")
                  ? "bg-blue-500"
                  : "bg-white/20",
              )}
            >
              <span
                className={clsx(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  formMethods.watch("publicOutput")
                    ? "translate-x-6"
                    : "translate-x-1",
                )}
              />
            </Switch>
          </div>
        </Field>
      )}

      <div className="py-2">
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
