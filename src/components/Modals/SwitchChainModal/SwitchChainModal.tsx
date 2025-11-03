import { MobileConfirmButton } from "@src/components/Buttons/MobileConfirmButton";
import { useContext } from "react";
import { catchService } from "@src/services/core/catch.service";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { BaseModal } from "@src/components/Modals/BaseModal";
import debounce from "debounce";

export default function SwitchChainModal() {
  const { isSwitchChainModalOpen, targetChain, evmClients } =
    useContext(LedgerContext);

  const handleSwitchChain = debounce(async () => {
    try {
      const externalClient = evmClients?.primaryClient();
      await externalClient?.switchChain({
        id: targetChain.id,
      });
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, 50);

  const handleAddChain = debounce(async () => {
    try {
      const externalClient = evmClients?.primaryClient();
      await externalClient?.addChain({
        chain: targetChain,
      });
    } catch (error) {
      catchService.catch(error as Error);
    }
  }, 50);

  if (!targetChain) {
    return null;
  }

  return (
    <BaseModal
      isOpen={isSwitchChainModalOpen}
      onClose={() => {}} // No close functionality for this modal
      closeOnOverlayClick={false}
      contentClassName="px-6"
    >
      <div className="flex-1 flex-col items-center justify-center w-full content-center py-5">
        <h3 className="text-xl text-white mb-4 text-center">Switch Network</h3>
        <p className="text-white/80 mb-8 text-center">
          Your wallet needs to be connected to{" "}
          <span className="underline">{targetChain.name}</span> to continue.
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
    </BaseModal>
  );
}
