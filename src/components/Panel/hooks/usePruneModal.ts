import { useContext, useState, useCallback } from "react";
import { LedgerContext } from "@src/context/ledger.context";
import { useSwipe } from "./useSwipe";

export const usePruneModal = () => {
  const { ledgerServices } = useContext(LedgerContext);
  const [isPruneModalOpen, setIsPruneModalOpen] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const handlePrune = useCallback(async () => {
    try {
      await ledgerServices?.reset();
      setIsPruneModalOpen(false);
      enableSwipe();
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  }, [ledgerServices, enableSwipe]);

  const onPruneModalOpen = () => {
    setIsPruneModalOpen(true);
    disableSwipe();
  };

  const onPruneModalClose = () => {
    setIsPruneModalOpen(false);
    enableSwipe();
  };

  return {
    isPruneModalOpen,
    onPruneModalOpen,
    onPruneModalClose,
    handlePrune,
  };
};
