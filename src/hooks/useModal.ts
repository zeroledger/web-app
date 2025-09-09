import { useState, useCallback } from "react";
import { useModalBehavior } from "./useModalBehavior";

export const useModal = (options?: Parameters<typeof useModalBehavior>[2]) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  const modalBehavior = useModalBehavior(isOpen, setIsOpen, options);

  return {
    isOpen,
    openModal,
    closeModal,
    ...modalBehavior,
  };
};
