import { Button } from "@headlessui/react";

interface MobileConfirmButtonProps {
  disabled: boolean;
  label?: string;
  onClick?: () => void;
  type?: "submit" | "button";
}

export const MobileConfirmButton = ({
  disabled,
  label = "Confirm Payment",
  onClick,
  type = "submit",
}: MobileConfirmButtonProps) => (
  <Button
    type={type}
    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gray-700 py-4 px-3.5 text-base font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[hover]:cursor-pointer data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white transition duration-150 ease-in-out"
    disabled={disabled}
    onClick={onClick}
  >
    {label}
  </Button>
);
