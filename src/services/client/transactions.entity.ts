import { Address, Hex, type Hash } from "viem";
import { DataSource } from "../db/leveldb.service";

export const messageBusEntityKey = {
  name: `messages`,
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

abstract class TransactionDto {
  public readonly id: string;
  constructor() {
    this.id = crypto.randomUUID();
  }
}

export class IncomingTransactionDto extends TransactionDto {
  public readonly label = "Incoming Transaction" as const;
  constructor(
    public readonly from: Address,
    public readonly amount: Hex,
    public readonly date: number,
    public readonly txHash: Hash,
    public readonly maskedNoteDigest: Hash,
  ) {
    super();
  }
}

export class OutgoingTransactionDto extends TransactionDto {
  public readonly label = "Spend Transaction" as const;
  constructor(
    public readonly amount: Hex,
    public readonly date: number,
    public readonly txHash: Hash,
    public readonly recipient: Address,
    public readonly spentMaskedNoteDigests: Hash[],
    public readonly sendMaskedNoteDigest: Hash,
    public readonly changeMaskedNoteDigest?: Hash,
  ) {
    super();
  }
}

export class DepositTransactionDto extends TransactionDto {
  public readonly label = "Deposit Transaction" as const;
  constructor(
    public readonly amount: Hex,
    public readonly date: number,
    public readonly txHash: Hash,
    public readonly maskedNoteDigest: Hash,
  ) {
    super();
  }
}

export class WithdrawTransactionDto extends TransactionDto {
  public readonly label = "Withdraw Transaction" as const;
  constructor(
    public readonly amount: Hex,
    public readonly date: number,
    public readonly txHash: Hash,
    public readonly maskedNoteDigest: Hash,
  ) {
    super();
  }
}

export type Transaction =
  | IncomingTransactionDto
  | OutgoingTransactionDto
  | DepositTransactionDto
  | WithdrawTransactionDto;

export class Node {
  constructor(
    public id: string,
    public data: Transaction,
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

export class TransactionsEntity {
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

  private async _getMessageNode(transactionId: string) {
    const source = await this._store.get(transactionId);
    if (!source) {
      return;
    }
    return Node.of(source);
  }

  async addMessage(message: Transaction) {
    const id = message.id;
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

  async has(messageId: string) {
    const source = await this._store.get(messageId);
    if (!source) {
      return false;
    }
    return true;
  }

  async each(fn: (msg: Transaction) => Promise<void> | void) {
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

  async eachRevert(fn: (msg: Transaction) => Promise<void> | void) {
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
    const transactions: Transaction[] = [];
    await this.eachRevert((msg) => {
      transactions.push(msg);
    });
    return transactions;
  }

  async isEmpty() {
    const rawHeadNode = await this._store.get("headId");
    return !rawHeadNode;
  }
}
