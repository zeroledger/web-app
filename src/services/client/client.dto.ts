import type { Address, Hash } from "viem";

export type FaucetRpc = {
  obtainTestTokens(params: FaucetRequestDto, headers?: object): Promise<Hash>;
};

export class FaucetRequestDto {
  constructor(
    public readonly token: Address,
    public readonly recipient?: Address,
    public readonly ercAmount?: string,
    public readonly nativeAmount?: string,
  ) {}
}
