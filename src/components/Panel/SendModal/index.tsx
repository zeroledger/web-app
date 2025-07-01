import clsx from "clsx";
import { Loader } from "@src/components/Loader";
import { BackButton } from "./BackButton";
import { SuccessMessage } from "./SuccessMessage";
import { PaymentForm } from "./PaymentForm";
import { ErrorMessage } from "./ErrorMessage";
import { UseFormReturn } from "react-hook-form";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";

interface PaymentFormData {
  recipient: string;
  amount: string;
}

interface SendModalProps {
  isOpen: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  onSend: (data: PaymentFormData) => void;
  onBack: () => void;
  formMethods: UseFormReturn<PaymentFormData>;
}

export default function SendModal({
  isOpen,
  isLoading,
  isSuccess,
  isError,
  onSend,
  onBack,
  formMethods,
}: SendModalProps) {
  const { handleSubmit } = formMethods;

  const style = useDynamicHeight("h-dvh");

  const onEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(onSend)();
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
              <SuccessMessage message="Payment Successful!" />
            </div>
          )}
          {!isLoading && !isSuccess && !isError && (
            <form
              onSubmit={handleSubmit(onSend)}
              onKeyDown={onEnter}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <PaymentForm formMethods={formMethods} onEnter={onEnter} />
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
