import { BackButton } from "@src/components/Buttons/BackButton";
import {
  QuestionIcon,
  TelegramIcon,
  TrashIcon,
  LogoutIcon,
  BackupIcon,
} from "@src/components/svg";
import { DOCS_URL } from "@src/common.constants";
import { useResetWalletModal } from "./useResetWalletModal";
import { useLogout } from "./useLogout";
import { useBackupPrivateKey } from "./useBackupPrivateKey";
import { ConfirmModal } from "@src/components/Modals/ConfirmModal";
import { useSettings } from "@src/hooks/useSettings";
import { menuButtonStyle } from "@src/components/styles/Button.styles";
import { BaseModal } from "../BaseModal";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import debounce from "debounce";

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

  const { handleBackupPrivateKey, isEmbeddedWallet } = useBackupPrivateKey();
  const { handleLogout } = useLogout();
  const { settings, updateSettings } = useSettings();

  const handlePreviewToggle = debounce(() => {
    updateSettings({
      showTransactionPreview: !settings.showTransactionPreview,
    });
  }, 50);

  const handleHideDecoyToggle = debounce(() => {
    updateSettings({
      hideDecoyTransactions: !settings.hideDecoyTransactions,
    });
  }, 50);

  const buttonStyle = `${menuButtonStyle} w-full h-14 text-xl`;

  const style = useDynamicHeight("h-dvh");

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      style={style}
    >
      <div className="px-6 py-5 h-full grid grid-cols-1">
        <BackButton onClick={onClose} className="place-self-start" />
        <div className="flex flex-col h-full">
          <div className="flex-1 flex flex-col justify-start">
            <div className="flex flex-col w-full space-y-2">
              <a
                href={`${DOCS_URL}/faq`}
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

              <label className={buttonStyle}>
                <div className="flex flex-col">
                  <span>Hide decoy transactions</span>
                </div>
                <div className="relative inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.hideDecoyTransactions}
                    onChange={handleHideDecoyToggle}
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

              <button
                className={buttonStyle}
                onClick={handleLogout}
                disabled={isFauceting || isLoading}
              >
                Logout
                <LogoutIcon className="w-6 h-6" />
              </button>
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
    </BaseModal>
  );
}
