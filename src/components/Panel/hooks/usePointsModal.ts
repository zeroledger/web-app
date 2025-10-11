import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useWalletAdapter } from "@src/context/ledger/useWalletAdapter";
import { delay } from "@src/utils/common";
import {
  useMultiStepModal,
  type MultiStepModalState,
} from "@src/hooks/useMultiStepModal";
import { type Address } from "viem";
import { type Tes } from "@src/services/Tes";
import debounce from "debounce";

export interface InviteCodeForm {
  inviteCode: string;
}

type PointsData = Awaited<ReturnType<Tes["getPointsData"]>>;

export interface PointsModalState extends MultiStepModalState {
  step: "form" | "points";
  points?: PointsData;
  isUnlocking?: boolean;
}

const defaultConfig = {
  defaultState: {
    step: "form",
  } as PointsModalState,
  defaultValues: {
    inviteCode: "",
  },
};

export const usePointsModal = () => {
  const { wallet } = useWalletAdapter();
  const { ledger } = useContext(LedgerContext);

  const {
    form,
    onModalOpen,
    promise,
    setPromise,
    handleBack,
    state,
    setState,
  } = useMultiStepModal(defaultConfig);

  const onModalOpenWithLoadPoints = debounce(() => {
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
  }, 50);

  const handleFormSubmit = debounce(
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
    50,
  );

  return {
    form,
    onModalOpen: onModalOpenWithLoadPoints,
    handleFormSubmit,
    handleBack,
    state,
    setState,
  };
};
