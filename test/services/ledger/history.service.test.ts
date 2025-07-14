import { describe, it, expect, beforeEach, afterEach } from "vitest";
import CommitmentsHistoryService from "@src/services/ledger/history.service";
import {
  HistoryRecordDto,
  LedgerRecordDto,
} from "@src/services/ledger/ledger.dto";
import { createMockDataSource } from "@test/utils/mockDataSource";

describe("CommitmentsHistoryService", () => {
  let service: CommitmentsHistoryService;

  const createMockHistoryRecord = (
    status: "added" | "spend" = "added",
    transactionHash: `0x${string}` | null = "0x1234567890abcdef",
    value: string = "1000000000000000000",
    sValue: string = "123456789",
    hash: string = "987654321",
  ): HistoryRecordDto => {
    const record = LedgerRecordDto.from(
      BigInt(hash),
      BigInt(value),
      BigInt(sValue),
    );
    return new HistoryRecordDto(status, transactionHash, record);
  };

  beforeEach(() => {
    service = new CommitmentsHistoryService(createMockDataSource());
  });

  afterEach(async () => {
    await service.clean();
  });

  describe("isEmpty", () => {
    it("should return true for empty service", async () => {
      expect(await service.isEmpty()).toBe(true);
    });

    it("should return false when records exist", async () => {
      const record = createMockHistoryRecord();
      await service.add(record);
      expect(await service.isEmpty()).toBe(false);
    });
  });

  describe("add", () => {
    it("should add first record and set as head and tail", async () => {
      const record = createMockHistoryRecord();
      const result = await service.add(record);

      expect(result).toBe(true);
      expect(await service.isEmpty()).toBe(false);
      expect(await service.has(record.id)).toBe(true);
    });

    it("should not add duplicate records", async () => {
      const record = createMockHistoryRecord();
      await service.add(record);
      const result = await service.add(record);

      expect(result).toBe(false);
    });
  });

  describe("has", () => {
    it("should return false for non-existent record", async () => {
      const record = createMockHistoryRecord();
      expect(await service.has(record.id)).toBe(false);
    });

    it("should return true for existing record", async () => {
      const record = createMockHistoryRecord();
      await service.add(record);
      expect(await service.has(record.id)).toBe(true);
    });
  });

  describe("all", () => {
    it("should return empty array for empty list", async () => {
      const allRecords = await service.all();
      expect(allRecords).toEqual([]);
    });

    it("should return all records in reverse order", async () => {
      const records = [
        createMockHistoryRecord("added", "0x1111111111111111", "100", "1", "1"),
        createMockHistoryRecord("spend", "0x2222222222222222", "200", "2", "2"),
        createMockHistoryRecord("added", "0x3333333333333333", "300", "3", "3"),
      ];

      for (const record of records) {
        await service.add(record);
      }

      const allRecords = await service.all();
      expect(allRecords).toHaveLength(3);
      expect(allRecords.map((r) => r.id)).toEqual(
        records.map((r) => r.id).reverse(),
      );
    });
  });

  describe("clean", () => {
    it("should clear all data", async () => {
      const record = createMockHistoryRecord();
      await service.add(record);
      expect(await service.isEmpty()).toBe(false);

      await service.clean();
      expect(await service.isEmpty()).toBe(true);
      expect(await service.has(record.id)).toBe(false);
    });
  });
});
