import { Field, Label, Input } from "@headlessui/react";
import clsx from "clsx";
import { UseFormReturn } from "react-hook-form";
import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { getMaxFormattedValue } from "@src/utils/common";
import { TOKEN_ADDRESS } from "@src/common.constants";
import { useMetadata } from "@src/hooks/useMetadata";
import { isAddress } from "viem";
import { ensClient } from "@src/components/EnsProfile/ensClient";
import { normalize } from "viem/ens";

const amountRegex = /^\d*\.?\d*$/;

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
  const { privateBalance, evmClients, isWalletChanged, chainSupported } =
    useContext(LedgerContext);
  const { decimals } = useMetadata(
    TOKEN_ADDRESS,
    isWalletChanged,
    chainSupported,
    evmClients,
  );

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
            validate: async (value) => {
              if (value.startsWith("0x")) {
                return isAddress(value) || "Invalid address";
              }
              const ensAddress = await ensClient.getEnsAddress({
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
          type="string"
          className={clsx(
            "mt-1 block w-full rounded-lg border-none bg-white/5 py-2.5 px-3 text-base text-white leading-7",
            "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
            errors.amount && "border-red-400",
          )}
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
            setValue(
              "amount",
              getMaxFormattedValue(e.target.value, decimals, privateBalance),
            );
            clearErrors("amount");
          }}
          onKeyDown={onEnter}
        />
        <div className="h-6 mt-1 text-base text-red-400">
          {errors.amount && <p>{errors.amount.message}</p>}
        </div>
      </Field>
      <div className="py-4">
        <MobileConfirmButton disabled={isSubmitting} label={`Review ${type}`} />
      </div>
    </div>
  );
};
