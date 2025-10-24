import { useEffect, useMemo, useState } from "react";

export function useDynamicHeight(defaultHeight: string = "100svh") {
  const [viewportHeight, setViewportHeight] = useState(defaultHeight);

  useEffect(() => {
    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(`${window.visualViewport.height}px`);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      }
    };
  }, []);

  const style = useMemo(
    () => ({
      height: viewportHeight,
    }),
    [viewportHeight],
  );

  return style;
}
