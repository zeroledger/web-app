import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { shortString } from "@src/utils/common";
import { WalletContext } from "@src/context/wallet.context";
import { useContext } from "react";
import { HistoryRecordDto } from "@src/services/ledger";

const formatAmount = (
  amount: bigint,
  type: HistoryRecordDto["status"],
  decimals: number,
) => {
  const prefix = type === "added" ? "+" : "-";
  const amountNumber = formatUnits(amount, decimals);
  return `${prefix} $${amountNumber}`;
};

function TransactionSkeleton() {
  return (
    <li className="bg-white/5 rounded-lg p-4 text-white shadow animate-pulse">
      <div className="h-5 w-1/3 bg-white/20 rounded mb-2" />
      <div className="h-4 w-2/3 bg-white/10 rounded mb-2" />
      <div className="h-3 w-1/2 bg-white/10 rounded" />
    </li>
  );
}

// const disabledLinkStyle = "text-white/70 cursor-default";
const linkStyle = "underline text-blue-300 hover:text-blue-400";
// const idsContainerStyle = "flex flex-wrap text-xs gap-1 text-white/70";

export default function ActivityTab({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<HistoryRecordDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { decimals, walletService } = useContext(WalletContext);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!walletService) return;

      setLoading(true);
      setError(null);
      try {
        const txs = await walletService.getTransactions();
        if (txs) {
          setTransactions(txs);
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    if (active) {
      loadTransactions();
    }
  }, [walletService, active]);

  return (
    <div className="h-full pt-4">
      <div className="h-full overflow-y-auto px-4">
        <ul className="flex flex-col gap-4 h-full">
          {loading ? (
            Array.from({ length: 10 }).map((_, idx) => (
              <TransactionSkeleton key={idx} />
            ))
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-400">
              {error}
            </div>
          ) : transactions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/70">
              No transactions yet
            </div>
          ) : (
            transactions.map((tx, idx) => (
              <li
                key={idx}
                className="bg-white/5 rounded-lg p-4 text-white/90 shadow"
              >
                <div className="space-y-1 flex flex-col">
                  <div className="font-semibold">{tx.status.toUpperCase()}</div>
                  {tx.transactionHash ? (
                    <div className="text-sm">
                      {`Transaction: `}
                      <a
                        href={`https://sepolia-optimism.etherscan.io/tx/${tx.transactionHash}`}
                        className={linkStyle}
                        target="_blank"
                      >
                        {shortString(tx.transactionHash)}
                      </a>
                    </div>
                  ) : (
                    "Error loading transaction hash"
                  )}

                  <div>
                    {formatAmount(BigInt(tx.record.value), tx.status, decimals)}
                  </div>
                  <div className="text-xs text-white/60">
                    {`Poseidon commitment: uint254(${shortString(tx.record.hash)}n)`}
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
