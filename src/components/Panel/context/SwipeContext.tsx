import { createContext, useState, ReactNode, useMemo } from "react";

interface SwipeContextType {
  isSwipeEnabled: boolean;
  disableSwipe: () => void;
  enableSwipe: () => void;
}

export const SwipeContext = createContext<SwipeContextType | undefined>(
  undefined,
);

export function SwipeProvider({ children }: { children: ReactNode }) {
  const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);

  const value = useMemo(
    () => ({
      isSwipeEnabled,
      disableSwipe: () => {
        console.log("[SwipeContext] Disabling swipe");
        setIsSwipeEnabled(false);
      },
      enableSwipe: () => {
        console.log("[SwipeContext] Enabling swipe");
        setIsSwipeEnabled(true);
      },
    }),
    [isSwipeEnabled],
  );

  console.log("[SwipeContext] Current swipe state:", isSwipeEnabled);

  return (
    <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>
  );
}
