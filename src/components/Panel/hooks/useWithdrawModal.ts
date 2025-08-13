import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { type TransactionDetails } from "@src/services/ledger";

interface WithdrawFormData {
  recipient: string;
  amount: string;
}

const asyncOperationPromise = Promise.resolve();

export const useTwoStepWithdrawModal = (decimals: number) => {
  const { ledger, privateBalance } = useContext(LedgerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalSuccess, setIsModalSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");
  const [metaTransactionData, setMetaTransactionData] = useState<{
    metaTransaction: UnsignedMetaTransaction;
    coveredGas: string;
    transactionDetails: TransactionDetails;
  }>();

  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<WithdrawFormData>({
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  const onModalOpen = useCallback(
    async () =>
      await asyncOperationPromise.then(() => {
        setIsModalSuccess(false);
        setIsModalLoading(false);
        setErrorMessage(undefined);
        setCurrentStep("form");
        setMetaTransactionData(undefined);
        disableSwipe();
        setIsModalOpen(true);
      }),
    [disableSwipe],
  );

  const handleBack = useCallback(
    async () =>
      await asyncOperationPromise.then(async () => {
        setIsModalOpen(false);
        await delay(500);
        form.reset();
        setMetaTransactionData(undefined);
        setCurrentStep("form");
        enableSwipe();
      }),
    [form, enableSwipe],
  );

  const handleFormSubmit = useCallback(
    async (data: WithdrawFormData) =>
      await asyncOperationPromise.then(async () => {
        try {
          setIsModalLoading(true);

          const amount = parseUnits(data.amount, decimals);
          let metaTransactionData;

          if (amount === privateBalance) {
            // Full withdraw
            const fullWithdrawData =
              await ledger!.prepareWithdrawMetaTransaction(
                data.recipient as Address,
              );
            metaTransactionData = fullWithdrawData;
          } else {
            // Partial withdraw
            metaTransactionData =
              await ledger!.preparePartialWithdrawMetaTransaction(
                amount,
                data.recipient as Address,
              );
          }
          setMetaTransactionData(metaTransactionData);
          setCurrentStep("preview");
          setIsModalLoading(false);
        } catch (error) {
          console.error("Failed to prepare withdraw transaction:", error);
          setErrorMessage("Failed to prepare withdraw transaction");
          setIsModalLoading(false);
          await delay(3000);
          handleBack();
        }
      }),
    [ledger, decimals, privateBalance, handleBack],
  );

  const handleSign = useCallback(
    async () =>
      await asyncOperationPromise.then(async () => {
        if (!metaTransactionData) return;

        try {
          setIsModalLoading(true);

          const amount = parseUnits(form.getValues("amount"), decimals);

          if (amount === privateBalance) {
            // Full withdraw
            await ledger!.withdraw(
              metaTransactionData.metaTransaction,
              metaTransactionData.coveredGas,
            );
          } else {
            // Partial withdraw
            await ledger!.partialWithdraw(
              metaTransactionData.metaTransaction,
              metaTransactionData.coveredGas,
            );
          }

          setIsModalSuccess(true);
        } catch (error) {
          setErrorMessage("Failed to sign withdraw transaction");
          console.error(error);
        } finally {
          setIsModalLoading(false);
          await delay(2000);
          handleBack();
        }
      }),
    [ledger, form, decimals, privateBalance, metaTransactionData, handleBack],
  );

  return useMemo(
    () => ({
      isModalOpen,
      isModalLoading,
      isModalSuccess,
      errorMessage,
      currentStep,
      form,
      onModalOpen,
      handleFormSubmit,
      handleSign,
      handleBack,
      metaTransactionData,
    }),
    [
      isModalOpen,
      isModalLoading,
      isModalSuccess,
      errorMessage,
      currentStep,
      form,
      onModalOpen,
      handleFormSubmit,
      handleSign,
      handleBack,
      metaTransactionData,
    ],
  );
};
