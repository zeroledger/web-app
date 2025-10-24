import clsx from "clsx";

export const Flicker = ({ hidden }: { hidden: boolean }) => (
  <span
    className={clsx("absolute top-0 right-0 -mt-1 -mr-1 flex size-3", {
      hidden,
    })}
  >
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
    <span className="relative inline-flex size-3 rounded-full bg-sky-500"></span>
  </span>
);
