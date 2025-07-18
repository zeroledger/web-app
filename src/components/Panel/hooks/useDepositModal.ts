import { LedgerContext } from "@src/context/ledger.context";
import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { parseUnits } from "viem";
import { useSwipe } from "./useSwipe";

interface DepositFormData {
  amount: string;
}

export const useDepositModal = () => {
  const { ledgerServices } = useContext(LedgerContext);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isDepositModalLoading, setIsDepositModalLoading] = useState(false);
  const [isDepositModalSuccess, setIsDepositModalSuccess] = useState(false);
  const [isDepositModalError, setIsDepositModalError] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const depositForm = useForm<DepositFormData>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      amount: "",
    },
  });

  const onDepositModalOpen = () => {
    setIsDepositModalOpen(true);
    setIsDepositModalSuccess(false);
    setIsDepositModalLoading(false);
    setIsDepositModalError(false);
    disableSwipe();
  };

  const handleDeposit = async (data: DepositFormData, decimals: number) => {
    setIsDepositModalLoading(true);
    try {
      await ledgerServices?.ledgerService.deposit(
        parseUnits(data.amount, decimals),
      );
      setIsDepositModalLoading(false);
      setIsDepositModalSuccess(true);
      setTimeout(() => {
        // Reset form and close modal
        depositForm.reset();
        setIsDepositModalOpen(false);
        enableSwipe();
      }, 1000);
    } catch (error) {
      setIsDepositModalLoading(false);
      setIsDepositModalError(true);
      console.error(error);
    }
  };

  const handleDepositBack = () => {
    setIsDepositModalOpen(false);
    enableSwipe();
  };

  return {
    isDepositModalOpen,
    isDepositModalLoading,
    isDepositModalSuccess,
    isDepositModalError,
    depositForm,
    onDepositModalOpen,
    handleDeposit,
    handleDepositBack,
  };
};
