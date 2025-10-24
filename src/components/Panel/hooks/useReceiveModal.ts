import { useModal } from "@src/hooks/useModal";

export const useReceiveModal = () => {
  const { isOpen, openModal, closeModal } = useModal();

  return {
    isReceiveModalOpen: isOpen,
    onReceiveModalOpen: openModal,
    onReceiveModalClose: closeModal,
  };
};
