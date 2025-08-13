import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { type TransactionDetails } from "@src/services/ledger";
import { ens } from "@src/services/Ens";

interface SpendFormData {
  recipient: string;
  amount: string;
}

const asyncOperationPromise = Promise.resolve();

export const useTwoStepSpendModal = (decimals: number) => {
  const { ledger } = useContext(LedgerContext);
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

  const form = useForm<SpendFormData>({
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
    async (data: SpendFormData) =>
      await asyncOperationPromise.then(async () => {
        try {
          setIsModalLoading(true);

          const recipient = await ens.universalResolve(data.recipient);

          // This is a placeholder - in reality, you would call the ledger service
          // to prepare the metatransaction data
          const metaTransactionData = await ledger!.prepareSendMetaTransaction(
            parseUnits(data.amount, decimals),
            recipient,
          );

          setMetaTransactionData(metaTransactionData);
          setCurrentStep("preview");
          setIsModalLoading(false);
        } catch (error) {
          console.error("Failed to prepare metaTransaction:", error);
          setErrorMessage(
            (error as Error)?.message ?? "Failed to prepare metaTransaction",
          );
          setIsModalLoading(false);
          await delay(3000);
          handleBack();
        }
      }),
    [ledger, decimals, handleBack],
  );

  const handleSign = useCallback(
    async () =>
      await asyncOperationPromise.then(async () => {
        if (!metaTransactionData) return;

        try {
          setIsModalLoading(true);

          await ledger!.send(
            metaTransactionData.metaTransaction,
            metaTransactionData.coveredGas,
          );
          setIsModalSuccess(true);
        } catch (error) {
          setErrorMessage("Failed to send metaTransaction");
          console.error(error);
        } finally {
          setIsModalLoading(false);
          await delay(2000);
          handleBack();
        }
      }),
    [ledger, metaTransactionData, handleBack],
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
