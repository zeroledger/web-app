import clsx from "clsx";
import { shortString } from "@src/utils/common";

export const Name = ({
  name,
  address,
  className,
}: {
  name?: string;
  address: string;
  className?: string;
}) => {
  return (
    <div
      className={clsx(
        "flex flex-col leading-none text-white/50 gap-1",
        className,
      )}
    >
      {name && (
        <>
          <span className="font-semibold">{name}</span>
          <span className="text-sm">{shortString(address)}</span>
        </>
      )}
      {!name && <span className="">{shortString(address)}</span>}
    </div>
  );
};
