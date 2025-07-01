import { DataSource } from "../db/leveldb.service";
import { NoteRecord } from "./pryx.dto";
import { Hash } from "viem";

const lockEntityKey = {
  name: `pryx`,
};

export class PryxRecordsEntity {
  constructor(readonly dataSource: DataSource) {}

  async findOne(maskedNoteDigest: Hash): Promise<NoteRecord> {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    const data = (await store.get(maskedNoteDigest)) as string | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return JSON.parse(data) as NoteRecord;
  }

  async findMany(maskedNoteDigests: Hash[]): Promise<NoteRecord[]> {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    const data = (await store.getMany(maskedNoteDigests)) as
      | string[]
      | undefined;
    if (!data) {
      throw new Error("NOTE_NOT_FOUND");
    }
    return data.map((item) => JSON.parse(item) as NoteRecord);
  }

  async saveMany(items: { maskedNoteDigest: Hash; data: NoteRecord }[]) {
    const batch = items.map((item) => ({
      type: "put" as const,
      sublevel: this.dataSource.getEntityLevel(lockEntityKey),
      key: item.maskedNoteDigest,
      value: JSON.stringify(item.data),
    }));

    return this.dataSource.db.batch(batch);
  }

  async save(maskedNoteDigest: Hash, data: NoteRecord) {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    await store.put(maskedNoteDigest, JSON.stringify(data));
  }

  async delete(maskedNoteDigest: Hash) {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    await store.del(maskedNoteDigest);
  }

  async deleteMany(maskedNoteDigests: Hash[]) {
    const batch = maskedNoteDigests.map((maskedNoteDigest) => ({
      type: "del" as const,
      sublevel: this.dataSource.getEntityLevel(lockEntityKey),
      key: maskedNoteDigest,
    }));

    return this.dataSource.db.batch(batch);
  }

  async all() {
    const store = this.dataSource.getEntityLevel(lockEntityKey);
    const data = (await store.values().all()) as string[];
    return data.map((item) => JSON.parse(item) as NoteRecord);
  }

  async clear() {
    return this.dataSource.getEntityLevel(lockEntityKey).clear();
  }
}
