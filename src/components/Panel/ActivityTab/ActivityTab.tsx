import { useCallback, useEffect, useState } from "react";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useContext } from "react";
import { type HistoryRecordDto } from "@src/services/ledger";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";
import TransactionSkeleton from "./TransactionSkeleton";
import TransactionGroup from "./TransactionGroup";

type GroupedTransactions = Record<
  string,
  {
    incomings: HistoryRecordDto[];
    outgoings: HistoryRecordDto[];
  }
>;

export default function ActivityTab({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [groupedTransactions, setGroupedTransactions] =
    useState<GroupedTransactions>({});
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const { ledger } = useContext(LedgerContext);
  const { decimals, isLoading } = useContext(PanelContext);

  // Load initial transactions
  const loadInitialTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const result = await ledger!.getPaginatedTransactions(10);
      if (result) {
        console.log("Initial load result:", {
          nextCursor: result.nextCursor,
          transactionCount: Object.keys(result.transactions).length,
        });

        setGroupedTransactions(result.transactions);
        setNextCursor(result.nextCursor);
      }
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [ledger]);

  // Load more transactions
  const loadMoreTransactions = async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);

    try {
      const result = await ledger!.getPaginatedTransactions(10, nextCursor);
      if (result) {
        console.log("Load more result:", {
          nextCursor: result.nextCursor,
          transactionCount: Object.keys(result.transactions).length,
        });

        setGroupedTransactions((prev) => ({
          ...prev,
          ...result.transactions,
        }));
        setNextCursor(result.nextCursor);
      }
    } catch (error) {
      console.error("Failed to load more transactions:", error);
      setError("Failed to load more transactions");
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (active && !isLoading) {
      loadInitialTransactions();
    }
  }, [active, isLoading, ledger, loadInitialTransactions]);

  const transactionGroups = Object.entries(groupedTransactions);

  return (
    <div className="h-full pt-4">
      <div className="h-full overflow-y-auto px-4">
        <div className="flex flex-col gap-4 h-full">
          {/* Initial loading state */}
          {(isLoading || loading) && transactionGroups.length === 0 ? (
            <ul className="flex flex-col gap-4">
              {Array.from({ length: 10 }).map((_, idx) => (
                <TransactionSkeleton key={idx} />
              ))}
            </ul>
          ) : error && transactionGroups.length === 0 ? (
            <div className="h-full flex items-center justify-center text-red-400">
              {error}
            </div>
          ) : transactionGroups.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/70">
              No transactions yet
            </div>
          ) : (
            <>
              {/* Transaction list */}
              <ul className="flex flex-col gap-4">
                {transactionGroups.map(([txHash, transactions]) => (
                  <TransactionGroup
                    key={txHash}
                    txHash={txHash}
                    transactions={transactions}
                    decimals={decimals}
                  />
                ))}
              </ul>

              {/* Load More section */}
              {nextCursor && (
                <div className="mt-4 pb-4 flex justify-center">
                  <button
                    onClick={loadMoreTransactions}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </button>
                </div>
              )}

              {/* Load more error */}
              {error && transactionGroups.length > 0 && (
                <div className="mt-4 pb-4 flex justify-center">
                  <div className="text-red-400 text-sm">{error}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
