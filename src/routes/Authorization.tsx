import { lazy, Suspense } from "react";
import { Loader } from "@src/components/Loader";

// Lazy load the ViewAccountAuthorization component
const ViewAccountAuthorization = lazy(
  () =>
    import("@src/components/ViewAccountAuthorization/ViewAccountAuthorization"),
);

export default function Authorization() {
  return (
    <div className="dark:text-white px-6 flex flex-col h-dvh justify-center overflow-hidden">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <Loader />
          </div>
        }
      >
        <ViewAccountAuthorization />
      </Suspense>
    </div>
  );
}
