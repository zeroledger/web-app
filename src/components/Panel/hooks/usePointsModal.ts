import { useContext } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { delay } from "@src/utils/common";
import {
  useMultiStepModal,
  type MultiStepModalState,
} from "@src/hooks/useMultiStepModal";
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
  const { ledger, evmClients } = useContext(LedgerContext);
  const primaryAddress = evmClients?.primaryClient()?.account.address;
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
        if (!ledger || !evmClients?.primaryClient()) {
          throw new Error("Ledger or wallet not available");
        }

        setState((prev) => ({
          ...prev,
          isModalLoading: true,
        }));

        const points = await ledger.tesService.getPointsData(primaryAddress!);
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
          setState((prev) => ({
            ...prev,
            isUnlocking: true,
          }));

          const { unlocked, reason } = await ledger!.tesService.unlockPoints(
            data.inviteCode.trim(),
            primaryAddress!,
          );

          if (unlocked) {
            const points = await ledger!.tesService.getPointsData(
              primaryAddress!,
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
