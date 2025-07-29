import { useContext, useMemo, useState } from "react";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { useNavigate } from "react-router-dom";
import { useWallets } from "@privy-io/react-auth";
import { SigningPreview, SigningData } from "@src/components/SigningPreview";
import { shortString } from "@src/utils/common";

export default function ViewAccountAuthorization() {
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
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
        value: shortString(wallets[0]?.address) || "",
      },
      {
        label: "View Address",
        value:
          shortString(viewAccount?.getViewAccount()?.address) || "loading...",
      },
    ],
    [viewAccount, wallets],
  );

  const handleSign = async () => {
    try {
      setIsSigning(true);
      await authorize();
      setIsSuccess(true);
      setIsError(false);
      setIsSigning(false);
      navigate("/panel/wallet");
    } catch (error) {
      console.error(error);
      setIsError(true);
      setIsSigning(false);
    }
  };

  return (
    <SigningPreview
      isSigning={isSigning}
      isSuccess={isSuccess}
      isError={isError}
      title="View Account Authorization"
      description="Signing this message you authorize view account to be used for encryption and decryption of your transactions and trusted encryption service authentication."
      messageData={messageData}
      onSign={handleSign}
      buttonText="Authorize"
      successText="Success!"
      errorText="Error"
      warningText="View account is never in custody of your funds."
    />
  );
}
