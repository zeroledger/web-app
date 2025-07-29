import { useState, useContext, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";
import { delay } from "@src/utils/common";
import { type UnsignedMetaTransaction } from "@src/utils/metatx";
import { TransactionDetails } from "@src/services/ledger/ledger.service";
import { type DepositParams } from "@src/utils/vault/types";

interface DepositFormData {
  amount: string;
}

const asyncOperationPromise = Promise.resolve();

export const useMultiStepDepositModal = (decimals: number) => {
  const { ledgerService } = useContext(LedgerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalSuccess, setIsModalSuccess] = useState(false);
  const [isModalError, setIsModalError] = useState(false);
  const [currentStep, setCurrentStep] = useState<"form" | "params" | "preview">(
    "form",
  );
  const [depositParamsData, setDepositParamsData] = useState<{
    depositParams: DepositParams;
    gasToCover: bigint;
  }>();
  const [metaTransactionData, setMetaTransactionData] = useState<{
    metaTransaction: UnsignedMetaTransaction;
    coveredGas: string;
    transactionDetails: TransactionDetails;
  }>();

  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<DepositFormData>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
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
        setDepositParamsData(undefined);
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
        setDepositParamsData(undefined);
        setMetaTransactionData(undefined);
        setCurrentStep("form");
        enableSwipe();
      }),
    [form, enableSwipe],
  );

  const handleFormSubmit = useCallback(
    async (data: DepositFormData) =>
      await asyncOperationPromise.then(async () => {
        try {
          setIsModalLoading(true);

          const depositParamsData =
            await ledgerService!.prepareDepositParamsForApproval(
              parseUnits(data.amount, decimals),
            );

          setDepositParamsData(depositParamsData);
          setCurrentStep("params");
          setIsModalLoading(false);
        } catch (error) {
          console.error("Failed to prepare deposit params:", error);
          setIsModalError(true);
          setIsModalLoading(false);
          await delay(3000);
          handleBack();
        }
      }),
    [ledgerService, decimals, handleBack],
  );

  const handleParamsApprove = useCallback(
    async () =>
      await asyncOperationPromise.then(async () => {
        if (!depositParamsData) return;

        try {
          setIsModalLoading(true);

          await ledgerService!.approveDeposit(depositParamsData.depositParams);

          const metaTransactionData =
            await ledgerService!.prepareDepositMetaTransaction(
              depositParamsData.depositParams,
              depositParamsData.gasToCover,
            );

          setMetaTransactionData(metaTransactionData);
          setCurrentStep("preview");
          setIsModalLoading(false);
        } catch (error) {
          console.error(
            "Failed to approve deposit or prepare meta transaction:",
            error,
          );
          setIsModalError(true);
          setIsModalLoading(false);
          await delay(3000);
          handleBack();
        }
      }),
    [ledgerService, depositParamsData, handleBack],
  );

  const handleSign = useCallback(
    async () =>
      await asyncOperationPromise.then(async () => {
        if (!metaTransactionData) return;

        try {
          setIsModalLoading(true);

          await ledgerService!.deposit(
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
      handleParamsApprove,
      handleSign,
      handleBack,
      depositParamsData,
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
      handleParamsApprove,
      handleSign,
      handleBack,
      depositParamsData,
      metaTransactionData,
    ],
  );
};
