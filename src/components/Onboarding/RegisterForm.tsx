import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Description, Field, Label, Input, Button } from "@headlessui/react";
import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import { primaryButtonStyle } from "@src/components/Button";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useEnsProfile } from "../EnsProfile/useEnsProfile";
import { Avatar } from "../EnsProfile/Avatar";
import { Name } from "../EnsProfile/Name";
import { Address } from "viem";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    clearErrors,
  } = useForm<{ password: string }>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const navigate = useNavigate();

  const { setPassword, viewAccount } = useContext(ViewAccountContext);
  const { ledgerService, wallet } = useContext(LedgerContext);
  const [error, setError] = useState<string>();
  const { data, isLoading } = useEnsProfile(wallet!.address as Address);
  const onSubmit = useCallback(
    async (data: { password: string }) => {
      try {
        setPassword(data.password);
      } catch (error) {
        const message = (error as Error).message ?? "Invalid password";
        setError(message);
      }
    },
    [setPassword],
  );

  useEffect(() => {
    if (ledgerService && viewAccount) {
      navigate("/panel/wallet");
    }
  }, [ledgerService, viewAccount, navigate]);

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const onPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue("password", e.target.value);
    clearErrors("password");
    setError(undefined);
  };

  return (
    <div className="mx-auto w-max-96">
      <div className="flex items-center gap-4">
        {!isLoading && (
          <>
            <Avatar avatar={data?.avatar} className="h-15 w-15 rounded-full" />
            <Name
              className="text-base/6"
              name={data?.name}
              address={wallet!.address as Address}
            />
          </>
        )}
        {isLoading && (
          <>
            <div className="bg-white/50 h-15 w-15 rounded-full animate-pulse" />
            <div className="h-8 w-38 bg-white/50 animate-pulse rounded" />
          </>
        )}
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={onEnter}
        className="mt-5 "
      >
        <Field>
          <Label className="text-base/6 font-medium text-white">Password</Label>
          <Description className="text-sm/6 text-white/50">
            Data encrypted locally with your password
          </Description>
          <Input
            className={clsx(
              "mt-1 block w-full rounded-lg border-none bg-white/5 py-2.5 px-3 text-base text-white leading-7",
              "focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25",
              errors.password && "border-red-400",
            )}
            {...register("password", {
              required: "Password is required",
              minLength: 3,
            })}
            disabled={isSubmitting}
            onChange={onPasswordChange}
            onKeyDown={onEnter}
          />
        </Field>
        <div className="h-6 text-base/6 mt-1 text-red-400">
          {errors.password && (
            <p className="error-message">
              {typeof errors.password.message === "string" &&
              errors.password.message
                ? errors.password.message
                : "Invalid password"}
            </p>
          )}
          {error && <p className="error-message">{error}</p>}
        </div>
        <div className="flex justify-end mt-3">
          <Button
            type="submit"
            className={primaryButtonStyle}
            disabled={isSubmitting}
          >
            Open
          </Button>
        </div>
      </form>
    </div>
  );
}
