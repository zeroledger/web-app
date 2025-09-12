import clsx from "clsx";
import { BackButton } from "@src/components/Buttons/BackButton";
import { QuestionIcon } from "@src/components/svg/QuestionIcon";
import { TelegramIcon } from "@src/components/svg/TelegramIcon";
import { TrashIcon } from "@src/components/svg/TrashIcon";
import LogoutIcon from "@src/components/svg/LogoutIcon";
import BackupIcon from "@src/components/svg/BackupIcon";
import { LANDING_URL } from "@src/common.constants";
import { useResetWalletModal } from "./useResetWalletModal";
import { useLogout } from "./useLogout";
import { useBackupPrivateKey } from "./useBackupPrivateKey";
import { ConfirmModal } from "@src/components/Modals/ConfirmModal";
import { useSettings } from "@src/hooks/useSettings";
import { menuButtonStyle } from "@src/components/Button";

interface MoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFauceting: boolean;
  isLoading: boolean;
}

export default function MoreModal({
  isOpen,
  onClose,
  isFauceting,
  isLoading,
}: MoreModalProps) {
  const {
    isResetWalletModalOpen,
    onResetWalletModalOpen,
    onResetWalletModalClose,
    handleResetWallet,
  } = useResetWalletModal();

  const { handleLogout } = useLogout();
  const { handleBackupPrivateKey, isEmbeddedWallet } = useBackupPrivateKey();
  const { settings, updateSettings } = useSettings();

  const handlePreviewToggle = () => {
    updateSettings({
      showTransactionPreview: !settings.showTransactionPreview,
    });
  };

  const buttonStyle = `${menuButtonStyle} w-full h-14 text-xl`;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full h-dvh",
        "transition-all duration-500 ease-in-out",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center">
        <div
          className={clsx(
            "flex flex-col w-full h-full px-6 md:w-full",
            "md:max-w-lg md:rounded-xl bg-gray-900",
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",
            isOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          <div className="flex-1 content-center py-5">
            <BackButton onClick={onClose} />
            <div className="flex flex-col h-full pt-20">
              <div className="flex-1 flex flex-col justify-start">
                <div className="flex flex-col w-full space-y-2">
                  <a
                    href={`${LANDING_URL}/#faq`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyle}
                  >
                    F.A.Q
                    <QuestionIcon className="w-6 h-6" />
                  </a>

                  <a
                    href="https://t.me/+fCgwViQAehY0NTEy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonStyle}
                  >
                    Join telegram group chat
                    <TelegramIcon className="w-6 h-6" />
                  </a>

                  <label className={buttonStyle}>
                    <div className="flex flex-col">
                      <span>Show details before signing</span>
                    </div>
                    <div className="relative inline-flex items-center">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={settings.showTransactionPreview}
                        onChange={handlePreviewToggle}
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-700/70"></div>
                    </div>
                  </label>

                  {isEmbeddedWallet && (
                    <button
                      className={buttonStyle}
                      onClick={handleBackupPrivateKey}
                      disabled={isFauceting || isLoading}
                    >
                      Backup Keys
                      <BackupIcon className="w-6 h-6" />
                    </button>
                  )}

                  <button
                    className={buttonStyle}
                    onClick={onResetWalletModalOpen}
                    disabled={isFauceting || isLoading}
                  >
                    Reset Wallet
                    <TrashIcon className="w-6 h-6" />
                  </button>

                  {isEmbeddedWallet && (
                    <button
                      className={buttonStyle}
                      onClick={handleLogout}
                      disabled={isFauceting || isLoading}
                    >
                      Logout
                      <LogoutIcon className="w-6 h-6" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isResetWalletModalOpen}
        onConfirm={handleResetWallet}
        onCancel={onResetWalletModalClose}
        title="Confirm Wallet Reset"
        description="This will permanently delete all your wallet data. This action cannot be undone."
        buttonText="Reset Wallet"
      />
    </div>
  );
}
