import { BackButton } from "@src/components/Buttons/BackButton";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { BaseModal } from "@src/components/Modals/BaseModal";

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  buttonText: string;
}

export default function ConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  description,
  buttonText,
}: ConfirmModalProps) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      closeOnEscape={true}
      closeOnOverlayClick={false}
      onEnterKey={onConfirm}
      contentClassName="px-6"
    >
      <div className="flex-1 content-center py-5">
        <BackButton onClick={onCancel} />
        <div className="flex pt-20">
          <div className="flex flex-col items-center justify-center">
            <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
            <p className="text-white/80 mb-8 text-center">{description}</p>
            <div className="py-4 w-full">
              <MobileConfirmButton
                type="button"
                disabled={false}
                label={buttonText}
                onClick={onConfirm}
              />
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
