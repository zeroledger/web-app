import { SelectedCommitmentRecord } from "@src/utils/vault";
import { DataSource } from "@src/services/core/db/leveldb.service";
import { LedgerRecordDto } from "./ledger.dto";

const recordEntityKey = {
  name: `commitments`,
};

export default class CommitmentsService {
  constructor(readonly dataSource: DataSource) {}

  async findOne(hash: BigIntString): Promise<LedgerRecordDto> {
    const store = this.dataSource.getEntityLevel(recordEntityKey);
    const data = (await store.get(hash)) as string | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return LedgerRecordDto.of(data);
  }

  async findMany(hashes: BigIntString[]): Promise<LedgerRecordDto[]> {
    const store = this.dataSource.getEntityLevel(recordEntityKey);
    const data = (await store.getMany(hashes)) as string[] | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return data.map((item) => LedgerRecordDto.of(item));
  }

  async saveMany(items: LedgerRecordDto[]) {
    const batch = items.map((item) => ({
      type: "put" as const,
      sublevel: this.dataSource.getEntityLevel(recordEntityKey),
      key: item.hash,
      value: JSON.stringify(item),
    }));

    return this.dataSource.db.batch(batch);
  }

  async save(data: LedgerRecordDto) {
    const store = this.dataSource.getEntityLevel(recordEntityKey);
    await store.put(data.hash, JSON.stringify(data));
  }

  async delete(hash: BigIntString) {
    const store = this.dataSource.getEntityLevel(recordEntityKey);
    await store.del(hash);
  }

  async deleteMany(hashes: BigIntString[]) {
    const batch = hashes.map((hash) => ({
      type: "del" as const,
      sublevel: this.dataSource.getEntityLevel(recordEntityKey),
      key: hash,
    }));

    return this.dataSource.db.batch(batch);
  }

  async all() {
    const store = this.dataSource.getEntityLevel(recordEntityKey);
    const data = (await store.values().all()) as string[];
    return data.map((item) => LedgerRecordDto.of(item));
  }

  async clear() {
    return this.dataSource.getEntityLevel(recordEntityKey).clear();
  }

  async findCommitments(amount: bigint) {
    // Sort commitments by amount in descending order
    const sortedCommitments = [...(await this.all())]
      .map((c) => ({
        value: BigInt(c.value),
        sValue: BigInt(c.sValue),
        hash: BigInt(c.hash),
      }))
      .sort((a, b) => {
        if (a.value === b.value) {
          return 0;
        }
        return a.value > b.value ? -1 : 1;
      });

    let selectedCommitmentRecords: Array<SelectedCommitmentRecord> = [];

    let i = 0;
    let accumulatedAmount = 0n;

    while (i < sortedCommitments.length && accumulatedAmount < amount) {
      accumulatedAmount = 0n;
      selectedCommitmentRecords = [];
      for (let j = i; j < 3; j++) {
        if (accumulatedAmount >= amount) {
          break;
        }
        accumulatedAmount += sortedCommitments[j].value;
        selectedCommitmentRecords.push(sortedCommitments[j]);
      }
      i++;
    }

    return {
      selectedCommitmentRecords,
      totalAmount: accumulatedAmount,
    };
  }
}
