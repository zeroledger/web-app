import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useSwipe } from "./useSwipe";

interface PaymentFormData {
  recipient: string;
  amount: string;
}

export const useSendModal = (decimals: number) => {
  const { ledgerService } = useContext(LedgerContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalSuccess, setIsModalSuccess] = useState(false);
  const [isModalError, setIsModalError] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<PaymentFormData>({
    mode: "onSubmit",
    reValidateMode: "onSubmit",
    defaultValues: {
      recipient: "",
      amount: "",
    },
  });

  const onModalOpen = () => {
    setIsModalOpen(true);
    setIsModalSuccess(false);
    setIsModalLoading(false);
    setIsModalError(false);
    disableSwipe();
  };

  const handleSend = async (data: PaymentFormData) => {
    setIsModalLoading(true);
    try {
      await ledgerService?.send(
        parseUnits(data.amount, decimals),
        data.recipient as Address,
      );
      setIsModalLoading(false);
      setIsModalSuccess(true);
      setTimeout(() => {
        // Reset form and close modal
        form.reset();
        setIsModalOpen(false);
        enableSwipe();
      }, 2000);
    } catch (error) {
      setIsModalLoading(false);
      setIsModalError(true);
      console.error(error);
    }
  };

  const handleBack = () => {
    form.reset();
    setIsModalOpen(false);
    setIsModalSuccess(false);
    setIsModalLoading(false);
    setIsModalError(false);
    enableSwipe();
  };

  return {
    isModalOpen,
    isModalLoading,
    isModalSuccess,
    isModalError,
    form,
    onModalOpen,
    handleSend,
    handleBack,
  };
};
