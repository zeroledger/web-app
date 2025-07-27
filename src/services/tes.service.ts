import { Logger } from "@src/utils/logger";
import { deSerializeCommitment } from "@src/utils/vault/metadata";
import {
  Address,
  encodeAbiParameters,
  Hash,
  Hex,
  parseAbiParameters,
} from "viem";
import { ViewAccountService } from "@src/services/viewAccount.service";
import { MemoryQueue } from "@src/services/core/queue";
import type { SignedMetaTransaction } from "@src/utils/metatx";
import { EvmClientService } from "@src/services/core/evmClient.service";

const AUTH_TOKEN_ABI = parseAbiParameters(
  "address authAddress,bytes authSignature,address ownerAddress,bytes delegationSignature",
);

export class TesService {
  constructor(
    public readonly tesUrl: string,
    public readonly viewAccountService: ViewAccountService,
    public readonly evmClientService: EvmClientService,
    private readonly memoryQueue: MemoryQueue,
  ) {
    this.mainAccountAddress =
      this.evmClientService.writeClient!.account.address;
  }

  private timeout = 0;
  private logger = new Logger(TesService.name);
  private mainAccountAddress: Address;
  private csrf: string = "";

  private async challenge() {
    this.logger.log("Run challenge for tes auth");
    const response = await fetch(
      `${this.tesUrl}/challenge/init/${this.viewAccountService.getViewAccount()!.address}`,
    );
    const { random } = (await response.json()) as {
      random: Hex;
    };
    const authToken = await this.getAuthToken(random);
    this.logger.log(`Create auth token $(len: ${authToken.length})`);
    const resolveResp = await fetch(`${this.tesUrl}/challenge/solve`, {
      headers: new Headers({
        authorization: `Bearer ${authToken}`,
      }),
      credentials: "include",
    });
    this.logger.log(`Challenge resolved`);
    const { exp, csrf } = (await resolveResp.json()) as {
      exp: number;
      csrf: string;
    };
    this.csrf = csrf;
    this.timeout = exp * 1000;
  }

  private signChallenge(random: Hex) {
    return this.viewAccountService.getViewAccount()!.signMessage({
      message: random,
    });
  }

  async getAuthToken(random: Hex) {
    const token = encodeAbiParameters(AUTH_TOKEN_ABI, [
      this.viewAccountService.getViewAccount()!.address,
      await this.signChallenge(random),
      this.mainAccountAddress,
      this.viewAccountService.getDelegationSignature()!,
    ]);
    return token;
  }

  private manageAuth() {
    return this.memoryQueue.schedule("TesService.manageAuth", async () => {
      if (this.timeout < Date.now() || !this.csrf) {
        await this.challenge();
      }
    });
  }

  async getTrustedEncryptionToken() {
    await this.manageAuth();
    const response = await fetch(`${this.tesUrl}/encryption/tepk`);
    const { tepk } = (await response.json()) as {
      tepk: Hex;
    };
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
      headers: new Headers({
        "Content-Type": "application/json",
        "x-custom-tes-csrf": this.csrf,
      }),
      body: JSON.stringify(requestData),
      credentials: "include",
    });

    return deSerializeCommitment((await response.json()).decryptedCommitment);
  }

  async syncWithTes(token: Address, fromBlock: string, toBlock: string) {
    try {
      await this.manageAuth();
      const response = await fetch(
        `${this.tesUrl}/indexer?owner=${this.mainAccountAddress}&token=${token}&fromBlock=${fromBlock}&toBlock=${toBlock}`,
        {
          headers: new Headers({ "x-custom-tes-csrf": this.csrf }),
          credentials: "include",
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
    await this.manageAuth();
    const response = await fetch(`${this.tesUrl}/paymaster/quote/${token}`, {
      headers: new Headers({ "x-custom-tes-csrf": this.csrf }),
      credentials: "include",
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
    await this.manageAuth();
    return fetch(`${this.tesUrl}/paymaster/execute`, {
      method: "POST",
      headers: new Headers({
        "Content-Type": "application/json",
        "x-custom-tes-csrf": this.csrf,
      }),
      credentials: "include",
      body: JSON.stringify({ metatx, coveredGas }),
    });
  }

  reset() {
    this.timeout = 0;
  }
}
