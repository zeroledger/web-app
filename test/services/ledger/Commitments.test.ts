import Commitments from "@src/services/ledger/Commitments";
import { LedgerRecordDto } from "@src/services/ledger/ledger.dto";
import { createMockDataSource } from "@test/utils/mockDataSource";
import { zeroAddress } from "viem";

describe("Commitments", () => {
  let service: Commitments;

  const createRecord = (
    hash: string,
    value: string,
    sValue: string = "1",
  ): LedgerRecordDto => new LedgerRecordDto(hash, value, sValue);

  beforeEach(() => {
    service = new Commitments(createMockDataSource(), zeroAddress);
  });

  afterEach(async () => {
    await service.reset();
  });

  it("should save and find a record", async () => {
    const rec = createRecord("1", "100");
    await service.save(rec);
    const found = await service.findOne("1");
    expect(found.hash).toBe("1");
    expect(found.value).toBe("100");
  });

  it("should throw on findOne if not found", async () => {
    await expect(service.findOne("notfound")).rejects.toThrow("NOTE_NOT_FOUND");
  });

  it("should return null on findOneSafe if not found", async () => {
    const res = await service.findOneSafe("notfound");
    expect(res).toBeNull();
  });

  it("should save and find many records", async () => {
    const recs = [createRecord("1", "100"), createRecord("2", "200")];
    await service.saveMany(recs);
    const found = await service.findMany(["1", "2"]);
    expect(found).toHaveLength(2);
    expect(found.map((r) => r.hash)).toEqual(["1", "2"]);
  });

  it("should get all records", async () => {
    const recs = [createRecord("1", "100"), createRecord("2", "200")];
    await service.saveMany(recs);
    const all = await service.all();
    expect(all.map((r) => r.hash).sort()).toEqual(["1", "2"]);
  });

  it("should delete a record and return it", async () => {
    const rec = createRecord("1", "100");
    await service.save(rec);
    const deleted = await service.delete("1");
    expect(deleted?.hash).toBe("1");
    const notFound = await service.findOneSafe("1");
    expect(notFound).toBeNull();
  });

  it("should delete many records", async () => {
    const recs = [createRecord("1", "100"), createRecord("2", "200")];
    await service.saveMany(recs);
    await service.deleteMany(["1", "2"]);
    const all = await service.all();
    expect(all).toHaveLength(0);
  });

  it("should clear all records", async () => {
    const recs = [createRecord("1", "100"), createRecord("2", "200")];
    await service.saveMany(recs);
    await service.reset();
    const all = await service.all();
    expect(all).toHaveLength(0);
  });

  it("should find commitments to cover amount", async () => {
    // Add commitments with values 10, 20, 30
    await service.saveMany([
      createRecord("1", "10"),
      createRecord("2", "20"),
      createRecord("3", "30"),
    ]);
    const { selectedCommitmentRecords, totalAmount } =
      await service.findCommitments(25n);
    // Should select two smallest (10, 20) to cover 25
    expect(selectedCommitmentRecords.length).toBeGreaterThan(0);
    expect(totalAmount >= 25n).toBe(true);
  });

  it("should return empty if not enough commitments", async () => {
    await service.save(createRecord("1", "5"));
    const { selectedCommitmentRecords, totalAmount } =
      await service.findCommitments(100n);
    expect(selectedCommitmentRecords.length).toBe(0);
    expect(totalAmount).toBe(0n);
  });
});
