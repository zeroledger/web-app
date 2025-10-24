import { useState } from "react";
import { useModalBehavior } from "./useModalBehavior";

export const useModal = (options?: Parameters<typeof useModalBehavior>[2]) => {
  const [isOpen, setIsOpen] = useState(false);

  const modalBehavior = useModalBehavior(isOpen, setIsOpen, options);

  return {
    ...modalBehavior,
  };
};
