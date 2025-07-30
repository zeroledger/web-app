import { clsx } from "clsx";
import { ReactNode } from "react";

export const SecondStepExtraContent = ({
  isDetailsOpen,
  setIsDetailsOpen,
  getTransactionDetails,
}: {
  isDetailsOpen: boolean;
  setIsDetailsOpen: (isOpen: boolean) => void;
  getTransactionDetails: { label: string; value: string | ReactNode }[];
}) => {
  return (
    <div className="bg-gray-700 rounded-lg border border-gray-600 mb-6 overflow-hidden">
      <button
        onClick={() => setIsDetailsOpen(!isDetailsOpen)}
        className="w-full text-left p-4 hover:bg-gray-600 transition-colors border-b border-gray-600"
      >
        <div className="flex justify-between items-center">
          <h3 className="text-white font-semibold">Transaction Details</h3>
          <span className="text-gray-400 text-sm transition-all duration-200">
            {isDetailsOpen ? "Hide" : "Show"}
          </span>
        </div>
      </button>
      <div
        className={clsx(
          "transition-all duration-300 ease-in-out overflow-hidden",
          isDetailsOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="p-4">
          <div className="space-y-3 text-sm">
            {getTransactionDetails.map((detail) => (
              <div key={detail.label} className="flex justify-between">
                <span className="text-gray-400">{detail.label}:</span>
                <span className="text-white font-mono break-all text-right ml-2">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
