import { DataSource } from "../db/leveldb.service";

export class DecoyRecordDto {
  constructor(
    public readonly hash: BigIntString,
    public readonly value: BigIntString,
    public readonly entropy: BigIntString,
  ) {}
}

const lockEntityKey = {
  name: `decoy`,
};

export class DecoyRecordsEntity {
  constructor(readonly dataSource: DataSource) {}

  async findOne(hash: BigIntString): Promise<DecoyRecordDto> {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    const data = (await store.get(hash)) as string | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return JSON.parse(data) as DecoyRecordDto;
  }

  async findMany(hashes: BigIntString[]): Promise<DecoyRecordDto[]> {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    const data = (await store.getMany(hashes)) as string[] | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return data.map((item) => JSON.parse(item) as DecoyRecordDto);
  }

  async saveMany(items: DecoyRecordDto[]) {
    const batch = items.map((item) => ({
      type: "put" as const,
      sublevel: this.dataSource.getEntityLevel(lockEntityKey),
      key: item.hash,
      value: JSON.stringify(item),
    }));

    return this.dataSource.db.batch(batch);
  }

  async save(data: DecoyRecordDto) {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    await store.put(data.hash, JSON.stringify(data));
  }

  async delete(hash: BigIntString) {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    await store.del(hash);
  }

  async deleteMany(hashes: BigIntString[]) {
    const batch = hashes.map((hash) => ({
      type: "del" as const,
      sublevel: this.dataSource.getEntityLevel(lockEntityKey),
      key: hash,
    }));

    return this.dataSource.db.batch(batch);
  }

  async all() {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    const data = (await store.values().all()) as string[];
    return data.map((item) => JSON.parse(item) as DecoyRecordDto);
  }

  async clear() {
    return this.dataSource.getEntityLevel(lockEntityKey).clear();
  }
}
