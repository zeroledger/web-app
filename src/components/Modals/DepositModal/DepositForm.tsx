import { Field, Label, Input } from "@headlessui/react";
import clsx from "clsx";
import { UseFormReturn } from "react-hook-form";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";

interface DepositFormData {
  amount: string;
}

interface DepositFormProps {
  formMethods: UseFormReturn<DepositFormData>;
  onEnter: (e: React.KeyboardEvent<HTMLElement>) => void;
}

export const DepositForm = ({ formMethods, onEnter }: DepositFormProps) => {
  const {
    register,
    formState: { errors, isSubmitting },
    clearErrors,
    setValue,
  } = formMethods;

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
        <div className="h-6 mt-1 text-base text-red-400">
          {errors.amount && <p>{errors.amount.message}</p>}
        </div>
      </Field>
      <div className="py-4">
        <MobileConfirmButton disabled={isSubmitting} label="Confirm Deposit" />
      </div>
    </div>
  );
};
