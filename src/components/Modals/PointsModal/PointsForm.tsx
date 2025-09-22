import { Field, Label, Input } from "@headlessui/react";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { PointsModalState } from "@src/components/Panel/hooks/usePointsModal";
import { linkButtonStyle } from "@src/components/styles/Button.styles";
import { primaryInputStyle } from "@src/components/styles/Input.styles";
import clsx from "clsx";
import { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { HiOutlineExternalLink } from "react-icons/hi";

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
        <div className="text-lg text-white mb-2">Join Points Program</div>
      </div>

      <div className="space-y-4">
        <Field>
          <Label className="text-base/6 font-medium text-white">
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
            placeholder="XXXXXX"
            onChange={onCodeChange}
            onKeyDown={onEnter}
            className={primaryInputStyle}
          />
          <div
            className={clsx(
              "text-base/6 text-red-400 transition-all duration-200 ease-in-out",
              {
                "opacity-0 h-0": !error,
                "opacity-100 h-6": error,
              },
            )}
          >
            {error && <p>{error}</p>}
          </div>
        </Field>
        <MobileConfirmButton
          disabled={isSubmitting || unlocking}
          label="Join"
        />

        {/* Information Section */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-600/30">
          <div className="flex items-start space-x-3">
            <a
              href="https://docs.zeroledger.wtf/overview/betta-testing-points"
              target="_blank"
              rel="noopener noreferrer"
              className={linkButtonStyle}
            >
              <HiOutlineExternalLink className="w-4 h-4" />
              Learn more about Zeroledger Betta Testing Points Program
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
