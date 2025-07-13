import { DataSource } from "@src/services/core/db/leveldb.service";
import { HistoryRecordDto } from "./ledger.dto";
import { Hex } from "viem";

export const messageBusEntityKey = {
  name: `commitments_history`,
};

type Batch = (
  | {
      type: "del";
      key: string;
    }
  | {
      type: "put";
      key: string;
      value: string;
    }
)[];

export class Node {
  constructor(
    public id: Hex,
    public data: HistoryRecordDto,
    public prevId?: Hex,
    public nextId?: Hex,
  ) {}

  stringify() {
    return JSON.stringify(this);
  }

  static of(data: string) {
    const parsed = JSON.parse(data);
    return new Node(parsed.id, parsed.data, parsed.prevId, parsed.nextId);
  }
}

export default class CommitmentsHistoryService {
  constructor(public readonly dataSource: DataSource) {
    this._store = this.dataSource.getEntityLevel(messageBusEntityKey);
  }

  private _store: ReturnType<DataSource["getEntityLevel"]>;

  private async _getHeadNode() {
    return this._getNode("headId");
  }

  private async _getTailNode() {
    return this._getNode("tailId");
  }

  private async _getNode(key: string) {
    const source = await this._store.get(key);
    if (!source) {
      return;
    }
    return Node.of(source);
  }

  async add(historyRecord: HistoryRecordDto) {
    const id = historyRecord.id;
    if (await this.has(id)) {
      return false;
    }
    const node = new Node(id, historyRecord);

    const [headNode, tailNode] = await Promise.all([
      this._getHeadNode(),
      this._getTailNode(),
    ]);

    const batch: Batch = [];
    if (!headNode) {
      batch.push({
        type: "put",
        key: "headId",
        value: node.stringify(),
      });
    }
    if (tailNode && headNode && tailNode.prevId === undefined) {
      headNode.nextId = node.id;

      node.prevId = headNode.id;

      batch.push({
        type: "put",
        key: "headId",
        value: headNode.stringify(),
      });
    }
    if (tailNode) {
      tailNode.nextId = node.id;

      node.prevId = tailNode.id;

      batch.push({
        type: "put",
        key: tailNode.id,
        value: tailNode.stringify(),
      });
    }
    batch.push({
      type: "put",
      key: "tailId",
      value: node.stringify(),
    });
    batch.push({
      type: "put",
      key: node.id,
      value: node.stringify(),
    });
    await this._store.batch(batch);
    return true;
  }

  async clean() {
    await this._store.clear();
  }

  async has(id: Hex) {
    const source = await this._store.get(id);
    if (!source) {
      return false;
    }
    return true;
  }

  async each(fn: (historyRecord: HistoryRecordDto) => Promise<void> | void) {
    /**
     * store to filter duplicated historyRecord of head and tail
     */
    const duplicates: Record<string, true> = {};

    const tail = await this._getTailNode();
    let node = await this._getHeadNode();

    while (node) {
      if (!duplicates[node.id]) {
        await fn(node.data);
        duplicates[node.id] = true;
      }
      node =
        node.nextId && node.id != tail?.id
          ? await this._getNode(node.nextId)
          : undefined;
    }
  }

  async eachRevert(
    fn: (historyRecord: HistoryRecordDto) => Promise<void> | void,
  ) {
    /**
     * store to filter duplicated messages of head and tail
     */
    const duplicates: Record<string, true> = {};

    const head = await this._getHeadNode();
    let node = await this._getTailNode();

    while (node) {
      if (!duplicates[node.id]) {
        await fn(node.data);
        duplicates[node.id] = true;
      }
      node =
        node.prevId && node.id != head?.id
          ? await this._getNode(node.prevId)
          : undefined;
    }
  }

  async all() {
    const historyRecords: HistoryRecordDto[] = [];
    await this.eachRevert((historyRecord) => {
      historyRecords.push(historyRecord);
    });
    return historyRecords;
  }

  async isEmpty() {
    const rawHeadNode = await this._store.get("headId");
    return !rawHeadNode;
  }
}
