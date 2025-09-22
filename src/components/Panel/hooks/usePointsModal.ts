import { useContext, useMemo, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { delay } from "@src/utils/common";
import {
  useMultiStepModal,
  type MultiStepModalState,
} from "@src/hooks/useMultiStepModal";
import { type Address } from "viem";
import { type Tes } from "@src/services/Tes";

export interface InviteCodeForm {
  inviteCode: string;
}

type PointsData = Awaited<ReturnType<Tes["getPointsData"]>>;

export interface PointsModalState extends MultiStepModalState {
  step: "form" | "points";
  errorMessage?: string;
  points?: PointsData;
  isUnlocking?: boolean;
}

export const usePointsModal = () => {
  const { ledger, wallet } = useContext(LedgerContext);

  const {
    form,
    onModalOpen,
    promise,
    setPromise,
    handleBack,
    state,
    setState,
  } = useMultiStepModal({
    defaultState: {
      step: "form",
    } as PointsModalState,
    defaultValues: {
      inviteCode: "",
    },
  });

  const onModalOpenWithLoadPoints = useCallback(() => {
    onModalOpen();
    setPromise(async () => {
      try {
        if (!ledger || !wallet) {
          throw new Error("Ledger or wallet not available");
        }

        setState((prev) => ({
          ...prev,
          isModalLoading: true,
        }));

        const points = await ledger.tesService.getPointsData(
          wallet.address as Address,
        );
        setState((prev) => ({
          ...prev,
          points,
          step: "points" as const,
        }));
      } catch (error) {
        type ErrorWithResponse = { response: { status: number } };
        if ((error as ErrorWithResponse)?.response.status !== 404) {
          setState((prev) => ({
            ...prev,
            errorMessage: "Unexpected error. Please try again.",
            isModalError: true,
          }));
          await delay(3000);
          handleBack();
        }
      } finally {
        setState((prev) => ({
          ...prev,
          isModalLoading: false,
        }));
      }
    });
  }, [onModalOpen, setPromise, setState, handleBack, ledger, wallet]);

  const handleFormSubmit = useCallback(
    (data: InviteCodeForm) =>
      setPromise(async () => {
        await promise;
        try {
          if (!ledger || !wallet) {
            throw new Error("Ledger or wallet not available");
          }

          setState((prev) => ({
            ...prev,
            isUnlocking: true,
          }));

          const { unlocked, reason } = await ledger.tesService.unlockPoints(
            data.inviteCode.trim(),
            wallet.address as Address,
          );

          if (unlocked) {
            const points = await ledger.tesService.getPointsData(
              wallet.address as Address,
            );
            setState((prev) => ({
              ...prev,
              points,
              step: "points" as const,
            }));
          }

          if (reason) {
            setState((prev) => ({
              ...prev,
              errorMessage: reason,
            }));
          }
        } catch {
          setState((prev) => ({
            ...prev,
            isModalError: true,
            errorMessage:
              "Unexpected error unlocking points. Please try again.",
          }));
          await delay(3000);
          handleBack();
        } finally {
          setState((prev) => ({
            ...prev,
            isUnlocking: false,
          }));
        }
      }),
    [ledger, wallet, promise, setPromise, setState, handleBack],
  );

  return useMemo(
    () => ({
      form,
      onModalOpen: onModalOpenWithLoadPoints,
      handleFormSubmit,
      handleBack,
      state,
      setState,
    }),
    [
      form,
      onModalOpenWithLoadPoints,
      handleFormSubmit,
      handleBack,
      state,
      setState,
    ],
  );
};
