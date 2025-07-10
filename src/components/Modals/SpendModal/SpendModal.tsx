import clsx from "clsx";
import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { SuccessMessage } from "@src/components/Modals/SuccessMessage";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { UseFormReturn } from "react-hook-form";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { SpendForm } from "./SpendForm";

interface SpendFormData {
  recipient: string;
  amount: string;
}

interface SendModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  onSpend: (data: SpendFormData) => void;
  onBack: () => void;
  formMethods: UseFormReturn<SpendFormData>;
  type: "Payment" | "Withdraw";
}

export default function SendModal({
  isOpen,
  isLoading,
  isSuccess,
  isError,
  onSpend,
  onBack,
  formMethods,
  type,
}: SendModalProps) {
  const { handleSubmit } = formMethods;

  const style = useDynamicHeight("h-dvh");

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSpend)();
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full",
        "transition-all duration-500 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
      style={style}
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
            {!isLoading && !isSuccess && !isError && (
              <BackButton onClick={onBack} />
            )}
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
              <SuccessMessage message={`${type} Successful!`} />
            </div>
          )}
          {!isLoading && !isSuccess && !isError && (
            <form
              onSubmit={handleSubmit(onSpend)}
              onKeyDown={onEnter}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <SpendForm
                formMethods={formMethods}
                onEnter={onEnter}
                type={type}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
