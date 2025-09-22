import { Field, Label, Input } from "@headlessui/react";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { PointsModalState } from "@src/components/Panel/hooks/usePointsModal";
import { primaryInputStyle } from "@src/components/styles/Input.styles";
import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";

interface InviteCodeForm {
  inviteCode: string;
}

interface PointsFormProps {
  formMethods: UseFormReturn<InviteCodeForm>;
  setState: React.Dispatch<React.SetStateAction<PointsModalState>>;
  onEnter: (e: React.KeyboardEvent<HTMLElement>) => void;
  unlocking: boolean;
  unlockError?: string;
}

export const PointsForm = ({
  formMethods,
  onEnter,
  setState,
  unlocking,
  unlockError,
}: PointsFormProps) => {
  const {
    register,
    setValue,
    formState: { errors, isSubmitting },
  } = formMethods;

  const onCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue("inviteCode", e.target.value);
      setState((prev) => ({
        ...prev,
        errorMessage: undefined,
      }));
    },
    [setValue, setState],
  );

  const error = errors.inviteCode?.message || unlockError;

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <div className="text-lg text-white mb-2">Unlock Your Points</div>
        <div className="text-gray-300 mb-6">
          Enter your invite code to unlock your points
        </div>
      </div>

      <div className="space-y-4">
        <Field>
          <Label className="text-sm font-medium text-white sr-only">
            Invite Code
          </Label>
          <Input
            {...register("inviteCode", {
              required: "Invite code is required",
              minLength: {
                value: 1,
                message: "Invite code cannot be empty",
              },
            })}
            type="text"
            placeholder="Enter invite code"
            onChange={onCodeChange}
            onKeyDown={onEnter}
            className={primaryInputStyle}
          />
          <div className="h-6 mt-1 text-base text-red-400">
            {error && <p>{error}</p>}
          </div>
        </Field>
        <MobileConfirmButton
          disabled={isSubmitting || unlocking}
          label="Join Points Program"
        />
      </div>
    </div>
  );
};
