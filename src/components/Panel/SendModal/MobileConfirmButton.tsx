import { Button } from "@headlessui/react";

interface MobileConfirmButtonProps {
  disabled: boolean;
  label?: string;
}

export const MobileConfirmButton = ({
  disabled,
  label = "Confirm Payment",
}: MobileConfirmButtonProps) => (
  <Button
    type="submit"
    className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gray-700 py-4 px-3.5 text-base font-semibold text-white shadow-inner shadow-white/10 focus:outline-none data-[hover]:bg-gray-600 data-[hover]:cursor-pointer data-[open]:bg-gray-700 data-[focus]:outline-1 data-[focus]:outline-white transition duration-150 ease-in-out"
    disabled={disabled}
  >
    {label}
  </Button>
);
