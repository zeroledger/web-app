import clsx from "clsx";
import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { EvmClientsContext } from "@src/context/evmClients/evmClients.context";
import { useContext, useState } from "react";
import { catchService } from "@src/services/core/catch.service";
import { Loader } from "@src/components/Loader";

export default function SwitchChainModal() {
  const { isSwitchChainModalOpen, targetChain, evmClientService } =
    useContext(EvmClientsContext);

  const [evmClientLoading, setEvmClientLoading] = useState(false);

  const handleSwitchChain = async () => {
    try {
      setEvmClientLoading(true);
      const readyEvmClientService = await evmClientService;
      setEvmClientLoading(false);
      await readyEvmClientService?.writeClient?.switchChain({
        id: targetChain.id,
      });
    } catch (error) {
      catchService.catch(error as Error);
    }
  };

  const handleAddChain = async () => {
    setEvmClientLoading(true);
    const readyEvmClientService = await evmClientService;
    setEvmClientLoading(false);
    await readyEvmClientService?.writeClient?.addChain({
      chain: targetChain,
    });
  };

  if (!targetChain) {
    return null;
  }

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 w-full h-dvh",
        "transition-all duration-500 ease-in-out",
        isSwitchChainModalOpen
          ? "opacity-100"
          : "opacity-0 pointer-events-none",
      )}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-gray-900 backdrop-blur-sm" />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center">
        <div
          className={clsx(
            "flex flex-col w-full h-full px-6 md:w-[50%]",
            "md:max-w-md md:rounded-xl bg-gray-900",
            "overflow-hidden",
            "transition-all duration-500 ease-in-out",
            isSwitchChainModalOpen
              ? "translate-x-0 md:scale-100"
              : "translate-x-full md:translate-x-0 md:scale-95",
          )}
        >
          {evmClientLoading && <Loader />}

          {!evmClientLoading && (
            <div className="flex-1 flex-col items-center justify-center w-full content-center py-5">
              <h3 className="text-xl text-white mb-4 text-center">
                Switch Network
              </h3>
              <p className="text-white/80 mb-8 text-center">
                Your wallet needs to be connected to{" "}
                <span className="underline">{targetChain.name}</span> to
                continue.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <MobileConfirmButton
                  type="button"
                  disabled={false}
                  label={`Switch Chain`}
                  onClick={handleSwitchChain}
                  className="text-sm"
                />

                <MobileConfirmButton
                  type="button"
                  disabled={false}
                  label={`Add Chain`}
                  onClick={handleAddChain}
                  className="text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
