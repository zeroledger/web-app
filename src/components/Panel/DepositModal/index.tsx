import clsx from "clsx";
import { Loader } from "@src/components/Loader";
import { BackButton } from "../SendModal/BackButton";
import { SuccessMessage } from "../SendModal/SuccessMessage";
import { DepositForm } from "./DepositForm";
import { UseFormReturn } from "react-hook-form";
import { useContext } from "react";
import { WalletContext } from "@src/context/wallet.context";
import { ErrorMessage } from "../SendModal/ErrorMessage";

interface DepositFormData {
  amount: string;
}

interface DepositModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  onDeposit: (data: DepositFormData, decimals: number) => void;
  onBack: () => void;
  formMethods: UseFormReturn<DepositFormData>;
}

export default function DepositModal({
  isOpen,
  isLoading,
  isSuccess,
  isError,
  onDeposit,
  onBack,
  formMethods,
}: DepositModalProps) {
  const { handleSubmit } = formMethods;
  const { decimals } = useContext(WalletContext);

  const onSubmit = (data: DepositFormData) => {
    onDeposit(data, decimals);
  };

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full h-dhv",
        "transition-all duration-500 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center">
        <div
          className={clsx(
            "flex flex-col w-full h-full px-6 md:w-[50%]",
            "md:max-w-md md:rounded-xl bg-gray-900 md:h-[50vh]",
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",
            isOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          <div className="py-4">
            {!isLoading && !isSuccess && <BackButton onClick={onBack} />}
          </div>
          {isError && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <ErrorMessage />
            </div>
          )}
          {isLoading && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <Loader />
            </div>
          )}
          {isSuccess && (
            <div className="flex-1 flex items-center justify-center animate-fade-in">
              <SuccessMessage message="Deposit Successful!" />
            </div>
          )}
          {!isLoading && !isSuccess && !isError && (
            <form
              onSubmit={handleSubmit(onSubmit)}
              onKeyDown={onEnter}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <DepositForm formMethods={formMethods} onEnter={onEnter} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
