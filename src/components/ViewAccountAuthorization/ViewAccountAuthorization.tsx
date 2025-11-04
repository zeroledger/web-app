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
        title="Authorize Authentication Account and Encryption Key"
        description="By signing this message, you authorize your authentication account to handle authentication and confirm your public encryption key."
        messageData={messageData}
        onSign={handleSign}
        buttonText="Authorize"
        successText="Success!"
        extraContent={
          <div className="text-center mb-2">
            <p className="text-gray-500 text-xs">
              Authentication account is never in custody of your funds.
            </p>
          </div>
        }
      />
    </div>
  );
}
