import { Loader } from "@src/components/Loader";

interface FaucetStatusProps {
  isFauceting: boolean;
  amount?: string;
  isFaucetSuccess: boolean;
  errorMessage: string | undefined;
  symbol: string;
}

export default function FaucetStatus({
  isFauceting,
  amount,
  isFaucetSuccess,
  errorMessage,
  symbol,
}: FaucetStatusProps) {
  return (
    <div className="flex-1 flex items-center justify-center text-white md:text-lg text-xl">
      {isFauceting && (
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader />
          <div className="mt-2">{`Sending ${amount} ${symbol} tokens onchain...`}</div>
        </div>
      )}
      {!isFauceting && isFaucetSuccess && (
        <div className="flex flex-col items-center gap-3 animate-fade-in text-center">
          <div>Success!</div>
          <div>
            You can now deposit your {symbol} tokens into your Private Balance.
          </div>
        </div>
      )}
      {!isFauceting && errorMessage && (
        <div className="flex flex-col items-center gap-3 animate-fade-in text-center">
          <div>Failed!</div>
          <div>{errorMessage}</div>
        </div>
      )}
    </div>
  );
}
