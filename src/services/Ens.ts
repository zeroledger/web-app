import { createPublicClient, http, PublicClient } from "viem";
import { ENV } from "@src/common.constants";
import { mainnet, sepolia } from "viem/chains";

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
}

export const ens = new Ens();
