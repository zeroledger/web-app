import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import {
  type DepositFeesData,
  type TransactionDetails,
} from "@src/services/ledger";
import { type DepositParams } from "@src/utils/vault/types";

interface DepositFormData {
  amount: string;
}

export interface DepositModalState {
  step: "form" | "params" | "preview";
  depositFees?: DepositFeesData;
  depositParams?: DepositParams;
  metaTransaction?: UnsignedMetaTransaction;
  transactionDetails?: TransactionDetails;
  isModalError: boolean;
  isModalSuccess: boolean;
  isModalLoading: boolean;
  isModalOpen: boolean;
}

const asyncOperationPromise = Promise.resolve();

export const useMultiStepDepositModal = (decimals: number) => {
  const { ledger } = useContext(LedgerContext);
  const [promise, setPromise] = useState<Promise<void>>(asyncOperationPromise);
  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<DepositFormData>({
    defaultValues: {
      amount: "",
    },
  });

  const [state, setState] = useState<DepositModalState>({
    step: "form" as const,
    isModalOpen: false,
    isModalLoading: false,
    isModalError: false,
    isModalSuccess: false,
  });

  const resetState = useCallback(() => {
    setState({
      step: "form" as const,
      isModalOpen: false,
      isModalLoading: false,
      isModalError: false,
      isModalSuccess: false,
    });
  }, []);

  const onModalOpen = useCallback(
    () =>
      setPromise(
        promise.then(() => {
          resetState();
          setState((prev) => ({
            ...prev,
            isModalOpen: true,
          }));
          disableSwipe();
        }),
      ),
    [disableSwipe, promise, resetState],
  );

  const handleBack = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
          setState((prev) => ({
            ...prev,
            isModalOpen: false,
          }));
          await delay(500);
          resetState();
          form.reset();
          enableSwipe();
        }),
      ),
    [form, enableSwipe, promise, resetState],
  );

  const handleFormSubmit = useCallback(
    (data: DepositFormData) =>
      setPromise(
        promise.then(async () => {
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
      ),
    [ledger, decimals, handleBack, promise, state],
  );

  const handleParamsApprove = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
          if (!state.depositParams || !state.depositFees) {
            throw new Error("Error getting deposit params");
          }

          try {
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
      ),
    [ledger, handleBack, promise, state],
  );

  const handleSign = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
          if (!state.depositFees || !state.metaTransaction) {
            throw new Error("Error configuring meta transaction");
          }

          try {
            setState((prev) => ({
              ...prev,
              isModalLoading: true,
            }));

            await ledger!.transactions.executeMetaTransaction(
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
      ),
    [ledger, handleBack, promise, state],
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
