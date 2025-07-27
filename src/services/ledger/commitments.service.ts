import { SelectedCommitmentRecord } from "@src/utils/vault";
import { DataSource } from "@src/services/core/db/leveldb.service";
import { LedgerRecordDto } from "./ledger.dto";

const recordEntityKey = {
  name: `commitments`,
};

export default class CommitmentsService {
  constructor(readonly dataSource: DataSource) {
    this._store = this.dataSource.getEntityLevel(recordEntityKey);
  }

  private _store: ReturnType<DataSource["getEntityLevel"]>;

  async findOneSafe(hash: BigIntString): Promise<LedgerRecordDto | null> {
    const data = (await this._store.get(hash)) as string | undefined;
    if (!data) {
      return null;
    }
    return LedgerRecordDto.of(data);
  }

  async findOne(hash: BigIntString): Promise<LedgerRecordDto> {
    const data = (await this._store.get(hash)) as string | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return LedgerRecordDto.of(data);
  }

  async findMany(hashes: BigIntString[]): Promise<LedgerRecordDto[]> {
    const data = (await this._store.getMany(hashes)) as string[] | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return data.map((item) => LedgerRecordDto.of(item));
  }

  async saveMany(items: LedgerRecordDto[]) {
    const batch = items.map((item) => ({
      type: "put" as const,
      sublevel: this._store,
      key: item.hash,
      value: JSON.stringify(item),
    }));

    return this.dataSource.db.batch(batch);
  }

  async save(data: LedgerRecordDto) {
    await this._store.put(data.hash, JSON.stringify(data));
  }

  async delete(hash: BigIntString) {
    const commitment = await this.findOneSafe(hash);
    await this._store.del(hash);
    return commitment;
  }

  async deleteMany(hashes: BigIntString[]) {
    const batch = hashes.map((hash) => ({
      type: "del" as const,
      sublevel: this._store,
      key: hash,
    }));

    return this.dataSource.db.batch(batch);
  }

  async all() {
    const data = (await this._store.values().all()) as string[];
    return data.map((item) => LedgerRecordDto.of(item));
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
        return a.value > b.value ? 1 : -1;
      });

    let selectedCommitmentRecords: Array<SelectedCommitmentRecord> = [];

    let i = 0;
    let accumulatedAmount = 0n;

    while (i < sortedCommitments.length && accumulatedAmount < amount) {
      accumulatedAmount = 0n;
      selectedCommitmentRecords = [];
      for (let j = i; j < i + 3 && j < sortedCommitments.length; j++) {
        if (accumulatedAmount >= amount) {
          break;
        }
        accumulatedAmount += sortedCommitments[j].value;
        selectedCommitmentRecords.push(sortedCommitments[j]);
      }
      i++;
    }

    if (accumulatedAmount < amount) {
      return {
        selectedCommitmentRecords: [],
        totalAmount: 0n,
      };
    }

    return {
      selectedCommitmentRecords,
      totalAmount: accumulatedAmount,
    };
  }

  async reset() {
    await this._store.clear();
  }
}
