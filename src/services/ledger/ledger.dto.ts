import { Hash } from "viem";

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
  constructor(
    public readonly status: "spend" | "added",
    public readonly transactionHash: Hash,
    public readonly record: LedgerRecordDto,
  ) {}
}
