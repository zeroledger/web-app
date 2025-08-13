import { type DataSource } from "@src/services/core/db/leveldb.source";
import { HistoryRecordDto } from "./ledger.dto";
import { compareEvents } from "@src/utils/events";
import { Address } from "viem";

export const HistoryNodesEntityKey = (address: Address) => ({
  name: `history_nodes-${address}`,
});

export const HistoryPointersEntityKey = (address: Address) => ({
  name: `history_pointers-${address}`,
});

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

export default class CommitmentsHistory {
  constructor(
    public readonly dataSource: DataSource,
    readonly address: Address,
  ) {
    this._store = this.dataSource.getEntityLevel(
      HistoryNodesEntityKey(address),
    );
    this._pointersStore = this.dataSource.getEntityLevel(
      HistoryPointersEntityKey(address),
    );
  }

  private _store: ReturnType<DataSource["getEntityLevel"]>;
  private _pointersStore: ReturnType<DataSource["getEntityLevel"]>;

  private async _getPointers() {
    const source = await this._pointersStore.get("pointers");
    if (!source) {
      return { headId: null, tailId: null };
    }
    return JSON.parse(source);
  }

  private async _setPointers(headId: string | null, tailId: string | null) {
    await this._pointersStore.put(
      "pointers",
      JSON.stringify({ headId, tailId }),
    );
  }

  async getHeadNode() {
    const pointers = await this._getPointers();
    if (!pointers.headId) {
      return undefined;
    }
    return this.getNode(pointers.headId);
  }

  async getTailNode() {
    const pointers = await this._getPointers();
    if (!pointers.tailId) {
      return undefined;
    }
    return this.getNode(pointers.tailId);
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
      batch.push({
        type: "put",
        key: node.id,
        value: node.stringify(),
      });
      await this._setPointers(node.id, node.id);
    }
    // Case 2: Single node list (head and tail are the same)
    else if (headNode && tailNode && headNode.id === tailNode.id) {
      const comparison = compareEvents(historyRecord, headNode.data);

      if (comparison >= 0) {
        // Insert before head (new head)
        node.nextId = headNode.id;
        headNode.prevId = node.id;

        batch.push({
          type: "put",
          key: node.id,
          value: node.stringify(),
        });
        batch.push({
          type: "put",
          key: headNode.id,
          value: headNode.stringify(),
        });
        await this._setPointers(node.id, headNode.id);
      } else {
        // Insert after head (new tail)
        headNode.nextId = node.id;
        node.prevId = headNode.id;

        batch.push({
          type: "put",
          key: headNode.id,
          value: headNode.stringify(),
        });
        batch.push({
          type: "put",
          key: node.id,
          value: node.stringify(),
        });
        await this._setPointers(headNode.id, node.id);
      }
    }
    // Case 3: Multiple nodes - find correct insertion point
    else if (headNode && tailNode) {
      const headComparison = compareEvents(historyRecord, headNode.data);
      const tailComparison = compareEvents(historyRecord, tailNode.data);

      // Insert at head
      if (headComparison >= 0) {
        node.nextId = headNode.id;
        headNode.prevId = node.id;

        batch.push({
          type: "put",
          key: node.id,
          value: node.stringify(),
        });
        batch.push({
          type: "put",
          key: headNode.id,
          value: headNode.stringify(),
        });
        await this._setPointers(node.id, tailNode.id);
      }
      // Insert at tail
      else if (tailComparison < 0) {
        tailNode.nextId = node.id;
        node.prevId = tailNode.id;

        batch.push({
          type: "put",
          key: tailNode.id,
          value: tailNode.stringify(),
        });
        batch.push({
          type: "put",
          key: node.id,
          value: node.stringify(),
        });
        await this._setPointers(headNode.id, node.id);
      }
      // Insert in middle
      else {
        let currentNode = headNode;
        let nextNode = currentNode.nextId
          ? await this.getNode(currentNode.nextId)
          : undefined;

        // Find the correct position
        while (nextNode && compareEvents(historyRecord, nextNode.data) < 0) {
          currentNode = nextNode;
          nextNode = currentNode.nextId
            ? await this.getNode(currentNode.nextId)
            : undefined;
        }

        // Insert between currentNode and nextNode
        node.prevId = currentNode.id;
        node.nextId = nextNode?.id;
        currentNode.nextId = node.id;
        if (nextNode) {
          nextNode.prevId = node.id;
          batch.push({
            type: "put",
            key: nextNode.id,
            value: nextNode.stringify(),
          });
        }

        batch.push({
          type: "put",
          key: currentNode.id,
          value: currentNode.stringify(),
        });
        batch.push({
          type: "put",
          key: node.id,
          value: node.stringify(),
        });
        // Pointers remain the same for middle insertion
      }
    }

    await this._store.batch(batch);
    return true;
  }

  async clean() {
    await this._store.clear();
    await this._pointersStore.clear();
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
      if (node.id === id) {
        return true;
      }
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
    const pointers = await this._getPointers();
    return !pointers.headId;
  }

  async reset() {
    await this._store.clear();
    await this._pointersStore.clear();
  }
}
