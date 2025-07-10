import { useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { Address, parseUnits } from "viem";
import { DecoyContext } from "@src/context/decoy.context";
import { useSwipe } from "./useSwipe";

interface WithdrawFormData {
  recipient: string;
  amount: string;
}

export const useWithdrawModal = (decimals: number) => {
  const { clientController } = useContext(DecoyContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [isModalSuccess, setIsModalSuccess] = useState(false);
  const [isModalError, setIsModalError] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const form = useForm<WithdrawFormData>({
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

  const handleWithdraw = async (data: WithdrawFormData) => {
    setIsModalLoading(true);
    try {
      await clientController?.withdraw(
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
    handleWithdraw,
    handleBack,
  };
};
