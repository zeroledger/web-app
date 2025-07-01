import { useContext, useState, useCallback } from "react";
import { ClientContext } from "@src/context/client.context";
import { useSwipe } from "./useSwipe";

export const usePruneModal = () => {
  const { prune } = useContext(ClientContext);
  const [isPruneModalOpen, setIsPruneModalOpen] = useState(false);
  const { disableSwipe, enableSwipe } = useSwipe();

  const handlePrune = useCallback(async () => {
    try {
      await prune();
      setIsPruneModalOpen(false);
      enableSwipe();
      window.location.reload();
    } catch (error) {
      console.error("Failed to clear data:", error);
    }
  }, [prune, enableSwipe]);

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
