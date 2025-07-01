import { useCallback, useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Description,
  Field,
  Label,
  Textarea,
  Input,
  Button,
} from "@headlessui/react";
import clsx from "clsx";
import { ClientContext } from "@src/context/client.context";
import { useNavigate } from "react-router-dom";
import { primaryButtonStyle, linkButtonStyle } from "@src/components/Button";
import { generatePrivateKey } from "viem/accounts";

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    clearErrors,
  } = useForm<{ password: string; privateKey?: string }>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const navigate = useNavigate();

  const { signUp, login, loggedIn, onlyLogin } = useContext(ClientContext);

  const [error, setError] = useState<string>();

  const onSubmit = useCallback(
    async (data: { password: string; privateKey?: string }) => {
      try {
        if (!onlyLogin) {
          await signUp(data.password, data.privateKey as `0x${string}`);
        } else {
          await login(data.password);
        }
      } catch (error) {
        const message = (error as Error).message;
        const defaultMessage = onlyLogin
          ? "Invalid password"
          : "Failed to register";
        setError(message || defaultMessage);
      }
    },
    [signUp, login, onlyLogin],
  );

  useEffect(() => {
    if (loggedIn) {
      navigate("/panel/wallet");
    }
  }, [loggedIn, navigate]);

  const generateRandomPrivateKey = useCallback(() => {
    setValue("privateKey", generatePrivateKey());
  }, [setValue]);

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

  const onPrivateKeyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue("privateKey", e.target.value);
    clearErrors("privateKey");
    setError(undefined);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      onKeyDown={onEnter}
      className="mx-auto mt-5 w-96 px-5 md:px-0"
    >
      {!onlyLogin && (
        <Field>
          <Label className="text-base/6 font-medium text-white">
            Private key
          </Label>
          <Description className="text-base/6 dark:text-white/50">
            Encrypted with password and stored in your browser
          </Description>
          <div className="relative">
            <Textarea
              className="mt-1 block w-full resize-none rounded-lg border-none dark:bg-white/5 pt-2.5 px-3 pb-3 text-base/6 dark:text-white leading-7 focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
              rows={2}
              {...register("privateKey", {
                required: "Private key is required",
                maxLength: 66,
                minLength: 66,
              })}
              disabled={isSubmitting}
              placeholder="0x00..."
              onChange={onPrivateKeyChange}
              onKeyDown={onEnter}
            />
            <div className="absolute bottom-0 right-0 px-2">
              <Button
                type="button"
                className={linkButtonStyle}
                onClick={generateRandomPrivateKey}
              >
                Random
              </Button>
            </div>
          </div>
        </Field>
      )}
      <div className="h-6 text-base/6 mt-1 text-red-400">
        {errors.privateKey && (
          <p className="error-message">
            {typeof errors.privateKey.message === "string" &&
            errors.privateKey.message
              ? errors.privateKey.message
              : "Invalid private key"}
          </p>
        )}
      </div>
      <Field className={clsx({ "mt-2": !onlyLogin })}>
        <Label className="text-base/6 font-medium dark:text-white">
          Password
        </Label>
        <Description className="text-base/6 dark:text-white/50">
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
          {onlyLogin ? "Login" : "Register"}
        </Button>
      </div>
    </form>
  );
}
