import { Field, Label, Switch } from "@headlessui/react";
import clsx from "clsx";

interface PaymentTypeToggleProps {
  isPublicPayment: boolean;
  onChange: (enabled: boolean) => void;
}

export const PaymentTypeToggle = ({
  isPublicPayment,
  onChange,
}: PaymentTypeToggleProps) => {
  return (
    <div className="mb-6 hidden">
      <Field>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-base/6 font-medium text-white">
              Public Payment (Invoice)
            </Label>
            <p className="text-sm text-white/70 mt-1">
              {isPublicPayment
                ? "Receive via direct ERC20 transfer to one-time address"
                : "Receive via ZeroLedger (private with message support)"}
            </p>
          </div>
          <Switch
            checked={isPublicPayment}
            onChange={onChange}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
              isPublicPayment ? "bg-blue-500" : "bg-white/20",
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                isPublicPayment ? "translate-x-6" : "translate-x-1",
              )}
            />
          </Switch>
        </div>
      </Field>
    </div>
  );
};
