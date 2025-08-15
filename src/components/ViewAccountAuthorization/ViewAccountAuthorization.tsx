import { SigningPreview } from "@src/components/SigningPreview";
import { useViewAccountAuthorization } from "./useViewAccountAuthorization";

export default function ViewAccountAuthorization() {
  const { isSigning, isSuccess, error, messageData, handleSign } =
    useViewAccountAuthorization();

  return (
    <div className="mx-auto w-full md:max-w-md px-3">
      <SigningPreview
        isSigning={isSigning}
        isSuccess={isSuccess}
        error={error}
        title="View Account Authorization"
        description="Signing this message you authorize view account to be used for encryption and decryption of your transactions and trusted encryption service authentication."
        messageData={messageData}
        onSign={handleSign}
        buttonText="Authorize"
        successText="Success!"
        warningText="View account is never in custody of your funds."
      />
    </div>
  );
}
