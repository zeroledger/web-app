import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { shortString } from "@src/utils/common";
import { LedgerContext } from "@src/context/ledger/ledger.context";
import { useContext } from "react";
import { type HistoryRecordDto } from "@src/services/ledger";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import { PanelContext } from "@src/components/Panel/context/panel/panel.context";

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
      <div className="h-6 w-1/3 bg-white/20 rounded mb-3" />
      <div className="h-9 w-2/3 bg-white/10 rounded mb-3" />
      <div className="h-6 w-1/2 bg-white/10 rounded mb-3" />
      <div className="h-6 w-1/2 bg-white/10 rounded" />
    </li>
  );
}

// const disabledLinkStyle = "text-white/70 cursor-default";
const linkStyle = "underline text-blue-300 hover:text-blue-400";
// const idsContainerStyle = "flex flex-wrap text-xs gap-1 text-white/70";

type GroupedTransactions = Record<
  string,
  {
    incomings: HistoryRecordDto[];
    outgoings: HistoryRecordDto[];
  }
>;

function TransactionGroup({
  txHash,
  transactions,
  decimals,
}: {
  txHash: string;
  transactions: {
    incomings: HistoryRecordDto[];
    outgoings: HistoryRecordDto[];
  };
  decimals: number;
}) {
  const isUnknown = txHash === "unknown";
  const { incomings, outgoings } = transactions;

  // Calculate total: incomings (positive) + outgoings (negative)
  const totalIncomings = incomings.reduce(
    (sum, tx) => sum + BigInt(tx.record.value),
    0n,
  );
  const totalOutgoings = outgoings.reduce(
    (sum, tx) => sum + BigInt(tx.record.value),
    0n,
  );
  const total = totalIncomings - totalOutgoings;

  const formatTotal = (amount: bigint, decimals: number) => {
    const prefix = amount >= 0n ? "+" : "-";
    const amountNumber = formatUnits(amount >= 0n ? amount : -amount, decimals);
    return `${prefix} $${amountNumber}`;
  };

  return (
    <li className="bg-white/5 rounded-lg p-4 text-white/90 shadow">
      <div className="space-y-3">
        {/* Transaction Hash Header */}
        <div className="border-b border-white/10 pb-2">
          {isUnknown ? (
            <div className="font-semibold text-white/70">
              Unknown Transaction
            </div>
          ) : (
            <div className="text-sm">
              {`Transaction: `}
              <a
                href={`https://sepolia-optimism.etherscan.io/tx/${txHash}`}
                className={linkStyle}
                target="_blank"
              >
                {shortString(txHash)}
              </a>
            </div>
          )}
        </div>

        {/* Total Section */}
        {(incomings.length > 0 || outgoings.length > 0) && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-white/70 uppercase tracking-wide">
              Total
            </div>
            <div
              className={`pl-4 border-l-2 ${total >= 0n ? "border-green-400/30" : "border-red-400/30"}`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">
                    {formatTotal(total, decimals)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Incomings Section */}
        {incomings.length > 0 && (
          <Disclosure defaultOpen={false}>
            <DisclosureButton className="w-full text-left">
              <div className="text-xs font-medium text-white/70 uppercase tracking-wide flex items-center justify-between">
                <span>Incomings ({incomings.length})</span>
                <svg
                  className="w-4 h-4 transform transition-transform ui-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </DisclosureButton>
            <DisclosurePanel>
              <div className="space-y-2 mt-2">
                {incomings.map((tx, idx) => (
                  <div
                    key={idx}
                    className="pl-4 border-l-2 border-green-400/30"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold">
                          {formatAmount(
                            BigInt(tx.record.value),
                            tx.status,
                            decimals,
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-white/60">
                        {`Poseidon commitment: uint254(${shortString(tx.record.hash)}n)`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DisclosurePanel>
          </Disclosure>
        )}

        {/* Outgoings Section */}
        {outgoings.length > 0 && (
          <Disclosure defaultOpen={false}>
            <DisclosureButton className="w-full text-left">
              <div className="text-xs font-medium text-white/70 uppercase tracking-wide flex items-center justify-between">
                <span>Outgoings ({outgoings.length})</span>
                <svg
                  className="w-4 h-4 transform transition-transform ui-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </DisclosureButton>
            <DisclosurePanel>
              <div className="space-y-2 mt-2">
                {outgoings.map((tx, idx) => (
                  <div key={idx} className="pl-4 border-l-2 border-red-400/30">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold">
                          {formatAmount(
                            BigInt(tx.record.value),
                            tx.status,
                            decimals,
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-white/60">
                        {`Poseidon commitment: uint254(${shortString(tx.record.hash)}n)`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DisclosurePanel>
          </Disclosure>
        )}
      </div>
    </li>
  );
}

export default function ActivityTab({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(true);
  const [groupedTransactions, setGroupedTransactions] =
    useState<GroupedTransactions>({});
  const [error, setError] = useState<string | null>(null);
  const { ledger } = useContext(LedgerContext);
  const { isConnecting, decimals, isMetadataLoading } =
    useContext(PanelContext);

  const isLoading = isMetadataLoading || isConnecting;

  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const txs = await ledger!.getTransactions();
        if (txs) {
          setGroupedTransactions(txs);
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
        setError("Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    if (active && !isLoading) {
      loadTransactions();
    }
  }, [active, isLoading, ledger]);

  const transactionGroups = Object.entries(groupedTransactions);

  return (
    <div className="h-full pt-4">
      <div className="h-full overflow-y-auto px-4">
        <ul className="flex flex-col gap-4 h-full">
          {isLoading || loading ? (
            Array.from({ length: 10 }).map((_, idx) => (
              <TransactionSkeleton key={idx} />
            ))
          ) : error ? (
            <div className="h-full flex items-center justify-center text-red-400">
              {error}
            </div>
          ) : transactionGroups.length === 0 ? (
            <div className="h-full flex items-center justify-center text-white/70">
              No transactions yet
            </div>
          ) : (
            transactionGroups.map(([txHash, transactions]) => (
              <TransactionGroup
                key={txHash}
                txHash={txHash}
                transactions={transactions}
                decimals={decimals}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
