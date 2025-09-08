import { useSettings } from "@src/hooks/useSettings";

/**
 * Hook to check if the user has disabled transaction preview
 * @returns true if preview should be skipped, false otherwise
 */
export const useShouldSkipPreview = (): boolean => {
  const { settings } = useSettings();
  return !settings.showTransactionPreview;
};
