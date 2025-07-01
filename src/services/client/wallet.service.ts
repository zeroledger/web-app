import {
  Address,
  decodeFunctionData,
  encodeAbiParameters,
  getAddress,
  Hash,
  Hex,
  hexToBigInt,
  keccak256,
  parseTransaction,
  recoverTransactionAddress,
  toHex,
  zeroAddress,
} from "viem";
import {
  Confirmation,
  CoordinatorRpc,
  NotifyMessages,
  DelegatedDepositDto,
  ForfeitRequestDto,
  NewNoteRequestDto,
  RecipientsConfig,
  SpendingConfig,
  SpendingRequestDto,
  NotifyMessageDto,
  CollaborativeRedemptionDto,
  FaucetRpc,
  FaucetRequestDto,
  CompactConfirmation,
} from "../client/client.dto";
import { PryxService } from "../pryx/pryx.service";
import { PryxRecordsEntity } from "../pryx/pryx.entity";

import { SimpleMerkleTree } from "@openzeppelin/merkle-tree";
import { metadata, signPermit } from "@src/utils/erc20";
import { JsonRpcClient, ServiceClient } from "../rpc";
import { CustomClient } from "@src/common.types";
import { Logger } from "@src/utils/logger";
import { logStringify } from "@src/utils/common";
import {
  NoteDto,
  ForfeitNote,
  NoteRecord,
  CommitParams,
  MaskedNoteDto,
} from "../pryx/pryx.dto";
import {
  computeRoundTransactionRoot,
  validateNoteLockSecret,
} from "../pryx/pryx.utils";
import { PRYX_ABI, REDEEM_ABI } from "../pryx/pryx.abi";
import {
  TransactionsEntity,
  IncomingTransactionDto,
  OutgoingTransactionDto,
  WithdrawTransactionDto,
  DepositTransactionDto,
} from "./transactions.entity";
import { MemoryQueue } from "../queue";

export const OFFCHAIN_SPENDING_ABI = [
  {
    components: [
      {
        name: "value",
        type: "uint240",
      },
      {
        name: "recipient",
        type: "address",
      },
      {
        name: "factor",
        type: "uint8",
      },
    ],
    internalType: "struct RecipientConfig[]",
    name: "config",
    type: "tuple[]",
  },
];

export class WalletService {
  private readonly address: Address;
  private rpc: ServiceClient<CoordinatorRpc>;
  private logger = new Logger("WalletService");
  constructor(
    private readonly client: CustomClient,
    private readonly contract: Address,
    private readonly token: Address,
    private readonly coordinatorUrl: string,
    private readonly pryxService: PryxService,
    private readonly recordsEntity: PryxRecordsEntity,
    private readonly coordinatorRpcClient: JsonRpcClient<CoordinatorRpc>,
    private readonly transactionsEntity: TransactionsEntity,
    private readonly queue: MemoryQueue,
  ) {
    this.address = this.client.account.address;
    this.rpc = this.coordinatorRpcClient.getService(this.coordinatorUrl);
  }

  private async enqueue<T>(fn: () => Promise<T>) {
    const [err, result] = await this.queue.schedule("walletService", fn);
    if (err) {
      throw err;
    }
    return result;
  }

  process(messages: NotifyMessages) {
    return this.enqueue(async () => {
      await this.recordsEntity.saveMany(
        await Promise.all(
          messages.map((message) => {
            const note = NoteDto.of(message.note);
            const maskedNoteDigest = note.mask().digest();
            this.validateNoteOwnership(message);
            this.validateConfirmation(message, message.note.value);
            return {
              maskedNoteDigest,
              data: new NoteRecord(
                message.note,
                maskedNoteDigest,
                message.coordinatorSecret,
                message.noteProof,
                message.notesRoot,
                message.roundDeposit,
              ),
            };
          }),
        ),
      );
      await Promise.all(
        messages.map((message) =>
          this.transactionsEntity.addMessage(
            new IncomingTransactionDto(
              message.note.owner,
              message.note.value,
              Date.now(),
              message.txHash,
              message.maskedNoteDigest,
            ),
          ),
        ),
      );
    });
  }

  async getBalance() {
    const records = await this.recordsEntity.all();
    this.logger.log(`All records: ${logStringify(records)}`);
    return records.reduce((acc, record) => {
      return acc + hexToBigInt(record.note.value);
    }, 0n);
  }

  private validateNoteOwnership(
    confirmation: CompactConfirmation,
    owner?: Address,
  ) {
    if (confirmation.note.owner !== (owner ?? this.address)) {
      throw new Error("WRONG_NOTE_OWNER");
    }
  }

  private async validateRoundTransactionCoordinator(
    roundTransactionRoot: Hash,
  ) {
    const roundTransactionOwner =
      await this.pryxService.getRoundTransactionOwner(roundTransactionRoot);

    if (roundTransactionOwner === zeroAddress) {
      throw new Error("INVALID_ROUND_TRANSACTION_ROOT");
    }
  }

  private async validateConfirmation(
    confirmation: Confirmation | CompactConfirmation,
    valueHex: Hex,
    { softValidation } = { softValidation: false },
  ) {
    if (confirmation.note.value !== valueHex) {
      throw new Error("INVALID_NOTE_VALUE");
    }

    const note = NoteDto.of(confirmation.note);
    const maskedNoteDigest = note.mask().digest();

    const isNoteIncluded = SimpleMerkleTree.verify(
      confirmation.notesRoot,
      maskedNoteDigest,
      confirmation.noteProof,
    );

    if (!isNoteIncluded) {
      throw new Error("INVALID_NOTES_PROOF");
    }

    const separator = await this.pryxService.getDomainSeparator();

    const roundTransactionRoot = computeRoundTransactionRoot(
      separator,
      confirmation.notesRoot,
      this.token,
    );

    const fullValidation = !softValidation || !("tx" in confirmation);

    const receipt = await this.client
      .getTransactionReceipt({
        hash: confirmation.txHash,
      })
      .catch(() => undefined);

    if (receipt) {
      await this.validateRoundTransactionCoordinator(roundTransactionRoot);
    } else if (fullValidation) {
      await this.client.waitForTransactionReceipt({
        hash: confirmation.txHash,
        confirmations: 1,
      });

      await this.validateRoundTransactionCoordinator(roundTransactionRoot);
    } else {
      const coordinatorAddress = await recoverTransactionAddress({
        serializedTransaction: confirmation.tx,
      });

      if (
        confirmation.coordinator !== coordinatorAddress ||
        !(await this.pryxService.isValidCoordinator(coordinatorAddress))
      ) {
        throw new Error("WRONG_TRANSACTION_COORDINATOR");
      }

      const dTransaction = parseTransaction(confirmation.tx);

      const { functionName, args } = decodeFunctionData({
        abi: PRYX_ABI,
        data: dTransaction.data!,
      });

      const param = args[0] as CommitParams;
      const extractedMaskedNotes = param.notes.map(
        (note) => new MaskedNoteDto(note.mask, note.value),
      );

      const tree = SimpleMerkleTree.of(
        extractedMaskedNotes.map((note) => note.digest()),
      );

      if (tree.root !== confirmation.notesRoot) {
        throw new Error("WRONG_SOFT_COMMIT_ROOT");
      }

      if (param.token !== this.token) {
        throw new Error("WRONG_SOFT_COMMIT_TOKEN");
      }

      if (functionName !== "commit") {
        throw new Error("WRONG_SOFT_COMMIT_METHOD");
      }

      const [, balance] = await metadata({
        tokenAddress: this.token,
        client: this.client,
        address: confirmation.coordinator,
      });

      if (
        balance <
        extractedMaskedNotes.reduce((acc, note) => acc + note.value, 0n)
      ) {
        throw new Error("WRONG_SOFT_COMMIT_METHOD");
      }
    }

    return { note, maskedNoteDigest };
  }

  private async validateAndPrepareDeposit(
    note: NoteDto,
    maskedNoteDigest: Hash,
  ) {
    const depositPermitDeadline = BigInt(
      Math.round(Date.now() / 1000) + 10 * 60,
    );

    const permit = await signPermit({
      contractAddress: this.token,
      spenderAddress: this.contract,
      value: note.value,
      deadline: depositPermitDeadline,
      client: this.client,
    });

    return new DelegatedDepositDto(
      this.address,
      maskedNoteDigest,
      toHex(depositPermitDeadline),
      permit,
      await this.client.signMessage({
        message: {
          raw: note.hashLock,
        },
      }),
    );
  }

  private requestDepositParams(depositValueHex: Hex) {
    return new NewNoteRequestDto([
      {
        value: depositValueHex,
        recipient: this.address,
        factor: 0,
      },
    ]);
  }

  deposit(value: bigint) {
    return this.enqueue(async () => {
      const depositValueHex = toHex(value);
      const [confirmation] = await this.rpc.requestDeposit(
        this.requestDepositParams(depositValueHex),
      );

      this.logger.log(
        `Deposit confirmation: ${JSON.stringify(confirmation, null, 2)}`,
      );

      this.validateNoteOwnership(confirmation);

      console.log("validateConfirmation");
      const { note, maskedNoteDigest } = await this.validateConfirmation(
        confirmation,
        depositValueHex,
      );

      console.log("validateAndPrepareDeposit");
      const depositParams = await this.validateAndPrepareDeposit(
        note,
        maskedNoteDigest,
      );

      console.log("deposit");
      const secret = await this.rpc.deposit(depositParams);

      const isValid = validateNoteLockSecret(note.hashLock, secret);

      console.log("isValid", isValid);
      if (isValid) {
        console.log("save");
        await this.recordsEntity.save(
          maskedNoteDigest,
          new NoteRecord(
            confirmation.note,
            maskedNoteDigest,
            secret,
            confirmation.noteProof,
            confirmation.notesRoot,
            confirmation.roundDeposit,
          ),
        );
        console.log("addMessage");
        await this.transactionsEntity.addMessage(
          new DepositTransactionDto(
            confirmation.note.value,
            Date.now(),
            confirmation.txHash,
            maskedNoteDigest,
          ),
        );
      } else {
        throw new Error("Note secret is not valid");

        /**
         * @todo
         * 1. listen for onchain deposit withdrawal to obtain secret (from event)
         * 2. schedule deposit withdrawal
         */
      }

      return isValid;
    });
  }

  send(value: bigint, recipient_: Address) {
    return this.enqueue(async () => {
      const recipient = getAddress(recipient_);
      const records = await this.recordsEntity.all();

      const spendingConfig: SpendingConfig = [];
      const recipientConfig: RecipientsConfig = [
        { value: toHex(value), recipient, factor: 0 },
      ];
      const spendingNotes: NoteDto[] = [];
      const spendMaskedNoteDigests: Hash[] = [];

      let i = 0;
      let totalValue = 0n;

      while (totalValue < value && i < records.length) {
        const record = records[i];
        const note = NoteDto.of(record.note);
        const maskedNoteDigest = note.mask().digest();
        totalValue += note.value;
        spendingConfig.push({
          maskedNoteDigest,
          secret: record.coordinatorSecret,
        });
        spendingNotes.push(note);
        spendMaskedNoteDigests.push(maskedNoteDigest);
        if (totalValue > value) {
          recipientConfig.push({
            value: toHex(totalValue - value),
            recipient: this.address,
            factor: 0,
          });
        }
        i++;
      }

      if (totalValue < value) {
        throw new Error("NOT_ENOUGH_BALANCE");
      }

      const spendConfirmations: Confirmation[] = await this.rpc.requestSpend(
        new SpendingRequestDto(
          spendingConfig,
          recipientConfig,
          await this.client.signMessage({
            message: {
              raw: keccak256(
                encodeAbiParameters(OFFCHAIN_SPENDING_ABI, [recipientConfig]),
              ),
            },
          }),
        ),
      );

      this.logger.log(
        `Spend confirmations: ${JSON.stringify(spendConfirmations, null, 2)}`,
      );

      const lock = spendConfirmations[0].note.hashLock;

      if (spendConfirmations.some((conf) => conf.note.hashLock !== lock)) {
        throw new Error("COORDINATOR_INCONSISTENT_LOCKS");
      }

      const spendConfirmationsMap = spendConfirmations.reduce(
        (acc, confirmation) => {
          acc[confirmation.note.owner] = confirmation;
          return acc;
        },
        {} as Record<Address, Confirmation>,
      );

      const spendNotesData = await Promise.all(
        recipientConfig.map(async ({ recipient, value }) => {
          const confirmation = spendConfirmationsMap[recipient];
          this.validateNoteOwnership(confirmation, recipient);
          return this.validateConfirmation(confirmation, value, {
            softValidation: true,
          });
        }),
      );

      this.logger.log(`Forfeit notes`);

      const secret = await this.rpc.forfeit(
        new ForfeitRequestDto(
          await Promise.all(
            spendingNotes.map(async (note, index) => {
              const forfeitNote = new ForfeitNote(note.digest(), lock);
              return {
                maskedNoteDigest: spendMaskedNoteDigests[index],
                forfeitSignature: await this.client.signMessage({
                  message: { raw: forfeitNote.digest() },
                }),
              };
            }),
          ),
        ),
      );

      const isValid = validateNoteLockSecret(lock, secret);

      if (isValid) {
        setTimeout(async () => {
          this.logger.log(`Update records`);
          await this.recordsEntity.saveMany(
            spendConfirmations
              .map((confirmation, index) => ({
                maskedNoteDigest: spendNotesData[index].maskedNoteDigest,
                data: new NoteRecord(
                  confirmation.note,
                  spendNotesData[index].maskedNoteDigest,
                  secret,
                  confirmation.noteProof,
                  confirmation.notesRoot,
                  confirmation.roundDeposit,
                ),
              }))
              .filter(({ data }) => data.note.owner === this.address),
          );
          await this.recordsEntity.deleteMany(spendMaskedNoteDigests);
        }, 0);

        const recipientConfirmation = spendConfirmations.find(
          (confirmation) => confirmation.note.owner === recipient,
        )!;

        const changeNote = spendConfirmations.find(
          (confirmation) => confirmation.note.owner !== recipient,
        );

        setTimeout(async () => {
          this.logger.log(`Adding message`);
          await this.transactionsEntity.addMessage(
            new OutgoingTransactionDto(
              recipientConfirmation.note.value,
              Date.now(),
              recipientConfirmation.txHash,
              recipient,
              spendMaskedNoteDigests,
              recipientConfirmation.maskedNoteDigest,
              changeNote?.maskedNoteDigest,
            ),
          );
        }, 0);

        return new NotifyMessageDto(
          recipientConfirmation.note,
          recipientConfirmation.maskedNoteDigest,
          recipientConfirmation.notesRoot,
          recipientConfirmation.noteProof,
          recipientConfirmation.txHash,
          secret,
          recipientConfirmation.roundDeposit,
          this.address,
        );
      } else {
        throw new Error("Notes secret is not valid");
        /**
         * @todo
         * 1. initiate withdrawal of spendingNotes.
         * 2. subscribe on proof event, and read secret from lock
         * 3. send info to recipient and withdraw note
         */
      }
    });
  }

  collaborativeWithdraw() {
    return this.enqueue(async () => {
      const records = await this.recordsEntity.all();

      this.logger.log(`Withdraw ${logStringify(records)}`);

      await Promise.all(
        records.map(async (record) => {
          await this.recordsEntity.delete(record.maskedNoteDigest);
          const response = await this.rpc
            .collaborativeRedemption(
              new CollaborativeRedemptionDto(
                record.maskedNoteDigest,
                await this.client.signMessage({
                  message: {
                    raw: keccak256(
                      encodeAbiParameters(REDEEM_ABI, [
                        record.maskedNoteDigest,
                        this.token,
                      ]),
                    ),
                  },
                }),
                record.coordinatorSecret,
              ),
            )
            .catch(async (e) => {
              await this.recordsEntity.save(record.maskedNoteDigest, record);
              throw e;
            });
          await this.transactionsEntity.addMessage(
            new WithdrawTransactionDto(
              record.note.value,
              Date.now(),
              response,
              record.maskedNoteDigest,
            ),
          );
        }),
      );
      /**
       * @todo
       * validate onchain balances before and after,
       * if not as expected - initiate force redemption
       */
    });
  }

  async faucet(amount: string) {
    const faucetRpc = (
      this.coordinatorRpcClient as unknown as JsonRpcClient<FaucetRpc>
    ).getService(this.coordinatorUrl, { namespace: "faucet" });
    return this.enqueue(() =>
      faucetRpc.obtainTestTokens(
        new FaucetRequestDto(this.token, this.address, amount, "0"),
      ),
    );
  }
}
