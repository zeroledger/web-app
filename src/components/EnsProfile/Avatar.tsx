import clsx from "clsx";

export const Avatar = ({
  avatar,
  className,
}: {
  avatar?: string;
  className?: string;
  isLoading?: boolean;
}) => {
  return avatar ? (
    <img src={avatar} alt="avatar" className={className} />
  ) : (
    <div
      className={clsx("bg-white/50", className)}
      aria-label="incognito avatar"
    />
  );
};
