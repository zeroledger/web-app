export type EventLike = {
  blockNumber: bigint | number | string;
  transactionIndex: number;
};

export const sortEvents = (events: EventLike[]) => events.sort(compareEvents);

export const compareEvents = (e0: EventLike, e1: EventLike) => {
  // Compare block numbers first (newest first)
  const blockA = BigInt(e0.blockNumber);
  const blockB = BigInt(e1.blockNumber);

  if (blockA !== blockB) {
    return blockB > blockA ? 1 : -1; // Newest first
  }

  // If same block, compare transaction index (newest first)
  if (e0.transactionIndex !== e1.transactionIndex) {
    return e1.transactionIndex - e0.transactionIndex; // Newest first
  }

  // If same block and transaction index, maintain insertion order
  return 0;
};
