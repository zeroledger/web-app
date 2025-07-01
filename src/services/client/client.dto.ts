import type { Hash, Hex, Address, TransactionSerializedLegacy } from "viem";
import type { SignMessageReturnType } from "viem/accounts";
import { NoteDto } from "../pryx/pryx.dto";

export type RecipientConfig = {
  value: Hex;
  recipient: Address;
  factor: number;
};

export type RecipientsConfig = RecipientConfig[];

export type SpendingConfig = { maskedNoteDigest: Hash; secret: Hash }[];

export class NewNoteRequestDto {
  constructor(public readonly recipientsConfig: RecipientsConfig) {}
}

export class SpendingRequestDto {
  constructor(
    public readonly spendingConfig: SpendingConfig,
    public readonly recipientsConfig: RecipientsConfig,
    public readonly recipientsConfigSignature: Hex,
  ) {}
}

export class DelegatedDepositDto {
  constructor(
    public readonly depositor: Address,
    public readonly maskedNoteDigest: Hash,
    public readonly deadline: Hex,
    public readonly permit: Hex,
    public readonly signedLock: Hex,
  ) {}
}

export class ForfeitRequestDto {
  constructor(
    public readonly forfeits: {
      maskedNoteDigest: Hash;
      forfeitSignature: SignMessageReturnType;
    }[],
  ) {}
}

export class CollaborativeRedemptionDto {
  constructor(
    public readonly maskedNoteDigest: Hash,
    public readonly signature: Hex,
    public readonly secret: Hash,
  ) {}
}

export type ChallengeResponse = {
  random: Hex;
};

export type CompactConfirmation = Readonly<{
  maskedNoteDigest: Hash;
  note: ReturnType<NoteDto["stringify"]>;
  notesRoot: Hash;
  noteProof: Hash[];
  txHash: Hash;
  roundDeposit: Hex;
}>;

export type Confirmation = CompactConfirmation &
  Readonly<{
    tx:
      | `0x02${string}`
      | `0x01${string}`
      | `0x03${string}`
      | `0x04${string}`
      | TransactionSerializedLegacy;
    coordinator: Address;
  }>;

export class NotifyMessageDto implements CompactConfirmation {
  constructor(
    public readonly note: ReturnType<NoteDto["stringify"]>,
    public readonly maskedNoteDigest: Hash,
    public readonly notesRoot: Hash,
    public readonly noteProof: Hash[],
    public readonly txHash: Hash,
    public readonly coordinatorSecret: Secret,
    public readonly roundDeposit: Hex,
    public readonly sender: Address,
  ) {}
}

export class FaucetRequestDto {
  constructor(
    public readonly token: Address,
    public readonly recipient?: Address,
    public readonly ercAmount?: string,
    public readonly nativeAmount?: string,
  ) {}
}

export type NotifyMessages = NotifyMessageDto[];

export type CoordinatorRpc = {
  requestDeposit(
    params: NewNoteRequestDto,
    headers?: object,
  ): Promise<Confirmation[]>;

  deposit(params: DelegatedDepositDto, headers?: object): Promise<Secret>;

  requestSpend(
    params: SpendingRequestDto,
    headers?: object,
  ): Promise<Confirmation[]>;

  forfeit(params: ForfeitRequestDto, headers?: object): Promise<Secret>;

  collaborativeRedemption(
    params: CollaborativeRedemptionDto,
    headers?: object,
  ): Promise<Hash>;
};

export type FaucetRpc = {
  obtainTestTokens(params: FaucetRequestDto, headers?: object): Promise<Hash>;
};
