import useSWR from "swr";
import { type Ledger } from "@src/services/ledger";

const depositFeesFetcher = async ([ledger, decimals]: [Ledger, number]) =>
  ledger.fees.getDepositFeesData(decimals);

const spendFeesFetcher = async ([ledger, decimals]: [Ledger, number]) =>
  ledger.fees.getSpendFeesData(decimals);

const withdrawFeesFetcher = async ([ledger, decimals]: [
  Ledger,
  number,
  number,
]) => {
  const itemsToWithdraw = await ledger.transactions.getWithdrawAllItems();
  const withdrawFees = await ledger.fees.getWithdrawFeesData(
    decimals,
    itemsToWithdraw.length,
  );
  return {
    withdrawFees,
    itemsToWithdraw,
  };
};

export function useDepositFees(ledger: Ledger, decimals: number) {
  return useSWR([ledger, decimals, "depositFees"], depositFeesFetcher);
}

export function useSpendFees(ledger: Ledger, decimals: number) {
  return useSWR([ledger, decimals, "spendFees"], spendFeesFetcher);
}

export function useWithdrawFees(ledger: Ledger, decimals: number) {
  return useSWR([ledger, decimals, "withdrawFees"], withdrawFeesFetcher);
}
