import { Field, Label, Input } from "@headlessui/react";
import { UseFormReturn } from "react-hook-form";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { useDepositFees } from "@src/components/Panel/hooks/useFees";
import { useContext, useEffect } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { DepositModalState } from "@src/components/Panel/hooks/useDepositModal";
import { primaryInputStyle } from "@src/components/styles/Input.styles";
import { delay, getMaxFormattedValue } from "@src/utils/common";
import clsx from "clsx";
import { useMetadata } from "@src/hooks/useMetadata";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { Address } from "viem";
import { AMOUNT_REGEX } from "@src/common.constants";

interface DepositFormData {
  amount: string;
}

interface DepositFormProps {
  formMethods: UseFormReturn<DepositFormData>;
  setState: React.Dispatch<React.SetStateAction<DepositModalState>>;
  isModalOpen: boolean;
  handleBack: () => void;
}

export const DepositForm = ({
  formMethods,
  setState,
  isModalOpen,
  handleBack,
}: DepositFormProps) => {
  const {
    register,
    formState: { errors, isSubmitting },
    clearErrors,
    setValue,
  } = formMethods;

  const { ledger, evmClients, tokenAddress } = useContext(LedgerContext);
  const { wallet } = useWalletAdapter();

  const { publicBalance, decimals } = useMetadata(
    tokenAddress,
    wallet?.address as Address,
    isModalOpen,
    evmClients,
  );

  const {
    data: depositFees,
    isLoading,
    error,
  } = useDepositFees(ledger!, decimals, isModalOpen);

  useEffect(() => {
    if (error) {
      setState((prev) => ({
        ...prev,
        isModalError: true,
        errorMessage: "Failed to get deposit fees",
      }));
      delay(3000).then(handleBack);
      return;
    }
    if (depositFees) {
      setState((prev) => ({
        ...prev,
        depositFees,
      }));
      return;
    }
  }, [error, depositFees, setState, handleBack]);

  return (
    <div className="w-full">
      <Field className="mt-2">
        <Label
          htmlFor="deposit-amount"
          className="text-base/6 font-medium text-white"
        >
          Amount (USD)
        </Label>
        <Input
          type="string"
          id="deposit-amount"
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
              publicBalance,
            );
            console.log("value", value);
            setValue("amount", value);
            clearErrors("amount");
          }}
        />
        <div className="mt-1 text-base text-white flex gap-2 justify-end min-h-5">
          {isLoading && (
            <div className="animate-pulse h-5 w-1/3 bg-white/10 rounded" />
          )}
          {depositFees && (
            <div className="text-sm text-white/80">
              deposit fee: {depositFees.roundedFee} USD
            </div>
          )}
        </div>
        <div
          className={clsx(
            "text-base/6 text-red-400 transition-all duration-200 ease-in-out",
            {
              "opacity-0 h-0": !errors.amount,
              "opacity-100 h-6": errors.amount,
            },
          )}
        >
          {errors.amount && <p>{errors.amount.message}</p>}
        </div>
      </Field>
      <div className="py-2">
        <MobileConfirmButton
          disabled={isSubmitting || isLoading}
          label="Confirm Deposit"
        />
      </div>
    </div>
  );
};
