import { useContext, useMemo, useCallback } from "react";
import { parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import {
  type DepositFeesData,
  type TransactionDetails,
} from "@src/services/ledger";
import { type DepositParams } from "@src/utils/vault/types";
import {
  useMultiStepModal,
  type MultiStepModalState,
} from "@src/hooks/useMultiStepModal";

interface DepositFormData {
  amount: string;
}

export interface DepositModalState extends MultiStepModalState {
  step: "form" | "params" | "preview";
  depositFees?: DepositFeesData;
  depositParams?: DepositParams;
  metaTransaction?: UnsignedMetaTransaction;
  transactionDetails?: TransactionDetails;
}

export const useMultiStepDepositModal = (decimals: number) => {
  const { ledger } = useContext(LedgerContext);

  const {
    form,
    onModalOpen,
    promise,
    setPromise,
    handleBack,
    state,
    setState,
  } = useMultiStepModal({
    defaultState: {
      step: "form",
    } as DepositModalState,
    defaultValues: {
      amount: "",
    },
  });

  const handleFormSubmit = useCallback(
    (data: DepositFormData) =>
      setPromise(async () => {
        await promise;
        try {
          if (!state.depositFees) {
            throw new Error("Error getting deposit fees");
          }
          setState((prev) => ({
            ...prev,
            isModalLoading: true,
          }));

          const depositFees = state?.depositFees;

          const depositParams =
            await ledger!.transactions.prepareDepositParamsForApproval(
              parseUnits(data.amount, decimals),
              depositFees,
            );

          if (depositParams.approveRequired) {
            setState((prev) => ({
              ...prev,
              depositParams,
              step: "params" as const,
              isModalLoading: false,
            }));
            return;
          }

          const metaTransactionData =
            await ledger!.transactions.prepareDepositMetaTransaction(
              depositParams,
            );

          setState((prev) => ({
            ...prev,
            ...metaTransactionData,
            step: "preview" as const,
            isModalLoading: false,
          }));
        } catch (error) {
          console.error("Failed to prepare deposit params:", error);
          setState((prev) => ({
            ...prev,
            isModalError: true,
            isModalLoading: false,
          }));
          await delay(3000);
          handleBack();
        }
      }),
    [ledger, decimals, handleBack, promise, state, setPromise, setState],
  );

  const handleParamsApprove = useCallback(
    () =>
      setPromise(async () => {
        await promise;
        try {
          if (!state.depositParams || !state.depositFees) {
            throw new Error("Error getting deposit params");
          }
          setState((prev) => ({
            ...prev,
            isModalLoading: true,
          }));

          const { depositParams, depositFees } = state;

          await ledger!.transactions.approveDeposit(
            depositParams,
            depositFees.depositFee,
          );

          const metaTransactionData =
            await ledger!.transactions.prepareDepositMetaTransaction(
              depositParams,
            );

          setState((prev) => ({
            ...prev,
            ...metaTransactionData,
            step: "preview" as const,
            isModalLoading: false,
          }));
        } catch (error) {
          console.error(
            "Failed to approve deposit or prepare meta transaction:",
            error,
          );
          setState((prev) => ({
            ...prev,
            isModalError: true,
            isModalLoading: false,
          }));
          await delay(3000);
          handleBack();
        }
      }),
    [ledger, handleBack, promise, state, setPromise, setState],
  );

  const handleSign = useCallback(
    () =>
      setPromise(async () => {
        await promise;
        try {
          if (!state.depositFees || !state.metaTransaction) {
            throw new Error("Error configuring meta transaction");
          }
          setState((prev) => ({
            ...prev,
            isModalLoading: true,
          }));

          await ledger!.transactions.signAndExecuteMetaTransaction(
            state.metaTransaction,
            state.depositFees.coveredGas.toString(),
          );
          setState((prev) => ({
            ...prev,
            isModalSuccess: true,
          }));
        } catch (error) {
          setState((prev) => ({
            ...prev,
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
    [ledger, handleBack, promise, state, setPromise, setState],
  );

  return useMemo(
    () => ({
      form,
      onModalOpen,
      handleFormSubmit,
      handleParamsApprove,
      handleSign,
      handleBack,
      state,
      setState,
    }),
    [
      form,
      onModalOpen,
      handleFormSubmit,
      handleParamsApprove,
      handleSign,
      handleBack,
      state,
      setState,
    ],
  );
};
