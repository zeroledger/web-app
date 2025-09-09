import { useCallback, useState } from "react";
import { DefaultValues, FieldValues, useForm } from "react-hook-form";
import { delay } from "@src/utils/common";

const defaultBaseMultiStepModalState = {
  isModalOpen: false,
  isModalLoading: false,
  isModalError: false,
  isModalSuccess: false,
};

export type MultiStepModalState = typeof defaultBaseMultiStepModalState;

export const useMultiStepModal = <
  TConfig extends {
    defaultValues: FieldValues;
    defaultState: { step: string } & MultiStepModalState;
  },
>(
  config: TConfig,
) => {
  const [promise, setPromise] = useState<Promise<void>>(Promise.resolve());

  const form = useForm<TConfig["defaultValues"]>({
    defaultValues: config.defaultValues as DefaultValues<
      TConfig["defaultValues"]
    >,
  });

  const [state, setState] = useState<TConfig["defaultState"]>({
    ...config.defaultState,
    ...defaultBaseMultiStepModalState,
  });

  const resetState = useCallback(() => {
    setState({
      ...config.defaultState,
      ...defaultBaseMultiStepModalState,
    });
  }, [config.defaultState]);

  const onModalOpen = useCallback(
    () =>
      setPromise(
        promise.then(() => {
          resetState();
          setState((prev) => ({
            ...prev,
            isModalOpen: true,
          }));
        }),
      ),
    [promise, resetState],
  );

  const handleBack = useCallback(
    () =>
      setPromise(
        promise.then(async () => {
          setState((prev) => ({
            ...prev,
            isModalOpen: false,
          }));
          await delay(500);
          resetState();
          form.reset();
        }),
      ),
    [form, promise, resetState],
  );
  return {
    form,
    onModalOpen,
    handleBack,
    state,
    setState,
    promise,
    setPromise,
  };
};
