import { Notification } from "@src/components/Notification";
import Panel from "@src/components/Panel";

export default function PanelRoute() {
  return (
    <div className="dark:text-white h-dvh flex justify-center items-center overflow-hidden">
      <Panel />
      <Notification />
    </div>
  );
}
