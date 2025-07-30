import { lazy, Suspense } from "react";
import { Loader } from "@src/components/Loader";

// Lazy load the Panel component
const Panel = lazy(() => import("@src/components/Panel"));

export default function PanelRoute() {
  return (
    <div className="dark:text-white h-dvh flex justify-center items-center overflow-hidden">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader />
          </div>
        }
      >
        <Panel />
      </Suspense>
    </div>
  );
}
