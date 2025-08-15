import { SigningPreview } from "@src/components/SigningPreview";
import { usePubKeyRegistration } from "./usePubKeyRegistration";
import { Suspense } from "react";
import { LoadingScreen } from "@src/components/LoadingScreen";

export default function ViewAccountAuthorization() {
  const { isSigning, isSuccess, error, messageData, handleSign } =
    usePubKeyRegistration();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <div className="mx-auto w-full md:max-w-md px-3">
        <SigningPreview
          isSigning={isSigning}
          isSuccess={isSuccess}
          error={error}
          title="View Account Public Key Registration"
          description="Signing this message you authorize view account to be used for encryption and decryption of your transactions and trusted encryption service authentication."
          messageData={messageData}
          onSign={handleSign}
          buttonText="Register"
          successText="Success!"
        />
      </div>
    </Suspense>
  );
}
