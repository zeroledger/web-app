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
        extraContent={
          <div className="text-center mb-2">
            <p className="text-gray-500 text-xs">
              View account is never in custody of your funds.
            </p>
          </div>
        }
      />
    </div>
  );
}
