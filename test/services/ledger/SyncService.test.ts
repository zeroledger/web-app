import { EvmClients } from "@src/services/Clients";
import SyncService from "@src/services/ledger/SyncService";
import { createMockDataSource } from "@test/mocks/mockDataSource";
import { zeroAddress } from "viem";

vi.mock("@src/utils/logger", () => ({
  Logger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}));

describe("SyncService", () => {
  let syncService: SyncService;
  let mockDataSource: ReturnType<typeof createMockDataSource>;
  let mockEvmClients: EvmClients;
  const mockAccount = "0xAccount" as const;

  beforeEach(() => {
    mockDataSource = createMockDataSource();
    mockEvmClients = {
      readClient: {
        getBlockNumber: vi.fn(() => Promise.resolve(30538369n)),
        readContract: vi.fn(),
      },
      externalClient: vi.fn(() => ({
        account: {
          address: mockAccount,
          sign: vi.fn(),
        },
        chain: { id: 1 },
        signTypedData: vi.fn(),
        multicall: vi.fn(),
        readContract: vi.fn(),
      })),
    } as unknown as EvmClients;
    syncService = new SyncService(
      mockEvmClients,
      mockDataSource,
      zeroAddress,
      0n,
    );
  });

  afterEach(() => {
    // Clear the store by getting the entity level and clearing it
    const store = mockDataSource.getEntityLevel({ name: "sync_state" });
    store.clear();
  });

  describe("getLastSyncedBlock", () => {
    it("should return 30538369 when no block has been synced", async () => {
      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("30538369");
    });

    it("should return the last synced block number", async () => {
      await syncService.setLastSyncedBlock("12345");
      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("12345");
    });

    it("should return the most recent block number when multiple blocks are set", async () => {
      await syncService.setLastSyncedBlock("1000");
      await syncService.setLastSyncedBlock("2000");
      await syncService.setLastSyncedBlock("3000");

      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("3000");
    });
  });

  describe("setLastSyncedBlock", () => {
    it("should store the block number as a string", async () => {
      await syncService.setLastSyncedBlock("12345");
      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("12345");
    });

    it("should overwrite the previous block number", async () => {
      await syncService.setLastSyncedBlock("1000");
      await syncService.setLastSyncedBlock("2000");

      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("2000");
    });

    it("should handle large block numbers", async () => {
      const largeBlockNumber = "18446744073709551615"; // Max uint64
      await syncService.setLastSyncedBlock(largeBlockNumber);

      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe(largeBlockNumber);
    });

    it("should handle zero block number", async () => {
      await syncService.setLastSyncedBlock("0");
      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("0");
    });
  });

  describe("clear", () => {
    it("should clear all sync state", async () => {
      await syncService.setLastSyncedBlock("12345");
      await syncService.clear();

      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("30538369");
    });

    it("should allow setting new block after clear", async () => {
      await syncService.setLastSyncedBlock("12345");
      await syncService.clear();
      await syncService.setLastSyncedBlock("67890");

      const result = await syncService.getLastSyncedBlock();
      expect(result).toBe("67890");
    });
  });

  describe("integration", () => {
    it("should maintain state across multiple operations", async () => {
      // Initial state
      expect(await syncService.getLastSyncedBlock()).toBe("30538369");

      // Set first block
      await syncService.setLastSyncedBlock("100");
      expect(await syncService.getLastSyncedBlock()).toBe("100");

      // Update to newer block
      await syncService.setLastSyncedBlock("200");
      expect(await syncService.getLastSyncedBlock()).toBe("200");

      // Clear and verify
      await syncService.clear();
      expect(await syncService.getLastSyncedBlock()).toBe("30538369");

      // Set new block after clear
      await syncService.setLastSyncedBlock("300");
      expect(await syncService.getLastSyncedBlock()).toBe("300");
    });
  });
});
