import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { TransactionDetails } from "@src/services/ledger/ledger.service";

interface SpendFormData {
  recipient: string;
  amount: string;
}

const asyncOperationPromise = Promise.resolve();

export const useTwoStepSpendModal = (decimals: number) => {
  const { ledgerService } = useContext(LedgerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalSuccess, setIsModalSuccess] = useState(false);
  const [isModalError, setIsModalError] = useState(false);
  const [currentStep, setCurrentStep] = useState<"form" | "preview">("form");
  const [metaTransactionData, setMetaTransactionData] = useState<{
    metaTransaction: UnsignedMetaTransaction;
    coveredGas: string;
    transactionDetails: TransactionDetails;
  }>();

  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<SpendFormData>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
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
        setIsModalError(false);
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
    async (data: SpendFormData) =>
      await asyncOperationPromise.then(async () => {
        try {
          setIsModalLoading(true);

          // This is a placeholder - in reality, you would call the ledger service
          // to prepare the metatransaction data
          const metaTransactionData =
            await ledgerService!.prepareSendMetaTransaction(
              parseUnits(data.amount, decimals),
              data.recipient as Address,
            );

          setMetaTransactionData(metaTransactionData);
          setCurrentStep("preview");
          setIsModalLoading(false);
        } catch (error) {
          console.error("Failed to prepare metaTransaction:", error);
          setIsModalError(true);
          setIsModalLoading(false);
          await delay(3000);
          handleBack();
        }
      }),
    [ledgerService, decimals, handleBack],
  );

  const handleSign = useCallback(
    async () =>
      await asyncOperationPromise.then(async () => {
        if (!metaTransactionData) return;

        try {
          setIsModalLoading(true);

          await ledgerService!.send(
            metaTransactionData.metaTransaction,
            metaTransactionData.coveredGas,
          );
          setIsModalSuccess(true);
        } catch (error) {
          setIsModalError(true);
          console.error(error);
        } finally {
          setIsModalLoading(false);
          await delay(2000);
          handleBack();
        }
      }),
    [ledgerService, metaTransactionData, handleBack],
  );

  return useMemo(
    () => ({
      isModalOpen,
      isModalLoading,
      isModalSuccess,
      isModalError,
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
      isModalError,
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
