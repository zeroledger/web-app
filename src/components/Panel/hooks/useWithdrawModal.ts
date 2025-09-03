import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import {
  type WithdrawFeesData,
  type TransactionDetails,
  type SpendFeesData,
} from "@src/services/ledger";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { ens } from "@src/services/Ens";
import { type WithdrawParams, type CommitmentStruct } from "@src/utils/vault";

interface WithdrawFormData {
  recipient: string;
  amount: string;
}

export interface WithdrawModalState {
  step: "form" | "preview";
  isModalOpen: boolean;
  isModalLoading: boolean;
  isModalError: boolean;
  isModalSuccess: boolean;
  errorMessage?: string;
  withdrawFees?: WithdrawFeesData;
  itemsToWithdraw?: CommitmentStruct[];
  spendFees?: SpendFeesData;
  withdrawParams?: WithdrawParams;
  metaTransaction?: UnsignedMetaTransaction;
  transactionDetails?: TransactionDetails;
}

const asyncOperationPromise = Promise.resolve();

export const useTwoStepWithdrawModal = (decimals: number) => {
  const { ledger } = useContext(LedgerContext);
  const { privateBalance } = useContext(PanelContext);
  const [promise, setPromise] = useState<Promise<void>>(asyncOperationPromise);
  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<WithdrawFormData>({
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  const [state, setState] = useState<WithdrawModalState>({
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
          disableSwipe();
          setState((prev) => ({
            ...prev,
            isModalOpen: true,
          }));
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
          form.reset();
          resetState();
          enableSwipe();
        }),
      ),
    [form, enableSwipe, promise, resetState],
  );

  const handleFormSubmit = useCallback(
    (data: WithdrawFormData) =>
      setPromise(
        promise.then(async () => {
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

            const recipient = await ens.universalResolve(data.recipient);

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
            setState((prev) => ({
              ...prev,
              ...metaTransactionData,
              step: "preview" as const,
              isModalLoading: false,
            }));
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
      ),
    [ledger, decimals, privateBalance, handleBack, promise, state],
  );

  const handleSign = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
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

            await ledger!.transactions.executeMetaTransaction(
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
      ),
    [ledger, handleBack, promise, state],
  );

  return useMemo(
    () => ({
      state,
      setState,
      form,
      onModalOpen,
      handleFormSubmit,
      handleSign,
      handleBack,
    }),
    [
      state,
      setState,
      form,
      onModalOpen,
      handleFormSubmit,
      handleSign,
      handleBack,
    ],
  );
};
