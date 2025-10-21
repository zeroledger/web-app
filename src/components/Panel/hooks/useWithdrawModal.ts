import { useContext } from "react";
import { parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import {
  type WithdrawFeesData,
  type TransactionDetails,
  type SpendFeesData,
} from "@src/services/ledger";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { type WithdrawParams, type CommitmentStruct } from "@src/utils/vault";
import { useSettings } from "@src/hooks/useSettings";
import {
  useMultiStepModal,
  type MultiStepModalState,
} from "@src/hooks/useMultiStepModal";
import debounce from "debounce";

interface WithdrawFormData {
  amount: string;
}

export interface WithdrawModalState extends MultiStepModalState {
  step: "form" | "preview";
  withdrawFees?: WithdrawFeesData;
  itemsToWithdraw?: CommitmentStruct[];
  spendFees?: SpendFeesData;
  withdrawParams?: WithdrawParams;
  metaTransaction?: UnsignedMetaTransaction;
  transactionDetails?: TransactionDetails;
}

const defaultConfig = {
  defaultState: {
    step: "form",
  } as WithdrawModalState,
  defaultValues: {
    amount: "",
  },
};

export const useTwoStepWithdrawModal = (decimals: number) => {
  const { ledger } = useContext(LedgerContext);
  const { wallet } = useWalletAdapter();
  const { settings } = useSettings();
  const skipSecondStep = !settings.showTransactionPreview;
  const { privateBalance } = useContext(PanelContext);

  const {
    form,
    onModalOpen,
    promise,
    setPromise,
    handleBack,
    state,
    setState,
  } = useMultiStepModal(defaultConfig);

  const handleFormSubmit = debounce(
    (data: WithdrawFormData) =>
      setPromise(async () => {
        await promise;
        try {
          if (
            !state.spendFees ||
            !state.withdrawFees ||
            !state.itemsToWithdraw
          ) {
            throw new Error("Error getting fees");
          }
          setState((prev) => ({
            ...prev,
            isModalLoading: true,
          }));

          // Use user's own address as recipient for withdraw
          const recipient = wallet!.address as `0x${string}`;

          const amount = parseUnits(data.amount, decimals);
          let metaTransactionData;

          if (amount === privateBalance) {
            // Full withdraw
            const fullWithdrawData =
              await ledger!.transactions.prepareWithdrawMetaTransaction(
                recipient,
                state.withdrawFees,
                state.itemsToWithdraw,
              );
            metaTransactionData = fullWithdrawData;
          } else {
            // Partial withdraw
            metaTransactionData =
              await ledger!.transactions.preparePartialWithdrawMetaTransaction(
                amount,
                recipient,
                state.spendFees,
              );
          }

          if (skipSecondStep) {
            // Skip preview step and go directly to signing
            await ledger!.transactions.signAndExecuteMetaTransaction(
              metaTransactionData.metaTransaction!,
              metaTransactionData.transactionDetails?.type === "withdraw"
                ? state.withdrawFees!.coveredGas.toString()
                : state.spendFees!.coveredGas.toString(),
            );
            setState((prev) => ({
              ...prev,
              isModalSuccess: true,
              isModalLoading: false,
            }));
            await delay(1000);
            handleBack();
          } else {
            // Go to preview step as usual
            setState((prev) => ({
              ...prev,
              ...metaTransactionData,
              step: "preview" as const,
              isModalLoading: false,
            }));
          }
        } catch (error) {
          console.error("Failed to prepare withdraw transaction:", error);
          setState((prev) => ({
            ...prev,
            isModalError: true,
            isModalLoading: false,
            errorMessage: "Failed to prepare withdraw transaction",
          }));
          await delay(3000);
          handleBack();
        }
      }),
    50,
  );

  const handleSign = debounce(
    () =>
      setPromise(async () => {
        await promise;
        try {
          if (
            !state.metaTransaction ||
            !state.withdrawFees ||
            !state.spendFees ||
            !state.transactionDetails
          ) {
            throw new Error("Error getting meta transaction");
          }
          setState((prev) => ({
            ...prev,
            isModalLoading: true,
          }));

          await ledger!.transactions.signAndExecuteMetaTransaction(
            state.metaTransaction,
            state.transactionDetails.type === "withdraw"
              ? state.withdrawFees.coveredGas.toString()
              : state.spendFees?.coveredGas.toString(),
          );

          setState((prev) => ({
            ...prev,
            isModalSuccess: true,
          }));
        } catch (error) {
          setState((prev) => ({
            ...prev,
            errorMessage: "Failed to sign withdraw transaction",
            isModalError: true,
          }));
          console.error(error);
        } finally {
          setState((prev) => ({
            ...prev,
            isModalLoading: false,
          }));
          await delay(2000);
          handleBack();
        }
      }),
    50,
  );

  return {
    state,
    setState,
    form,
    onModalOpen,
    handleFormSubmit,
    handleSign,
    handleBack,
  };
};
