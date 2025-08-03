import { lazy, Suspense } from "react";

const Typewriter = lazy(() => import("typewriter-effect"));

const writerOptions = {
  delay: 85,
};

const MainBanner = () => {
  return (
    <>
      <h1 className="text-center text-3xl font-bol">
        <Suspense fallback={<span>ZeroLedger</span>}>
          <Typewriter
            onInit={(typewriter) => {
              typewriter.typeString("ZeroLedger").start();
            }}
            options={writerOptions}
          />
        </Suspense>
      </h1>
    </>
  );
};

export default MainBanner;
