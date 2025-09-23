import React from "react";
import { Loader } from "@src/components/Loader";
import { BackButton } from "@src/components/Buttons/BackButton";
import { ErrorMessage } from "@src/components/Modals/ErrorMessage";
import { useDynamicHeight } from "@src/hooks/useDynamicHeight";
import { PointsForm } from "./PointsForm";
import { PointsDisplay } from "./PointsDisplay";
import BaseModal from "@src/components/Modals/BaseModal/BaseModal";
import {
  PointsModalState,
  InviteCodeForm,
} from "@src/components/Panel/hooks/usePointsModal";
import { type UseFormReturn } from "react-hook-form";

interface PointsModalProps {
  state: PointsModalState;
  setState: React.Dispatch<React.SetStateAction<PointsModalState>>;
  formMethods: UseFormReturn<InviteCodeForm>;
  onFormSubmit: (data: InviteCodeForm) => void;
  handleBack: () => void;
}

export default function PointsModal({
  state,
  setState,
  formMethods,
  onFormSubmit,
  handleBack,
}: PointsModalProps) {
  const style = useDynamicHeight("h-dvh");
  const { handleSubmit } = formMethods;

  const {
    isModalOpen,
    isModalLoading,
    isUnlocking,
    errorMessage,
    points,
    step,
    isModalError,
  } = state;

  const shouldShowPoints =
    step === "points" && !isModalError && !isModalLoading;

  const shouldShowUnlockForm =
    step === "form" && !isModalLoading && !isModalError;

  return (
    <BaseModal
      isOpen={isModalOpen}
      onClose={handleBack}
      closeOnOverlayClick={false}
      contentClassName="relative justify-center overflow-y-auto"
      style={style}
    >
      <div className="px-6 py-5 h-full flex-col content-center">
        {isModalError && errorMessage && (
          <div className="flex-1 content-center flex-col justify-center animate-fade-in">
            <ErrorMessage message={errorMessage} />
          </div>
        )}

        {isModalLoading && (
          <div className="flex-1 content-center flex justify-center animate-fade-in">
            <Loader />
          </div>
        )}

        {!isModalLoading && !isModalError && (
          <BackButton onClick={handleBack} disabled={isUnlocking} />
        )}

        {shouldShowPoints && (
          <div className="flex pt-20">
            <PointsDisplay data={points!} />
          </div>
        )}

        {shouldShowUnlockForm && (
          <form onSubmit={handleSubmit(onFormSubmit)} className="flex pt-20">
            <PointsForm
              formMethods={formMethods}
              setState={setState}
              unlocking={!!isUnlocking}
              unlockError={errorMessage}
            />
          </form>
        )}
      </div>
    </BaseModal>
  );
}
