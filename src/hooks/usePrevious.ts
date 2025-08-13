import { useEffect, useRef } from "react";

export const usePrevious = <T>(value: T) => {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

export const useConditionalPrevious = <T>(value: T, condition: boolean) => {
  const ref = useRef<T>(value);
  useEffect(() => {
    if (condition) {
      ref.current = value;
    }
  }, [condition, value]);
  return ref.current;
};
