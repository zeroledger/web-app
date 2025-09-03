import { Field, Label, Input } from "@headlessui/react";
import clsx from "clsx";
import { UseFormReturn } from "react-hook-form";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { useDepositFees } from "@src/components/Panel/hooks/useFees";
import { useContext, useEffect } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { DepositModalState } from "@src/components/Panel/hooks/useDepositModal";

interface DepositFormData {
  amount: string;
}

interface DepositFormProps {
  formMethods: UseFormReturn<DepositFormData>;
  onEnter: (e: React.KeyboardEvent<HTMLElement>) => void;
  setState: React.Dispatch<React.SetStateAction<DepositModalState>>;
}

export const DepositForm = ({
  formMethods,
  onEnter,
  setState,
}: DepositFormProps) => {
  const {
    register,
    formState: { errors, isSubmitting },
    clearErrors,
    setValue,
  } = formMethods;

  const { ledger } = useContext(LedgerContext);
  const { decimals } = useContext(PanelContext);
  const {
    data: depositFees,
    isLoading,
    error,
  } = useDepositFees(ledger!, decimals);

  useEffect(() => {
    if (error) {
      setState((prev) => ({
        ...prev,
        isModalError: true,
      }));
      return;
    }
    if (depositFees) {
      setState((prev) => ({
        ...prev,
        depositFees,
      }));
      return;
    }
  }, [error, depositFees, setState]);

  return (
    <div className="w-full">
      <Field className="mt-2">
        <Label className="text-base/6 font-medium text-white">
          Amount (USD)
        </Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          className={clsx(
            "mt-1 block w-full rounded-lg border-none bg-white/5 py-2.5 px-3 text-base text-white leading-7",
            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
            errors.amount && "border-red-400",
          )}
          {...register("amount", {
            required: "Amount is required",
            min: {
              value: 0.01,
              message: "Amount must be greater than 0",
            },
          })}
          placeholder="0.00"
          onChange={(e) => {
            setValue("amount", e.target.value);
            clearErrors("amount");
          }}
          onKeyDown={onEnter}
        />
        <div className="mt-1 text-base text-white flex gap-2 justify-end">
          {isLoading && (
            <div className="animate-pulse h-6 w-1/3 bg-white/10 rounded" />
          )}
          {depositFees && (
            <div className="text-sm text-white/80">
              deposit fee: {depositFees.roundedFee} USD
            </div>
          )}
        </div>
        <div className="h-6 mt-1 text-base text-red-400">
          {errors.amount && <p>{errors.amount.message}</p>}
        </div>
      </Field>
      <div className="py-4">
        <MobileConfirmButton
          disabled={isSubmitting || isLoading}
          label="Confirm Deposit"
        />
      </div>
    </div>
  );
};
