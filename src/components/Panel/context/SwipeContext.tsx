import { createContext, ReactNode, useMemo } from "react";

interface SwipeContextType {
  isSwipeEnabled: boolean;
  disableSwipe: () => void;
  enableSwipe: () => void;
}

const SwipeContext = createContext<SwipeContextType | undefined>(undefined);

/**
 * SwipeProvider is a context provider that allows the user to disable or enable the swipe gesture.
 * Currently swipe logic disabled completely
 * @param param0
 * @returns
 */
function SwipeProvider({ children }: { children: ReactNode }) {
  // const [isSwipeEnabled, setIsSwipeEnabled] = useState(true);
  const isSwipeEnabled = false;

  const value = useMemo(
    () => ({
      isSwipeEnabled,
      disableSwipe: () => {
        // setIsSwipeEnabled(false);
      },
      enableSwipe: () => {
        // setIsSwipeEnabled(true);
      },
    }),
    [isSwipeEnabled],
  );

  return (
    <SwipeContext.Provider value={value}>{children}</SwipeContext.Provider>
  );
}

export { SwipeContext, SwipeProvider };
