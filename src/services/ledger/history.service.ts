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
    public id: string,
    public data: HistoryRecordDto,
    public prevId?: string,
    public nextId?: string,
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

  async getHeadNode() {
    return this.getNode("headId");
  }

  async getTailNode() {
    return this.getNode("tailId");
  }

  async getNode(key: string) {
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
      this.getHeadNode(),
      this.getTailNode(),
    ]);

    const batch: Batch = [];

    // Case 1: Empty list (no head, no tail)
    if (!headNode && !tailNode) {
      console.log("Case 1: Empty list (no head, no tail)");
      batch.push({
        type: "put",
        key: "headId",
        value: node.stringify(),
      });
      batch.push({
        type: "put",
        key: "tailId",
        value: node.stringify(),
      });
    }
    // Case 2: Single node list (head and tail are the same)
    else if (headNode && tailNode && headNode.id === tailNode.id) {
      console.log("Case 2: Single node list (head and tail are the same)");
      // Update head node to point to new node
      headNode.nextId = node.id;
      node.prevId = headNode.id;

      batch.push({
        type: "put",
        key: "headId",
        value: headNode.stringify(),
      });
      batch.push({
        type: "put",
        key: headNode.id,
        value: headNode.stringify(),
      });
      batch.push({
        type: "put",
        key: "tailId",
        value: node.stringify(),
      });
    }
    // Case 3: Multiple nodes - add to end
    else if (headNode && tailNode) {
      console.log("Case 3: Multiple nodes - add to end");
      // Update current tail to point to new node
      tailNode.nextId = node.id;
      node.prevId = tailNode.id;

      batch.push({
        type: "put",
        key: tailNode.id,
        value: tailNode.stringify(),
      });
      batch.push({
        type: "put",
        key: "tailId",
        value: node.stringify(),
      });
    }

    console.log("Adding new node", node.id);
    // Always add the new node
    batch.push({
      type: "put",
      key: node.id,
      value: node.stringify(),
    });

    console.log("Batch", batch);

    await this._store.batch(batch);
    return true;
  }

  async clean() {
    await this._store.clear();
  }

  async has(id: string) {
    const source = await this._store.get(id);
    if (!source) {
      return false;
    }
    // Verify the node is part of the linked list by checking if it's reachable
    const head = await this.getHeadNode();
    if (!head) {
      return false;
    }

    let node: Node | undefined = head;
    while (node) {
      console.log("node.id", node.id);

      if (node.id === id) {
        return true;
      }
      console.log("node.nextId", node.nextId);
      node = node.nextId ? await this.getNode(node.nextId) : undefined;
    }
    return false;
  }

  async each(fn: (historyRecord: HistoryRecordDto) => Promise<void> | void) {
    /**
     * store to filter duplicated historyRecord of head and tail
     */
    const duplicates: Record<string, true> = {};

    const tail = await this.getTailNode();
    let node: Node | undefined = await this.getHeadNode();

    while (node) {
      if (!duplicates[node.id]) {
        await fn(node.data);
        duplicates[node.id] = true;
      }
      // Continue until we reach the tail node, then stop
      if (node.id === tail?.id) {
        break;
      }
      node = node.nextId ? await this.getNode(node.nextId) : undefined;
    }
  }

  async eachRevert(
    fn: (historyRecord: HistoryRecordDto) => Promise<void> | void,
  ) {
    /**
     * store to filter duplicated messages of head and tail
     */
    const duplicates: Record<string, true> = {};

    const head = await this.getHeadNode();
    let node: Node | undefined = await this.getTailNode();

    while (node) {
      if (!duplicates[node.id]) {
        await fn(node.data);
        duplicates[node.id] = true;
      }
      // Continue until we reach the head node, then stop
      if (node.id === head?.id) {
        break;
      }
      node = node.prevId ? await this.getNode(node.prevId) : undefined;
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
