import { useConnectWallet } from "@privy-io/react-auth";
import { Button, primaryButtonStyle } from "@src/components/Button";

export default function Connect() {
  const { connectWallet } = useConnectWallet();

  return (
    <div className="mt-5 mx-auto">
      <Button className={primaryButtonStyle} onClick={connectWallet}>
        Connect
      </Button>
    </div>
  );
}
