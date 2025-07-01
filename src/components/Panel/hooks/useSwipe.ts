import { useContext } from "react";
import { SwipeContext } from "../context/SwipeContext";

export function useSwipe() {
  const context = useContext(SwipeContext);
  if (context === undefined) {
    throw new Error("useSwipe must be used within a SwipeProvider");
  }
  return context;
}
