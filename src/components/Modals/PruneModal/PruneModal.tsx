import clsx from "clsx";
import { BackButton } from "@src/components/Buttons/BackButton";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";

interface PruneConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PruneConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: PruneConfirmModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full h-dvh",
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
            "md:max-w-md md:rounded-xl bg-gray-900",
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",
            isOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          <div className="flex-1 content-center py-5">
            <BackButton onClick={onCancel} />
            <form onSubmit={handleSubmit} className="flex pt-20">
              <div className="flex flex-col items-center justify-center">
                <h3 className="text-lg font-medium text-white mb-4">
                  Confirm Data Deletion
                </h3>
                <p className="text-white/80 mb-8 text-center">
                  This will permanently delete all your wallet data, notes, and
                  transactions. This action cannot be undone.
                </p>
                <div className="py-4 w-full">
                  <MobileConfirmButton
                    disabled={false}
                    label="Delete All Data"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
