import clsx from "clsx";
import { Button } from "@src/components/Button";
import { primaryButtonStyle } from "@src/components/Button";
import { shortString } from "@src/utils/common";
import { useContext, useEffect, useMemo, useState } from "react";
import { ViewAccountContext } from "@src/context/viewAccount/viewAccount.context";
import { useNavigate } from "react-router-dom";
import { useWallets } from "@privy-io/react-auth";

export default function ViewAccountAuthorization() {
  const [isSigning, setIsSigning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);

  const navigate = useNavigate();
  const { viewAccount, authorized, authorize } = useContext(ViewAccountContext);
  const { wallets } = useWallets();

  const message = useMemo(
    () => ({
      domain: {
        name: "View Account Authorization",
        version: "0.0.1",
      },
      protocol: "zeroledger",
      mainAddress: wallets[0].address,
      viewAddress: viewAccount?.getViewAccount()?.address ?? "loading...",
    }),
    [viewAccount, wallets],
  );

  useEffect(() => {
    if (authorized) {
      navigate("/panel/wallet");
    }
  }, [authorized, navigate]);

  const handleAuthorize = () => {
    setTimeout(async () => {
      try {
        setIsSigning(true);
        await authorize();
        setIsSuccess(true);
      } catch (error) {
        console.error(error);
        setIsError(true);
      } finally {
        setIsSigning(false);
      }
    }, 1000);
  };

  return (
    <div className="mx-auto mt-5 w-96 px-5 md:px-0 transition-all duration-500 ease-in-out">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">
          View Account Authorization
        </h1>
        <p className="text-gray-400 text-sm">
          Signing this message you authorize view account to be used for
          encryption and decryption of your transactions and trusted encryption
          service authentication.
        </p>
      </div>

      {/* Wallet Signing Animation */}
      <div className="relative mb-6">
        <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <span className="text-white font-medium">Wallet</span>
            </div>
            <div className="text-gray-400 text-sm transition-all duration-300 ease-in-out">
              {isSigning ? "Signing..." : "Ready"}
            </div>
          </div>

          {/* Signing Animation */}
          <div className="space-y-2 overflow-hidden transition-all duration-500 ease-in-out">
            <div
              className={`flex items-center space-x-2 transition-all duration-500 ease-in-out ${
                !isSigning && !isSuccess && !isError
                  ? "opacity-100 max-h-8 mt-3"
                  : "opacity-0 max-h-0"
              }`}
            >
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">
                Preparing message...
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message Data */}
      <div className="bg-gray-700 rounded-lg p-4 border border-gray-600 mb-6">
        <h3 className="text-white font-semibold mb-3">Message Data</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Protocol:</span>
            <span className="text-white font-mono">{message.protocol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Main Address:</span>
            <span className="text-white font-mono">
              {shortString(message.mainAddress)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">View Address:</span>
            <span className="text-white font-mono">
              {shortString(message.viewAddress)}
            </span>
          </div>
        </div>
      </div>
      {/* Status Messages */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isSuccess || isError ? "max-h-32 mb-6" : "max-h-0 mb-0"
        }`}
      >
        {isSuccess && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4 text-center animate-fade-in">
            <div className="text-green-400 font-semibold mb-1">Success!</div>
            <div className="text-green-300 text-sm">
              View account has been authorized
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-center animate-fade-in">
            <div className="text-red-400 font-semibold mb-1">Error</div>
            <div className="text-red-300 text-sm">
              Failed to authorize view account
            </div>
          </div>
        )}
      </div>
      {/* Authorize Button */}
      <div className="flex justify-center mb-6">
        <Button
          className={clsx(
            primaryButtonStyle,
            "w-full transition-all duration-300 ease-in-out",
            (isSigning || isSuccess) && "opacity-50 cursor-not-allowed",
          )}
          disabled={isSigning || isSuccess}
          onClick={handleAuthorize}
        >
          {isSigning ? (
            <div className="flex items-center space-x-2 animate-fade-in">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Signing...</span>
            </div>
          ) : isSuccess ? (
            <span className="animate-fade-in">Authorized</span>
          ) : (
            <span className="animate-fade-in">Authorize</span>
          )}
        </Button>
      </div>

      {/* Warning */}
      <div className="text-center">
        <p className="text-gray-500 text-xs">
          View account is never in custody of your funds.
        </p>
      </div>
    </div>
  );
}
