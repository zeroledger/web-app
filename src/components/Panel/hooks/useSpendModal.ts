import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import {
  type SpendFeesData,
  type TransactionDetails,
} from "@src/services/ledger";
import { ens } from "@src/services/Ens";
import { type SpendParams } from "@src/utils/vault";
import { useSettings } from "@src/hooks/useSettings";

interface SpendFormData {
  recipient: string;
  amount: string;
}

export interface SpendModalState {
  step: "form" | "preview";
  isModalOpen: boolean;
  isModalLoading: boolean;
  isModalError: boolean;
  isModalSuccess: boolean;
  errorMessage?: string;
  spendFees?: SpendFeesData;
  spendParams?: SpendParams;
  metaTransaction?: UnsignedMetaTransaction;
  transactionDetails?: TransactionDetails;
}

const asyncOperationPromise = Promise.resolve();

export const useTwoStepSpendModal = (
  decimals: number,
  ownerAddress: Address,
  balanceForConsolidation: bigint,
) => {
  const { ledger } = useContext(LedgerContext);
  const { settings } = useSettings();
  const skipSecondStep = !settings.showTransactionPreview;
  const [promise, setPromise] = useState<Promise<void>>(asyncOperationPromise);

  const form = useForm<SpendFormData>({
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  const [state, setState] = useState<SpendModalState>({
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
        }),
      ),
    [promise, resetState],
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
        }),
      ),
    [form, promise, resetState],
  );

  const onConsolidationOpen = useCallback(() => {
    setPromise(
      promise.then(async () => {
        try {
          setState((prev) => ({
            ...prev,
            isModalSuccess: false,
            errorMessage: undefined,
            isModalOpen: true,
            isModalLoading: true,
          }));

          const spendFees = await ledger!.fees.getSpendFeesData(decimals);

          const metaTransactionData =
            await ledger!.transactions.prepareSendMetaTransaction(
              balanceForConsolidation,
              ownerAddress,
              true,
              spendFees,
            );

          if (skipSecondStep) {
            // Skip preview step and go directly to signing
            await ledger!.transactions.executeMetaTransaction(
              metaTransactionData.metaTransaction!,
              spendFees.coveredGas.toString(),
            );
            setState((prev) => ({
              ...prev,
              spendFees,
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
              spendFees,
              step: "preview" as const,
              isModalLoading: false,
            }));
          }
        } catch (error) {
          console.error("Failed to prepare metaTransaction:", error);
          setState((prev) => ({
            ...prev,
            isModalError: true,
            isModalLoading: false,
            errorMessage:
              (error as Error)?.message ?? "Failed to prepare metaTransaction",
          }));
          await delay(3000);
          handleBack();
        }
      }),
    );
  }, [
    promise,
    ledger,
    skipSecondStep,
    ownerAddress,
    balanceForConsolidation,
    handleBack,
    decimals,
  ]);

  const handleFormSubmit = useCallback(
    (data: SpendFormData) =>
      setPromise(
        promise.then(async () => {
          try {
            if (!state.spendFees) {
              throw new Error("Error getting spend fees");
            }
            setState((prev) => ({
              ...prev,
              isModalLoading: true,
            }));

            const recipient = await ens.universalResolve(data.recipient);

            // This is a placeholder - in reality, you would call the ledger service
            // to prepare the metatransaction data
            const metaTransactionData =
              await ledger!.transactions.prepareSendMetaTransaction(
                parseUnits(data.amount, decimals),
                recipient,
                false,
                state.spendFees,
              );

            if (skipSecondStep) {
              // Skip preview step and go directly to signing
              await ledger!.transactions.executeMetaTransaction(
                metaTransactionData.metaTransaction!,
                state.spendFees.coveredGas.toString(),
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
            console.error("Failed to prepare metaTransaction:", error);
            setState((prev) => ({
              ...prev,
              isModalError: true,
              isModalLoading: false,
              errorMessage:
                (error as Error)?.message ??
                "Failed to prepare metaTransaction",
            }));
            await delay(3000);
            handleBack();
          }
        }),
      ),
    [ledger, skipSecondStep, decimals, handleBack, promise, state],
  );

  const handleSign = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
          try {
            if (!state.metaTransaction || !state.spendFees) {
              throw new Error("Error getting meta transaction");
            }
            setState((prev) => ({
              ...prev,
              isModalLoading: true,
            }));

            await ledger!.transactions.executeMetaTransaction(
              state.metaTransaction,
              state.spendFees.coveredGas.toString(),
            );
            setState((prev) => ({
              ...prev,
              isModalSuccess: true,
            }));
          } catch (error) {
            setState((prev) => ({
              ...prev,
              errorMessage: "Failed to send metaTransaction",
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
      onConsolidationOpen,
    }),
    [
      state,
      setState,
      form,
      onModalOpen,
      handleFormSubmit,
      handleSign,
      handleBack,
      onConsolidationOpen,
    ],
  );
};
