import { Notification } from "@src/components/Notification";
import Panel from "@src/components/Panel";
import { WalletProvider } from "@src/context/wallet.context";
export default function PanelRoute() {
  return (
    <div className="dark:text-white h-dvh flex justify-center items-center overflow-hidden">
      <WalletProvider>
        <Panel />
      </WalletProvider>
      <Notification />
    </div>
  );
}
