import { useEffect, useState } from "react";
import { formatUnits, Hex, hexToBigInt } from "viem";
import { shortHex } from "@src/utils/common";
import { ControllerContext } from "@src/context/controller.context";
import { WalletContext } from "@src/context/wallet.context";
import { useContext } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Transaction = any;

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString();
};

const formatAmount = (
  amount: Hex,
  type: Transaction["label"],
  decimals: number,
) => {
  const prefix =
    type === "Incoming Transaction" || type === "Deposit Transaction"
      ? "+"
      : "-";
  const amountNumber = formatUnits(hexToBigInt(amount), decimals);
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

function CommonTransactionMetadataSection({
  tx,
  decimals,
}: {
  tx: Transaction;
  decimals: number;
}) {
  return (
    <>
      <div>{formatAmount(tx.amount, tx.label, decimals)}</div>
      <div className="text-xs text-white/60">{formatDate(tx.date)}</div>
      {tx.txHash && (
        <div className="text-xs text-white/70">
          Round transaction:{" "}
          <a
            href={`https://sepolia-optimism.etherscan.io/tx/${tx.txHash}`}
            className={linkStyle}
            target="_blank"
          >
            {shortHex(tx.txHash)}
          </a>
        </div>
      )}
    </>
  );
}

const disabledLinkStyle = "text-white/70 cursor-default";
const linkStyle = "underline text-blue-300 hover:text-blue-400";
const idsContainerStyle = "flex flex-wrap text-xs gap-1 text-white/70";

export default function ActivityTab({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { clientController } = useContext(ControllerContext);
  const { decimals } = useContext(WalletContext);

  useEffect(() => {
    const loadTransactions = async () => {
      if (!clientController) return;

      setLoading(true);
      setError(null);
      try {
        const txs = await clientController.getTransactions();
        setTransactions(txs);
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
  }, [clientController, active]);

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
                {tx.label === "Incoming Transaction" ? (
                  <div className="space-y-1 flex flex-col">
                    <div className="font-semibold">{tx.label}</div>
                    <div className="text-base">{`From: ${shortHex(tx.from)}`}</div>
                    <CommonTransactionMetadataSection
                      tx={tx}
                      decimals={decimals}
                    />
                    <div className="text-xs text-white/70">
                      Incoming note:{" "}
                      <a
                        href={`#${tx.maskedNoteDigest}`}
                        className={disabledLinkStyle}
                      >
                        {shortHex(tx.maskedNoteDigest)}
                      </a>
                    </div>
                  </div>
                ) : tx.label === "Spend Transaction" ? (
                  <div className="space-y-1">
                    <div className="font-semibold">{tx.label}</div>
                    {tx.recipient && (
                      <div className="text-base">{`To: ${shortHex(tx.recipient)}`}</div>
                    )}
                    <CommonTransactionMetadataSection
                      tx={tx}
                      decimals={decimals}
                    />
                    {tx.spentMaskedNoteDigests &&
                      tx.spentMaskedNoteDigests.length > 0 && (
                        <div className={idsContainerStyle}>
                          <span>Spend notes:</span>
                          {tx.spentMaskedNoteDigests?.map(
                            (noteId: Hex, idx: number) => (
                              <a
                                key={idx}
                                href={`#${noteId}`}
                                className={disabledLinkStyle}
                              >
                                {shortHex(noteId)}
                              </a>
                            ),
                          )}
                        </div>
                      )}
                    {tx.sendMaskedNoteDigest && (
                      <div className={idsContainerStyle}>
                        <span>Send note:</span>
                        <a
                          href={`#${tx.sendMaskedNoteDigest}`}
                          className={disabledLinkStyle}
                        >
                          {shortHex(tx.sendMaskedNoteDigest)}
                        </a>
                      </div>
                    )}
                    <div className={idsContainerStyle}>
                      <span>Change note:</span>
                      <a
                        href={`#${tx.changeMaskedNoteDigest}`}
                        className={disabledLinkStyle}
                      >
                        {shortHex(tx.changeMaskedNoteDigest)}
                      </a>
                    </div>
                  </div>
                ) : tx.label === "Deposit Transaction" ? (
                  <div className="space-y-1 flex flex-col">
                    <div className="font-semibold">{tx.label}</div>
                    <CommonTransactionMetadataSection
                      tx={tx}
                      decimals={decimals}
                    />
                    <div className="text-xs text-white/70">
                      Deposit note:{" "}
                      <a
                        href={`#${tx.maskedNoteDigest}`}
                        className={disabledLinkStyle}
                      >
                        {shortHex(tx.maskedNoteDigest)}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1 flex flex-col">
                    <div className="font-semibold">{tx.label}</div>
                    <CommonTransactionMetadataSection
                      tx={tx}
                      decimals={decimals}
                    />
                    <div className="text-xs text-white/70">
                      Deposit note:{" "}
                      <a
                        href={`#${tx.maskedNoteDigest}`}
                        className={disabledLinkStyle}
                      >
                        {shortHex(tx.maskedNoteDigest)}
                      </a>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
