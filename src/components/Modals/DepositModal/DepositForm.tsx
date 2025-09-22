import { Field, Label, Input } from "@headlessui/react";
import { UseFormReturn } from "react-hook-form";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { useDepositFees } from "@src/components/Panel/hooks/useFees";
import { useContext, useEffect } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { DepositModalState } from "@src/components/Panel/hooks/useDepositModal";
import { primaryInputStyle } from "@src/components/styles/Input.styles";

interface DepositFormData {
  amount: string;
}

interface DepositFormProps {
  formMethods: UseFormReturn<DepositFormData>;
  setState: React.Dispatch<React.SetStateAction<DepositModalState>>;
  isModalOpen: boolean;
}

export const DepositForm = ({
  formMethods,
  setState,
  isModalOpen,
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
  } = useDepositFees(ledger!, decimals, isModalOpen);

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
          className={primaryInputStyle}
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
