import { Address, createPublicClient, http, PublicClient } from "viem";
import { ENV } from "@src/common.constants";
import { mainnet, sepolia } from "viem/chains";
import { normalize } from "viem/ens";

class Ens {
  private _client?: PublicClient;
  constructor() {}

  get client() {
    if (!this._client) {
      this._client = createPublicClient({
        chain: ENV === "test" ? sepolia : mainnet,
        transport: http(
          ENV === "test"
            ? "https://ethereum-sepolia-rpc.publicnode.com"
            : "https://ethereum-rpc.publicnode.com",
        ),
      });
    }
    return this._client;
  }

  async universalResolve(recipient: string) {
    if (recipient.startsWith("0x")) {
      return recipient as Address;
    } else {
      const ensAddress = await this.client.getEnsAddress({
        name: normalize(recipient),
      });
      if (!ensAddress) {
        throw new Error("Invalid ENS name");
      }
      return ensAddress as Address;
    }
  }
}

export const ens = new Ens();
