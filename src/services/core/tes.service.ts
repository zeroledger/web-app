import { Logger } from "@src/utils/logger";
import { deSerializeCommitment } from "@src/utils/vault/metadata";
import {
  Address,
  encodeAbiParameters,
  Hash,
  Hex,
  parseAbiParameters,
} from "viem";
import { AccountService } from "../ledger";
import { MemoryQueue } from "@src/services/core/queue";
import type { SignedMetaTransaction } from "@src/utils/metatx";
import { EvmClientService } from "./evmClient.service";

interface ChallengeResponse {
  random: Hex;
  expiration: number;
}

interface TepkResponse {
  tepk: Hex;
}

const AUTH_TOKEN_ABI = parseAbiParameters(
  "address authAddress,bytes authSignature,address ownerAddress,bytes delegationSignature",
);

export default class TesService {
  constructor(
    public readonly tesUrl: string,
    public readonly accountService: AccountService,
    public readonly evmClientService: EvmClientService,
    private readonly memoryQueue: MemoryQueue,
  ) {
    this.viewAccount = this.accountService.getViewAccount()!;
    this.mainAccountAddress =
      this.evmClientService.writeClient!.account.address;
    this.delegationSignature = this.accountService.getDelegationSignature()!;
  }

  private authToken?: Hex;
  private timeout = 0;
  private logger = new Logger(TesService.name);
  private viewAccount: NonNullable<
    ReturnType<AccountService["getViewAccount"]>
  >;
  private mainAccountAddress: Address;
  private delegationSignature: NonNullable<
    ReturnType<AccountService["getDelegationSignature"]>
  >;

  private async challenge() {
    this.logger.log("Run challenge for tes auth");
    const response = await fetch(
      `${this.tesUrl}/challenge/${this.viewAccount.address}`,
    );
    const { random, expiration } = (await response.json()) as ChallengeResponse;
    const authToken = await this.getAuthToken(random);
    this.logger.log(
      `Update auth token $(len: ${authToken.length}) with timeout ${expiration}`,
    );
    this.authToken = authToken;
    this.timeout = expiration;
  }

  private signChallenge(random: Hex) {
    return this.viewAccount.signMessage({
      message: random,
    });
  }

  async getAuthToken(random: Hex) {
    const token = encodeAbiParameters(AUTH_TOKEN_ABI, [
      this.viewAccount.address,
      await this.signChallenge(random),
      this.mainAccountAddress,
      this.delegationSignature,
    ]);
    return token;
  }

  private setAccessToken(headers: Headers) {
    headers.append("access_token", this.authToken!);
    return headers;
  }

  private manageAuth() {
    return this.memoryQueue.schedule("TesService.manageAuth", async () => {
      if (!this.authToken || this.timeout < Date.now()) {
        await this.challenge();
      }
    });
  }

  async getTrustedEncryptionToken() {
    await this.manageAuth();
    const response = await fetch(`${this.tesUrl}/encryption/tepk`, {
      headers: this.setAccessToken(new Headers()),
    });
    const { tepk } = (await response.json()) as TepkResponse;
    return tepk;
  }

  async decrypt(block: string, token: Address, poseidonHash: string) {
    await this.manageAuth();

    const requestData = {
      block,
      token,
      poseidonHash,
    };

    const response = await fetch(`${this.tesUrl}/encryption/decrypt`, {
      method: "POST",
      headers: this.setAccessToken(
        new Headers({ "Content-Type": "application/json" }),
      ),
      body: JSON.stringify(requestData),
    });

    return deSerializeCommitment((await response.json()).decryptedCommitment);
  }

  async syncWithTes(token: Address, fromBlock: string, toBlock: string) {
    try {
      await this.manageAuth();
      const response = await fetch(
        `${this.tesUrl}/indexer?owner=${this.mainAccountAddress}&token=${token}&fromBlock=${fromBlock}&toBlock=${toBlock}`,
        {
          headers: this.setAccessToken(new Headers()),
        },
      );
      const data: {
        events: {
          eventName: "CommitmentCreated" | "CommitmentRemoved";
          args: {
            owner: string;
            token: string;
            poseidonHash: string;
            metadata?: string;
          };
          blockNumber: string;
          transactionIndex: number;
          transactionHash: string;
        }[];
        syncedBlock: string;
      } = await response.json();

      return {
        syncedBlock: data.syncedBlock,
        events: data.events.map((event) => ({
          eventName: event.eventName,
          args: {
            ...event.args,
            poseidonHash: BigInt(event.args.poseidonHash),
          },
          blockNumber: BigInt(event.blockNumber),
          transactionIndex: event.transactionIndex,
          transactionHash: event.transactionHash as Hash,
        })),
      };
    } catch (error) {
      this.logger.error(error);
      return {
        syncedBlock: fromBlock,
        events: [],
      };
    }
  }

  async quote(token: Address) {
    const response = await fetch(`${this.tesUrl}/paymaster/quote/${token}`, {
      headers: this.setAccessToken(new Headers()),
    });

    const data = (await response.json()) as {
      gasPrice: string;
      paymasterAddress: Address;
    };
    return {
      gasPrice: BigInt(data.gasPrice),
      paymasterAddress: data.paymasterAddress,
    };
  }

  async executeMetaTransaction(
    metatx: SignedMetaTransaction,
    coveredGas: string,
  ) {
    console.log(`send metatx: ${JSON.stringify({ metatx, coveredGas })}`);
    return fetch(`${this.tesUrl}/paymaster/execute`, {
      method: "POST",
      headers: this.setAccessToken(
        new Headers({ "Content-Type": "application/json" }),
      ),
      body: JSON.stringify({ metatx, coveredGas }),
    });
  }

  reset() {
    delete this.authToken;
    this.timeout = 0;
  }
}
