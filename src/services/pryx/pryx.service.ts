import { Hash, keccak256, toHex, type Address } from "viem";
import { PRYX_ABI } from "./pryx.abi";
import { format } from "@src/utils/common";
import { CustomClient } from "@src/common.types";

export class PryxService {
  private coordinatorRole = keccak256(toHex("coordinator"));
  constructor(
    private readonly client: CustomClient,
    public readonly contract: Address,
  ) {}

  async getDomainSeparator() {
    const separator = await this.client.readContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "DOMAIN_SEPARATOR",
      args: [],
    });
    return format(separator);
  }

  async getRoundTransactionOwner(roundTransactionRoot: Hash) {
    return this.client.readContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "getRoundTransactionOwner",
      args: [roundTransactionRoot],
    });
  }

  async isValidCoordinator(address: Address) {
    return this.client.readContract({
      address: this.contract,
      abi: PRYX_ABI,
      functionName: "hasRole",
      args: [this.coordinatorRole, address],
    });
  }
}
