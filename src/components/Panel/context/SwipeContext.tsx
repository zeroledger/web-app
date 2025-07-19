import { createContext, useState, ReactNode, useMemo } from "react";

interface SwipeContextType {
  isSwipeEnabled: boolean;
  disableSwipe: () => void;
  enableSwipe: () => void;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

function SwipeProvider({ children }: { children: ReactNode }) {
  const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);

  const value = useMemo(
    () => ({
      isSwipeEnabled,
      disableSwipe: () => {
        setIsSwipeEnabled(false);
      },
      enableSwipe: () => {
        setIsSwipeEnabled(true);
      },
    }),
    [isSwipeEnabled],
  );

  return (
    <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>
  );
}

export { SwipeContext, SwipeProvider };
