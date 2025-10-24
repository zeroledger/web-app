import { useCallback, useContext } from "react";
import { useForm } from "react-hook-form";
import { Description, Field, Label, Input, Button } from "@headlessui/react";
import clsx from "clsx";
import { primaryButtonStyle } from "@src/components/styles/Button.styles";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { Avatar } from "../EnsProfile/Avatar";
import { Name } from "../EnsProfile/Name";
import { Address } from "viem";
import { useRegister } from "./useRegister";
import { primaryInputStyle } from "../styles/Input.styles";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    clearErrors,
  } = useForm<{ password: string }>();

  const { wallet } = useWalletAdapter();

  const { ensProfile, isEnsLoading, viewAccount } = useContext(LedgerContext);

  const { open, isConnecting, error, setError } = useRegister();

  const isLogin = viewAccount?.hasEncryptedViewAccount(
    wallet!.address as Address,
  );

  const buttonText = isLogin ? "Open" : "Set";
  const buttonLoading = isLogin ? "Opening" : "Setting";

  const onSubmit = useCallback(
    (data: { password: string }) => {
      open(data.password);
    },
    [open],
  );

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("password", e.target.value);
    clearErrors("password");
    setError(undefined);
  };

  const disabled = isSubmitting || isConnecting || isEnsLoading;

  return (
    <div className="mx-auto">
      <div className="flex items-center gap-4">
        {!isEnsLoading && (
          <>
            <Avatar
              avatar={ensProfile?.avatar}
              address={wallet!.address as Address}
              className="h-15 w-15 rounded-lg"
            />
            <Name
              className="text-base/6"
              name={ensProfile?.name}
              address={wallet!.address as Address}
            />
          </>
        )}
        {isEnsLoading && (
          <>
            <div className="bg-white/50 h-15 w-15 rounded-lg animate-pulse" />
            <div className="h-8 w-38 bg-white/50 animate-pulse rounded" />
          </>
        )}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-5">
        <Field className="flex items-center gap-4">
          <Input
            hidden
            type="text"
            autoComplete="username"
            value={ensProfile?.name ?? wallet!.address}
            readOnly
          />
        </Field>
        <Field>
          <Label className="text-base/6 font-medium text-white">
            {isLogin ? "Password" : "Set Password"}
          </Label>
          <Description className="text-sm/6 text-white/50">
            Data encrypted locally with your password
          </Description>
          <Input
            type="password"
            className={clsx(
              primaryInputStyle,
              "min-w-84 text-lg tracking-wider leading-none",
            )}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 4,
                message: "Password must be at least 4 characters long",
              },
            })}
            disabled={disabled}
            onChange={onPasswordChange}
            autoComplete="new-password"
          />
        </Field>
        <div
          className={clsx(
            "text-base/6 mt-1 text-red-400 transition-all duration-200 ease-in-out",
            {
              "opacity-0 h-0": !errors.password && !error,
              "opacity-100 h-6": errors.password || error,
            },
          )}
        >
          {errors.password && (
            <p className="error-message">
              {typeof errors.password.message === "string" &&
              errors.password.message
                ? errors.password.message
                : "Unknown password validation error"}
            </p>
          )}
          {error && <p className="error-message">{error.message}</p>}
        </div>
        <div className="flex justify-end mt-3">
          <Button
            type="submit"
            className={clsx(primaryButtonStyle, {
              "opacity-50 cursor-not-allowed": isConnecting,
            })}
            disabled={disabled}
          >
            {isConnecting && (
              <svg className="mr-3 size-5 animate-spin" viewBox="0 0 24 24">
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12H19C19 15.866 15.866 19 12 19C8.13401 19 5 15.866 5 12H2C2 17.5228 6.47715 22 12 22Z"
                  fill="currentColor"
                />
              </svg>
            )}
            {isConnecting ? buttonLoading : buttonText}
          </Button>
        </div>
      </form>
    </div>
  );
}
