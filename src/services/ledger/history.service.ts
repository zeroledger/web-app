import { type Hash } from "viem";
import { DataSource } from "@src/services/core/db/leveldb.service";
import { HistoryRecordDto } from "./ledger.dto";

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
    public id: Hash,
    public data: HistoryRecordDto,
    public prevId?: Hash,
    public nextId?: Hash,
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
    return this._getMessageNode("headId");
  }

  private async _getTailNode() {
    return this._getMessageNode("tailId");
  }

  private async _getMessageNode(key: string) {
    const source = await this._store.get(key);
    if (!source) {
      return;
    }
    return Node.of(source);
  }

  async addMessage(message: HistoryRecordDto) {
    const id = message.transactionHash;
    if (await this.has(id)) {
      return false;
    }
    const node = new Node(id, message);

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

  async cleanMessages() {
    await this._store.clear();
  }

  async has(transactionHash: Hash) {
    const source = await this._store.get(transactionHash);
    if (!source) {
      return false;
    }
    return true;
  }

  async each(fn: (msg: HistoryRecordDto) => Promise<void> | void) {
    /**
     * store to filter duplicated messages of head and tail
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
          ? await this._getMessageNode(node.nextId)
          : undefined;
    }
  }

  async eachRevert(fn: (msg: HistoryRecordDto) => Promise<void> | void) {
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
          ? await this._getMessageNode(node.prevId)
          : undefined;
    }
  }

  async all() {
    const historyRecords: HistoryRecordDto[] = [];
    await this.eachRevert((msg) => {
      historyRecords.push(msg);
    });
    return historyRecords;
  }

  async isEmpty() {
    const rawHeadNode = await this._store.get("headId");
    return !rawHeadNode;
  }
}
