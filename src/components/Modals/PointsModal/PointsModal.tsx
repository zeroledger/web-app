import BaseModal from "@src/components/Modals/BaseModal/BaseModal";
import { BackButton } from "@src/components/Buttons/BackButton";

interface PointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PointsModal({ isOpen, onClose }: PointsModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="flex-1 content-center py-5 px-6">
        <BackButton onClick={onClose} />
        <div className="flex flex-col h-full pt-20">
          <div className="flex-1 flex flex-col justify-start">
            Points will be available soon!
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
