import { Hash, Hex, toHex } from "viem";

export class LedgerRecordDto {
  constructor(
    public readonly hash: BigIntString,
    public readonly value: BigIntString,
    public readonly sValue: BigIntString,
  ) {}

  static from(hash: bigint, value: bigint, sValue: bigint) {
    return new LedgerRecordDto(
      hash.toString(),
      value.toString(),
      sValue.toString(),
    );
  }

  static of(json: string) {
    const data = JSON.parse(json) as LedgerRecordDto;
    return new LedgerRecordDto(data.hash, data.value, data.sValue);
  }
}

export class HistoryRecordDto {
  public readonly id: Hex;
  constructor(
    public readonly status: "spend" | "added",
    public readonly transactionHash: Hash | null,
    public readonly record: LedgerRecordDto,
  ) {
    this.id = `${toHex(BigInt(this.record.hash))}:${status}`;
  }
}
