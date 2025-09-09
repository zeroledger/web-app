import { ReactNode, CSSProperties } from "react";
import clsx from "clsx";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  onEnterKey?: () => void;
  style?: CSSProperties;
}

export default function BaseModal({
  isOpen,
  onClose,
  children,
  className,
  contentClassName,
  closeOnEscape = true,
  closeOnOverlayClick = true,
  onEnterKey,
  style,
}: BaseModalProps) {
  const modalProps = {
    className: clsx(
      "fixed inset-0 z-50 w-full h-dvh",
      "transition-all duration-500 ease-in-out",
      isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      className,
    ),
    onClick: closeOnOverlayClick
      ? (e: React.MouseEvent) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }
      : undefined,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape" && closeOnEscape) {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey && onEnterKey) {
        e.preventDefault();
        onEnterKey();
      }
    },
  };

  const contentProps = {
    className: clsx(
      "flex flex-col w-full h-full md:w-[50%]",
      "md:max-w-md md:rounded-xl bg-gray-900",
      "overflow-hidden",
      "transition-all duration-500 ease-in-out",
      isOpen
        ? "translate-x-0 md:scale-100"
        : "translate-x-full md:translate-x-0 md:scale-95",
      contentClassName,
    ),
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    tabIndex: -1,
  };

  return (
    <div {...modalProps} style={style}>
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center">
        <div {...contentProps}>{children}</div>
      </div>
    </div>
  );
}
