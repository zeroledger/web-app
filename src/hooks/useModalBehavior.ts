import { useCallback, useEffect, useRef } from "react";

interface UseModalBehaviorOptions {
  onClose?: () => void;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  trapFocus?: boolean;
  preventBodyScroll?: boolean;
  onEnterKey?: () => void;
}

interface ModalBehaviorReturn {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  modalProps: {
    className: string;
    onClick: (e: React.MouseEvent) => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
  contentProps: {
    className: string;
    onClick: (e: React.MouseEvent) => void;
    tabIndex: number;
    ref: React.RefObject<HTMLDivElement>;
  };
}

export const useModalBehavior = (
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  options: UseModalBehaviorOptions = {},
): ModalBehaviorReturn => {
  const {
    onClose,
    closeOnEscape = true,
    closeOnOverlayClick = true,
    trapFocus = true,
    preventBodyScroll = true,
    onEnterKey,
  } = options;

  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const openModal = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [setIsOpen, onClose]);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        closeModal();
      } else if (e.key === "Enter" && !e.shiftKey && onEnterKey) {
        e.preventDefault();
        onEnterKey();
      }
    },
    [closeOnEscape, closeModal, onEnterKey],
  );

  // Handle overlay click
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (closeOnOverlayClick && e.target === e.currentTarget) {
        closeModal();
      }
    },
    [closeOnOverlayClick, closeModal],
  );

  // Prevent content click from bubbling to overlay
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Focus management
  useEffect(() => {
    if (isOpen && trapFocus) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal content
      if (contentRef.current) {
        contentRef.current.focus();
      }
    } else if (!isOpen && trapFocus && previousActiveElement.current) {
      // Restore focus to the previously focused element
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen, trapFocus]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (preventBodyScroll && isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Focus trap within modal
  useEffect(() => {
    if (!isOpen || !trapFocus || !contentRef.current) return;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements = contentRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as NodeListOf<HTMLElement>;

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTabKey);
    return () => document.removeEventListener("keydown", handleTabKey);
  }, [isOpen, trapFocus]);

  const modalProps = {
    className:
      "fixed inset-0 z-50 w-full h-dvh transition-all duration-500 ease-in-out",
    onClick: handleOverlayClick,
    onKeyDown: handleKeyDown,
  };

  const contentProps = {
    className:
      "flex flex-col w-full h-full md:w-[50%] md:max-w-md md:rounded-xl bg-gray-900 overflow-hidden transition-all duration-500 ease-in-out",
    onClick: handleContentClick,
    tabIndex: -1,
    ref: contentRef,
  };

  return {
    isOpen,
    openModal,
    closeModal,
    modalProps,
    contentProps,
  };
};
