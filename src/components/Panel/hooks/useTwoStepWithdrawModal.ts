import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { type TransactionDetails } from "@src/services/ledger/ledger.service";

interface WithdrawFormData {
  recipient: string;
  amount: string;
}

const asyncOperationPromise = Promise.resolve();

export const useTwoStepWithdrawModal = (decimals: number) => {
  const { ledgerService, privateBalance } = useContext(LedgerContext);
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

  const form = useForm<WithdrawFormData>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  const onModalOpen = async () =>
    await asyncOperationPromise.then(() => {
      setIsModalSuccess(false);
      setIsModalLoading(false);
      setIsModalError(false);
      setCurrentStep("form");
      setMetaTransactionData(undefined);
      disableSwipe();
      setIsModalOpen(true);
    });

  const handleBack = async () =>
    await asyncOperationPromise.then(async () => {
      setIsModalOpen(false);
      await delay(500);
      form.reset();
      setMetaTransactionData(undefined);
      setCurrentStep("form");
      enableSwipe();
    });

  const handleFormSubmit = async (data: WithdrawFormData) =>
    await asyncOperationPromise.then(async () => {
      try {
        setIsModalLoading(true);

        const amount = parseUnits(data.amount, decimals);
        let metaTransactionData;

        if (amount === privateBalance) {
          // Full withdraw
          const fullWithdrawData =
            await ledgerService!.prepareWithdrawMetaTransaction(
              data.recipient as Address,
            );
          metaTransactionData = fullWithdrawData;
        } else {
          // Partial withdraw
          metaTransactionData =
            await ledgerService!.preparePartialWithdrawMetaTransaction(
              amount,
              data.recipient as Address,
            );
        }
        setMetaTransactionData(metaTransactionData);
        setCurrentStep("preview");
      } catch (error) {
        console.error("Failed to prepare withdraw transaction:", error);
        setIsModalError(true);
        await delay(3000);
        handleBack();
      } finally {
        setIsModalLoading(false);
      }
    });

  const handleSign = async () =>
    await asyncOperationPromise.then(async () => {
      if (!metaTransactionData) return;

      try {
        setIsModalLoading(true);

        const amount = parseUnits(form.getValues("amount"), decimals);

        if (amount === privateBalance) {
          // Full withdraw
          await ledgerService!.withdraw(
            metaTransactionData.metaTransaction,
            metaTransactionData.coveredGas,
          );
        } else {
          // Partial withdraw
          await ledgerService!.partialWithdraw(
            metaTransactionData.metaTransaction,
            metaTransactionData.coveredGas,
          );
        }

        setIsModalSuccess(true);
      } catch (error) {
        setIsModalError(true);
        console.error(error);
      } finally {
        setIsModalLoading(false);
        await delay(2000);
        handleBack();
      }
    });

  return {
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
  };
};
