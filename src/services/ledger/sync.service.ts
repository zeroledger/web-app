import { Address, PublicClient } from "viem";
import { type DataSource } from "@src/services/core/db/leveldb.service";
import { getMissedEvents } from "@src/utils/vault/watcher";
import { VaultEvent } from "@src/utils/vault/types";
import { Logger } from "@src/utils/logger";

export const SyncEntityKey = (address: Address) => ({
  name: `sync_state-${address}`,
});

export default class SyncService {
  constructor(
    public readonly dataSource: DataSource,
    readonly address: Address,
  ) {
    this._store = this.dataSource.getEntityLevel(SyncEntityKey(address));
  }

  private _store: ReturnType<DataSource["getEntityLevel"]>;
  private _processedBlock: bigint = 30538369n;
  private logger = new Logger(SyncService.name);

  /**
   * Get the last synced block number
   * @returns The last synced block number as a string, or null if no sync has occurred
   */
  async getLastSyncedBlock(): Promise<string> {
    const lastBlock = await this._store.get("lastSyncedBlock");
    return lastBlock ?? "30538369";
  }

  /**
   * Set the last synced block number
   * @param blockNumber The block number to store (as string)
   */
  async setLastSyncedBlock(blockNumber: string): Promise<void> {
    await this._store.put("lastSyncedBlock", blockNumber);
  }

  getProcessedBlock(): bigint {
    return this._processedBlock;
  }

  /**
   * Clear all sync state
   */
  async clear(): Promise<void> {
    await this._store.clear();
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Run sync process to fetch missed events from last synced block to current block
   * Handles pagination and rate limiting for large block ranges
   * @param client - The blockchain client
   * @param vault - The vault address
   * @param address - The user address
   * @param token - The token address
   * @param currentBlock - The current block number
   * @returns Array of missed events (CommitmentCreated and CommitmentRemoved)
   */
  async runOnchainSync(
    client: PublicClient,
    vault: Address,
    address: Address,
    token: Address,
    currentBlock: bigint,
  ) {
    const lastBlock = BigInt((await this.getLastSyncedBlock()) ?? "0");
    if (lastBlock >= currentBlock) {
      this._processedBlock = currentBlock;
      return [];
    }

    const MAX_BLOCKS_PER_REQUEST = 500n;
    const RATE_LIMIT_DELAY = 100; // 100ms between requests

    this._processedBlock = lastBlock + 1n;
    const allCommitmentCreatedEvents: VaultEvent[] = [];
    const allCommitmentRemovedEvents: VaultEvent[] = [];

    // Process blocks in chunks of 500
    while (this._processedBlock < currentBlock) {
      const startBlock = this._processedBlock + 1n;
      const toBlock = startBlock + MAX_BLOCKS_PER_REQUEST - 1n;
      const endBlock = toBlock > currentBlock ? currentBlock : toBlock;

      const commitmentCreatedEvents = await getMissedEvents(
        client,
        vault,
        address,
        token,
        "CommitmentCreated",
        startBlock,
        endBlock,
      );

      await this.sleep(RATE_LIMIT_DELAY);

      const commitmentRemovedEvents = await getMissedEvents(
        client,
        vault,
        address,
        token,
        "CommitmentRemoved",
        startBlock,
        endBlock,
      );

      // Collect events
      allCommitmentCreatedEvents.push(...commitmentCreatedEvents);
      allCommitmentRemovedEvents.push(...commitmentRemovedEvents);

      // Move to next block range
      this._processedBlock = endBlock;

      // Rate limiting: wait 100ms before next request (except for the last iteration)
      if (this._processedBlock < currentBlock) {
        await this.sleep(RATE_LIMIT_DELAY);
      }
    }

    // Update the last synced block to current block
    this.logger.log(
      `runOnchainSync: updating last synced block to ${currentBlock.toString()}`,
    );
    await this.setLastSyncedBlock(currentBlock.toString());

    // Return all collected events
    return allCommitmentCreatedEvents.concat(allCommitmentRemovedEvents);
  }

  async reset() {
    await this._store.clear();
  }
}
