import { useContext, useMemo } from "react";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { useNavigate } from "react-router-dom";
import { useWallets } from "@privy-io/react-auth";
import { SigningPreview, SigningData } from "@src/components/SigningPreview";

export default function ViewAccountAuthorization() {
  const navigate = useNavigate();
  const { viewAccount, authorize } = useContext(ViewAccountContext);
  const { wallets } = useWallets();

  const messageData = useMemo(
    (): SigningData[] => [
      {
        label: "Protocol",
        value: "zeroledger",
      },
      {
        label: "Main Address",
        value: wallets[0]?.address || "",
      },
      {
        label: "View Address",
        value: viewAccount?.getViewAccount()?.address || "loading...",
      },
    ],
    [viewAccount, wallets],
  );

  const handleSuccess = () => {
    navigate("/panel/wallet");
  };

  return (
    <SigningPreview
      title="View Account Authorization"
      description="Signing this message you authorize view account to be used for encryption and decryption of your transactions and trusted encryption service authentication."
      messageData={messageData}
      onSign={authorize}
      onSuccess={handleSuccess}
      buttonText="Authorize"
      successText="Success!"
      errorText="Error"
      warningText="View account is never in custody of your funds."
    />
  );
}
