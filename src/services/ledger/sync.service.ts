import { CustomClient } from "@src/common.types";
import { Address } from "viem";
import { DataSource } from "@src/services/core/db/leveldb.service";
import { getMissedEvents } from "@src/utils/vault";

export const SyncEntityKey = {
  name: `sync_state`,
};

export default class SyncService {
  constructor(public readonly dataSource: DataSource) {
    this._store = this.dataSource.getEntityLevel(SyncEntityKey);
  }

  private _store: ReturnType<DataSource["getEntityLevel"]>;

  /**
   * Get the last synced block number
   * @returns The last synced block number as a string, or null if no sync has occurred
   */
  async getLastSyncedBlock(): Promise<string | undefined> {
    const lastBlock = await this._store.get("lastSyncedBlock");
    return lastBlock;
  }

  /**
   * Set the last synced block number
   * @param blockNumber The block number to store (as string)
   */
  async setLastSyncedBlock(blockNumber: string): Promise<void> {
    await this._store.put("lastSyncedBlock", blockNumber);
  }

  /**
   * Clear all sync state
   */
  async clear(): Promise<void> {
    await this._store.clear();
  }

  async runSync(
    client: CustomClient,
    vault: Address,
    address: Address,
    token: Address,
    currentBlock: bigint,
  ) {
    const lastBlock = BigInt((await this.getLastSyncedBlock()) ?? "0");
    if (lastBlock < currentBlock) {
      const [missedCommitmentCreatedEvents, missedCommitmentRemovedEvents] =
        await Promise.all([
          await getMissedEvents(
            client,
            vault,
            address,
            token,
            "CommitmentCreated",
            lastBlock + 1n,
            currentBlock,
          ),
          await getMissedEvents(
            client,
            vault,
            address,
            token,
            "CommitmentRemoved",
            lastBlock + 1n,
            currentBlock,
          ),
        ]);
      await this.setLastSyncedBlock(currentBlock.toString());
      return missedCommitmentCreatedEvents.concat(
        missedCommitmentRemovedEvents,
      );
    }
    return [];
  }
}
