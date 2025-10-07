import { Watcher } from "@src/services/ledger/Watcher";
import { EvmClients } from "@src/services/Clients";
import { ViewAccount } from "@src/services/Account";
import { MemoryQueue } from "@src/services/core/queue";
import Commitments from "@src/services/ledger/Commitments";
import CommitmentsHistory from "@src/services/ledger/CommitmentsHistory";
import SyncService from "@src/services/ledger/SyncService";
import { type Tes } from "@src/services/Tes";
import { LedgerRecordDto } from "@src/services/ledger/ledger.dto";
import { createMockDataSource } from "@test/mocks/mockDataSource";
import { vi } from "vitest";
import { zeroAddress } from "viem";
import { AxiosInstance } from "axios";
import { SelectedCommitmentRecord, VaultEvent } from "@src/utils/vault/types";

// Mock heavy dependencies
vi.mock("@src/utils/logger", () => ({
  Logger: vi.fn().mockImplementation(() => ({
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  })),
}));

vi.mock("@src/utils/vault/metadata", () => ({
  decodeMetadata: vi.fn(() => ({
    encryptedCommitment: "0x123456789",
    tesUrl: "https://tes.example.com",
  })),
  decryptCommitment: vi.fn(() => ({
    amount: 1000000000000000000n,
    sValue: 123456789n,
  })),
}));

vi.mock("@src/utils/events", () => ({
  compareEvents: vi.fn(() => 0),
}));

vi.mock("@src/utils/common", () => ({
  shortString: vi.fn((str: string) => str.slice(0, 8)),
}));

vi.mock("@src/services/core/catch.service", () => ({
  catchService: {
    catch: vi.fn(),
  },
}));

vi.mock("debounce", () => ({
  default: vi.fn((fn: () => void) => fn),
}));

describe("Watcher", () => {
  let watcher: Watcher;
  let mockEvmClients: EvmClients;
  let mockQueue: MemoryQueue;
  let mockCommitments: Commitments;
  let mockCommitmentsHistory: CommitmentsHistory;
  let mockSyncService: SyncService;
  let mockTesService: Tes;
  let mockAxios: AxiosInstance;

  const mockVault = "0xVault" as const;
  const mockToken = "0xToken" as const;
  const mockAccount = "0xAccount" as const;

  // Helper function to create proper VaultEvent mocks
  const createMockVaultEvent = (
    overrides: Partial<VaultEvent> = {},
  ): VaultEvent =>
    ({
      eventName: "CommitmentCreated",
      args: {
        owner: mockAccount,
        token: mockToken,
        poseidonHash: 0x123456789n,
        metadata: "0xmetadata" as `0x${string}`,
      },
      blockNumber: 100n,
      transactionIndex: 1,
      transactionHash: "0xtxhash" as `0x${string}`,
      address: "0xvault" as `0x${string}`,
      blockHash: "0xblockhash" as `0x${string}`,
      data: "0xdata" as `0x${string}`,
      logIndex: 1,
      removed: false,
      ...overrides,
    }) as VaultEvent;

  beforeEach(() => {
    // Create mock EvmClients
    mockEvmClients = {
      readClient: {
        getBlockNumber: vi.fn(),
        readContract: vi.fn(),
      },
      externalClient: vi.fn(() =>
        Promise.resolve({
          account: { address: mockAccount },
        }),
      ),
    } as unknown as EvmClients;

    // Create mock Queue
    mockQueue = {
      enqueue: vi.fn(),
    } as unknown as MemoryQueue;

    // Create mock Commitments
    mockCommitments = {
      getNonZeroCommitments: vi.fn(() => Promise.resolve([])),
      save: vi.fn(() => Promise.resolve()),
      delete: vi.fn(() => Promise.resolve(null)),
      all: vi.fn(() => Promise.resolve([])),
    } as unknown as Commitments;

    // Create mock CommitmentsHistory
    mockCommitmentsHistory = new CommitmentsHistory(
      createMockDataSource(),
      zeroAddress,
    );

    // Create mock SyncService
    mockSyncService = {
      getLastSyncedBlock: vi.fn(() => Promise.resolve("100")),
      setLastSyncedBlock: vi.fn(() => Promise.resolve()),
      getProcessedBlock: vi.fn(() => BigInt(50)),
    } as unknown as SyncService;

    // Create mock Tes service
    mockTesService = {
      tesUrl: "https://tes.example.com",
      decrypt: vi.fn(() =>
        Promise.resolve({
          amount: 1000000000000000000n,
          sValue: 123456789n,
        }),
      ),
      ViewAccount: {
        viewPrivateKey: vi.fn(() => "0xPrivateKey"),
      } as unknown as ViewAccount,
    } as unknown as Tes;

    // Create mock Axios
    mockAxios = {} as unknown as AxiosInstance;

    // Create Watcher instance
    watcher = new Watcher(
      mockEvmClients,
      mockVault,
      mockToken,
      mockQueue,
      mockCommitments,
      mockCommitmentsHistory,
      mockSyncService,
      mockTesService,
      mockAxios,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("handleEventsBatch", () => {
    it("should handle empty events cache", async () => {
      await watcher.handleEventsBatch();

      // Should not throw and should log empty batch
      expect(true).toBe(true); // Test passes if no error is thrown
    });

    it("should filter and process CommitmentCreated events", async () => {
      // Mock events cache with CommitmentCreated event
      const mockEvent = createMockVaultEvent();

      // Add event to cache (we need to access private property)
      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      // Mock the commitments save method
      const saveSpy = vi
        .spyOn(mockCommitments, "save")
        .mockResolvedValue(void 0);
      const addSpy = vi
        .spyOn(mockCommitmentsHistory, "add")
        .mockResolvedValue(true);

      await watcher.handleEventsBatch({ updateBlockNumber: true });

      expect(saveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          hash: "4886718345", // 0x123456789n converted to decimal string
          value: "1000000000000000000",
          sValue: "123456789",
        }),
      );

      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "added",
          transactionHash: "0xtxhash",
          blockNumber: "100",
          transactionIndex: 1,
        }),
      );
    });

    it("should filter and process CommitmentRemoved events", async () => {
      // Mock events cache with CommitmentRemoved event
      const mockEvent = createMockVaultEvent({
        eventName: "CommitmentRemoved",
        args: {
          owner: mockAccount,
          token: mockToken,
          poseidonHash: 0x123456789n,
        },
        blockNumber: 101n,
        transactionIndex: 2,
        transactionHash: "0xtxhash2" as `0x${string}`,
        logIndex: 2,
      });

      // Add event to cache
      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      // Mock the commitments delete method to return a record
      const mockLedgerRecord = new LedgerRecordDto(
        "4886718345", // 0x123456789n converted to decimal string
        "1000000000000000000",
        "123456789",
      );
      const deleteSpy = vi
        .spyOn(mockCommitments, "delete")
        .mockResolvedValue(mockLedgerRecord);
      const addSpy = vi
        .spyOn(mockCommitmentsHistory, "add")
        .mockResolvedValue(true);

      await watcher.handleEventsBatch({ updateBlockNumber: true });

      expect(deleteSpy).toHaveBeenCalledWith("4886718345"); // 0x123456789n converted to decimal string
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "spend",
          transactionHash: "0xtxhash2",
          blockNumber: "101",
          transactionIndex: 2,
        }),
      );
    });

    it("should filter out events not belonging to the main account", async () => {
      // Mock events cache with event for different account
      const mockEvent = createMockVaultEvent({
        args: {
          owner: "0xDifferentAccount" as `0x${string}`, // Different account
          token: mockToken,
          poseidonHash: 0x123456789n,
          metadata: "0xmetadata" as `0x${string}`,
        },
      });

      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      const saveSpy = vi
        .spyOn(mockCommitments, "save")
        .mockResolvedValue(undefined);

      await watcher.handleEventsBatch();

      // Should not process the event since it's for a different account
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it("should filter out events for different token", async () => {
      // Mock events cache with event for different token
      const mockEvent = createMockVaultEvent({
        args: {
          owner: mockAccount,
          token: "0xDifferentToken" as `0x${string}`, // Different token
          poseidonHash: 0x123456789n,
          metadata: "0xmetadata" as `0x${string}`,
        },
      });

      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      const saveSpy = vi
        .spyOn(mockCommitments, "save")
        .mockResolvedValue(undefined);

      await watcher.handleEventsBatch();

      // Should not process the event since it's for a different token
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it("should filter out events with invalid block number or transaction index", async () => {
      // Mock events cache with event with invalid block number
      const mockEvent = createMockVaultEvent({
        blockNumber: "invalid" as unknown as bigint, // Invalid type
      });

      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      const saveSpy = vi
        .spyOn(mockCommitments, "save")
        .mockResolvedValue(undefined);

      await watcher.handleEventsBatch();

      // Should not process the event since block number is invalid
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it("should handle decryption failure gracefully", async () => {
      // Mock events cache with CommitmentCreated event
      const mockEvent = createMockVaultEvent();

      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      // Mock Tes service to throw error
      const mockTesServiceWithError = {
        tesUrl: "https://tes.example.com",
        decrypt: vi.fn(() => Promise.reject(new Error("Decryption failed"))),
      } as unknown as Tes;

      // Create new watcher with error-prone Tes service
      const watcherWithError = new Watcher(
        mockEvmClients,
        mockVault,
        mockToken,
        mockQueue,
        mockCommitments,
        mockCommitmentsHistory,
        mockSyncService,
        mockTesServiceWithError,
        mockAxios,
      );

      const saveSpy = vi
        .spyOn(mockCommitments, "save")
        .mockResolvedValue(undefined);

      await watcherWithError.handleEventsBatch();

      // Should not save anything due to decryption failure
      expect(saveSpy).not.toHaveBeenCalled();
    });

    it("should update sync service when updateBlockNumber is true", async () => {
      const mockEvent = createMockVaultEvent();

      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      vi.spyOn(mockCommitments, "save").mockResolvedValue(undefined);
      vi.spyOn(mockCommitmentsHistory, "add").mockResolvedValue(true);

      const setLastSyncedBlockSpy = vi
        .spyOn(mockSyncService, "setLastSyncedBlock")
        .mockResolvedValue(undefined);

      await watcher.handleEventsBatch({ updateBlockNumber: true });

      expect(setLastSyncedBlockSpy).toHaveBeenCalledWith("100");
    });

    it("should not update sync service when updateBlockNumber is false", async () => {
      const mockEvent = createMockVaultEvent();

      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      vi.spyOn(mockCommitments, "save").mockResolvedValue(undefined);
      vi.spyOn(mockCommitmentsHistory, "add").mockResolvedValue(true);

      const setLastSyncedBlockSpy = vi
        .spyOn(mockSyncService, "setLastSyncedBlock")
        .mockResolvedValue(undefined);

      await watcher.handleEventsBatch({ updateBlockNumber: false });

      expect(setLastSyncedBlockSpy).not.toHaveBeenCalled();
    });

    it("should clear events cache after processing", async () => {
      const mockEvent = createMockVaultEvent();

      (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache = [
        mockEvent,
      ];

      vi.spyOn(mockCommitments, "save").mockResolvedValue(undefined);
      vi.spyOn(mockCommitmentsHistory, "add").mockResolvedValue(true);

      await watcher.handleEventsBatch();

      // Events cache should be empty after processing
      expect(
        (watcher as unknown as { eventsCache: VaultEvent[] }).eventsCache,
      ).toHaveLength(0);
    });
  });

  describe("syncStatus", () => {
    it("should return sync status with current and anchor block", async () => {
      // Mock readClient to return current block
      const mockReadClient = {
        getBlockNumber: vi.fn(() => Promise.resolve(200n)),
      };
      Object.defineProperty(mockEvmClients, "readClient", {
        value: mockReadClient,
        writable: true,
      });

      // Mock syncService methods
      vi.mocked(mockSyncService.getLastSyncedBlock).mockResolvedValue("150");
      vi.mocked(mockSyncService.getProcessedBlock).mockReturnValue(BigInt(100));

      const result = await watcher.syncStatus();

      expect(result).toEqual({
        currentBlock: 200n,
        anchorBlock: 150n, // lastSyncedBlock > processedBlock, so anchorBlock = lastSyncedBlock
      });

      expect(mockReadClient.getBlockNumber).toHaveBeenCalled();
      expect(mockSyncService.getLastSyncedBlock).toHaveBeenCalled();
      expect(mockSyncService.getProcessedBlock).toHaveBeenCalled();
    });

    it("should use processedBlock as anchor when it's greater than lastSyncedBlock", async () => {
      const mockReadClient = {
        getBlockNumber: vi.fn(() => Promise.resolve(200n)),
      };
      Object.defineProperty(mockEvmClients, "readClient", {
        value: mockReadClient,
        writable: true,
      });

      // Mock syncService methods - processedBlock > lastSyncedBlock
      vi.mocked(mockSyncService.getLastSyncedBlock).mockResolvedValue("100");
      vi.mocked(mockSyncService.getProcessedBlock).mockReturnValue(BigInt(150));

      const result = await watcher.syncStatus();

      expect(result).toEqual({
        currentBlock: 200n,
        anchorBlock: 150n, // processedBlock > lastSyncedBlock, so anchorBlock = processedBlock
      });
    });

    it("should handle equal lastSyncedBlock and processedBlock", async () => {
      const mockReadClient = {
        getBlockNumber: vi.fn(() => Promise.resolve(200n)),
      };
      Object.defineProperty(mockEvmClients, "readClient", {
        value: mockReadClient,
        writable: true,
      });

      // Mock syncService methods - both equal
      vi.mocked(mockSyncService.getLastSyncedBlock).mockResolvedValue("100");
      vi.mocked(mockSyncService.getProcessedBlock).mockReturnValue(BigInt(100));

      const result = await watcher.syncStatus();

      expect(result).toEqual({
        currentBlock: 200n,
        anchorBlock: 100n, // Both equal, so anchorBlock = lastSyncedBlock
      });
    });
  });

  describe("getConsolidationRatio", () => {
    it("should return ratio 1 and balance 0 when commitments <= 3", async () => {
      // Mock getNonZeroCommitments to return 2 commitments
      const mockCommitmentsData = [
        { value: 1000000000000000000n },
        { value: 2000000000000000000n },
      ];
      mockCommitments.getNonZeroCommitments = vi.fn(() =>
        Promise.resolve(
          mockCommitmentsData as unknown as SelectedCommitmentRecord[],
        ),
      );

      const result = await watcher.getConsolidationRatio();

      expect(result).toEqual({
        ratio: 1,
        balanceForConsolidation: 0n,
      });
    });

    it("should return ratio 1 and balance 0 when commitments = 3", async () => {
      // Mock getNonZeroCommitments to return exactly 3 commitments
      const mockCommitmentsData = [
        { value: 1000000000000000000n },
        { value: 2000000000000000000n },
        { value: 3000000000000000000n },
      ];
      mockCommitments.getNonZeroCommitments = vi.fn(() =>
        Promise.resolve(
          mockCommitmentsData as unknown as SelectedCommitmentRecord[],
        ),
      );

      const result = await watcher.getConsolidationRatio();

      expect(result).toEqual({
        ratio: 1,
        balanceForConsolidation: 0n,
      });
    });

    it("should calculate consolidation ratio for more than 3 commitments", async () => {
      // Mock getNonZeroCommitments to return 5 commitments
      const mockCommitmentsData = [
        { value: 1000000000000000000n }, // 1 token
        { value: 2000000000000000000n }, // 2 tokens
        { value: 3000000000000000000n }, // 3 tokens
        { value: 100000000000000000n }, // 0.1 tokens
        { value: 50000000000000000n }, // 0.05 tokens
      ];
      mockCommitments.getNonZeroCommitments = vi.fn(() =>
        Promise.resolve(
          mockCommitmentsData as unknown as SelectedCommitmentRecord[],
        ),
      );

      const result = await watcher.getConsolidationRatio();

      // Total balance: 1 + 2 + 3 + 0.1 + 0.05 = 6.15 tokens
      // Top 3 balance: 1 + 2 + 3 = 6 tokens
      // Ratio: 6 / 6.15 ≈ 0.9756
      // Balance for consolidation: 1 + 2 + 3 + 0.1 + 0.05 = 6.15 tokens (all 5, but limited to 16)
      expect(result.ratio).toBeCloseTo(0.9756, 4);
      expect(result.balanceForConsolidation).toBe(6150000000000000000n);
    });

    it("should return ratio 1 and balance 0 when total balance is 0", async () => {
      // Mock getNonZeroCommitments to return commitments with 0 values
      const mockCommitmentsData = [
        { value: 0n },
        { value: 0n },
        { value: 0n },
        { value: 0n },
      ];
      mockCommitments.getNonZeroCommitments = vi.fn(() =>
        Promise.resolve(
          mockCommitmentsData as unknown as SelectedCommitmentRecord[],
        ),
      );

      const result = await watcher.getConsolidationRatio();

      expect(result).toEqual({
        ratio: 1,
        balanceForConsolidation: 0n,
      });
    });

    it("should handle exactly 16 commitments for balance calculation", async () => {
      // Mock getNonZeroCommitments to return 16 commitments
      const mockCommitmentsData = Array.from({ length: 16 }, (_, i) => ({
        value: BigInt(i + 1) * 1000000000000000000n, // 1, 2, 3, ..., 16 tokens
      }));
      mockCommitments.getNonZeroCommitments = vi.fn(() =>
        Promise.resolve(
          mockCommitmentsData as unknown as SelectedCommitmentRecord[],
        ),
      );

      const result = await watcher.getConsolidationRatio();

      // Total balance: 1+2+...+16 = 136 tokens
      // Top 3 balance: 1+2+3 = 6 tokens
      // Ratio: 6/136 ≈ 0.0441
      // Balance for consolidation: 1+2+...+16 = 136 tokens (all 16)
      expect(result.ratio).toBeCloseTo(0.0441, 4);
      expect(result.balanceForConsolidation).toBe(136000000000000000000n);
    });

    it("should handle more than 16 commitments for balance calculation", async () => {
      // Mock getNonZeroCommitments to return 20 commitments
      const mockCommitmentsData = Array.from({ length: 20 }, (_, i) => ({
        value: BigInt(i + 1) * 1000000000000000000n, // 1, 2, 3, ..., 20 tokens
      }));
      mockCommitments.getNonZeroCommitments = vi.fn(() =>
        Promise.resolve(
          mockCommitmentsData as unknown as SelectedCommitmentRecord[],
        ),
      );

      const result = await watcher.getConsolidationRatio();

      // Total balance: 1+2+...+20 = 210 tokens
      // Top 3 balance: 1+2+3 = 6 tokens
      // Ratio: 6/210 ≈ 0.0286
      // Balance for consolidation: 1+2+...+16 = 136 tokens (only first 16)
      expect(result.ratio).toBeCloseTo(0.0286, 4);
      expect(result.balanceForConsolidation).toBe(136000000000000000000n);
    });
  });
});
