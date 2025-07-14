import { Field, Label, Input } from "@headlessui/react";
import clsx from "clsx";
import { UseFormReturn } from "react-hook-form";
import { useContext } from "react";
import { WalletContext } from "@src/context/wallet.context";
import { parseUnits } from "viem";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";

interface SpendFormData {
  recipient: string;
  amount: string;
}

interface SpendFormProps {
  formMethods: UseFormReturn<SpendFormData>;
  onEnter: (e: React.KeyboardEvent<HTMLElement>) => void;
  type: "Payment" | "Withdraw";
}

export const SpendForm = ({ formMethods, onEnter, type }: SpendFormProps) => {
  const {
    register,
    formState: { errors, isSubmitting },
    clearErrors,
    setValue,
  } = formMethods;
  const { privateBalance, decimals } = useContext(WalletContext);

  const validateAmount = (value: string) => {
    if (!value) return "Amount is required";
    const amount = parseUnits(value, decimals);
    if (amount <= 0n) return "Amount must be greater than 0";
    if (amount > privateBalance) return "Insufficient balance";
    return true;
  };

  return (
    <div className="w-full">
      <Field className="mt-2">
        <Label className="text-base/6 font-medium text-white">
          Recipient address
        </Label>
        <Input
          className={clsx(
            "mt-1 block w-full rounded-lg border-none bg-white/5 py-2.5 px-3 text-base text-white leading-7",
            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
            errors.recipient && "border-red-400",
          )}
          {...register("recipient", {
            required: "Recipient address is required",
            pattern: {
              value: /^0x[a-fA-F0-9]{40}$/,
              message: "Invalid Ethereum address",
            },
          })}
          placeholder="0x00..."
          onChange={(e) => {
            setValue("recipient", e.target.value);
            clearErrors("recipient");
          }}
          onKeyDown={onEnter}
        />
        <div className="h-6 mt-1 text-base text-red-400">
          {errors.recipient && <p>{errors.recipient.message}</p>}
        </div>
      </Field>
      <Field className="mt-1">
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
            validate: validateAmount,
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
        <MobileConfirmButton
          disabled={isSubmitting}
          label={`Confirm ${type}`}
        />
      </div>
    </div>
  );
};
