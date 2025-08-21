import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { type TransactionDetails } from "@src/services/ledger";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import { ens } from "@src/services/Ens";

interface WithdrawFormData {
  recipient: string;
  amount: string;
}

const asyncOperationPromise = Promise.resolve();

export const useTwoStepWithdrawModal = (decimals: number) => {
  const { ledger } = useContext(LedgerContext);
  const { privateBalance } = useContext(PanelContext);
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
  const [promise, setPromise] = useState<Promise<void>>(asyncOperationPromise);
  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<WithdrawFormData>({
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  const onModalOpen = useCallback(
    () =>
      setPromise(
        promise.then(() => {
          setIsModalSuccess(false);
          setIsModalLoading(false);
          setErrorMessage(undefined);
          setCurrentStep("form");
          setMetaTransactionData(undefined);
          disableSwipe();
          setIsModalOpen(true);
        }),
      ),
    [disableSwipe, promise],
  );

  const handleBack = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
          setIsModalOpen(false);
          await delay(500);
          form.reset();
          setMetaTransactionData(undefined);
          setCurrentStep("form");
          enableSwipe();
        }),
      ),
    [form, enableSwipe, promise],
  );

  const handleFormSubmit = useCallback(
    (data: WithdrawFormData) =>
      setPromise(
        promise.then(async () => {
          try {
            setIsModalLoading(true);

            const recipient = await ens.universalResolve(data.recipient);

            const amount = parseUnits(data.amount, decimals);
            let metaTransactionData;

            if (amount === privateBalance) {
              // Full withdraw
              const fullWithdrawData =
                await ledger!.prepareWithdrawMetaTransaction(recipient);
              metaTransactionData = fullWithdrawData;
            } else {
              // Partial withdraw
              metaTransactionData =
                await ledger!.preparePartialWithdrawMetaTransaction(
                  amount,
                  recipient,
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
      ),
    [ledger, decimals, privateBalance, handleBack, promise],
  );

  const handleSign = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
          if (!metaTransactionData) return;

          try {
            setIsModalLoading(true);

            await ledger!.executeMetaTransaction(
              metaTransactionData.metaTransaction,
              metaTransactionData.coveredGas,
            );

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
      ),
    [ledger, metaTransactionData, handleBack, promise],
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
