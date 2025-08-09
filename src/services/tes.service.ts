import { Logger } from "@src/utils/logger";
import {
  deSerializeCommitment,
  serializeCommitment,
} from "@src/utils/vault/metadata";
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
import { AxiosInstance } from "axios";
import { catchService } from "@src/services/core/catch.service";
import { backOff } from "exponential-backoff";

const AUTH_TOKEN_ABI = parseAbiParameters(
  "address authAddress,bytes authSignature,address ownerAddress,bytes delegationSignature",
);

const backoffOptions = {
  numOfAttempts: 4,
};

export class TesService {
  constructor(
    public readonly tesUrl: string,
    public readonly viewAccountService: ViewAccountService,
    public readonly evmClientService: EvmClientService,
    private readonly memoryQueue: MemoryQueue,
    private readonly axios: AxiosInstance,
  ) {
    this.mainAccountAddress =
      this.evmClientService.writeClient!.account.address;
  }

  private timeout = 0;
  private logger = new Logger(TesService.name);
  private mainAccountAddress: Address;
  private csrf: string = "";

  private async challenge() {
    const {
      data: { random },
    } = await this.axios.get<{
      random: Hex;
    }>(
      `${this.tesUrl}/challenge/init/${this.viewAccountService.getViewAccount()!.address}`,
    );
    const authToken = await this.getAuthToken(random);
    this.logger.log(`Create auth token $(len: ${authToken.length})`);
    const {
      data: { exp, csrf },
    } = await this.axios.get<{
      exp: number;
      csrf: string;
    }>(`${this.tesUrl}/challenge/solve`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      withCredentials: true,
    });
    this.csrf = csrf;
    this.timeout = exp * 1000;
    this.logger.log(
      `Challenge resolved, timeout: ${new Date(this.timeout).toISOString()}`,
    );
  }

  private signChallenge(random: Hex) {
    return this.viewAccountService.getViewAccount()!.signMessage({
      message: random,
    });
  }

  private async getAuthToken(random: Hex) {
    const token = encodeAbiParameters(AUTH_TOKEN_ABI, [
      this.viewAccountService.getViewAccount()!.address,
      await this.signChallenge(random),
      this.mainAccountAddress,
      this.viewAccountService.getDelegationSignature()!,
    ]);
    return token;
  }

  private async manageAuth() {
    const [error] = await this.memoryQueue.schedule(
      TesService.name,
      async () => {
        if (this.timeout < Date.now() || !this.csrf) {
          await this.challenge();
        }
      },
      "manageAuth",
      2000,
    );
    if (error) {
      throw error;
    }
  }

  getTrustedEncryptionToken() {
    return backOff(async () => {
      await this.manageAuth();
      const { data } = await this.axios.get<{
        tepk: Hex;
      }>(`${this.tesUrl}/encryption/tepk`);
      return data.tepk;
    }, backoffOptions);
  }

  decrypt(block: string, token: Address, poseidonHash: string) {
    return backOff(async () => {
      await this.manageAuth();

      const requestData = {
        block,
        token,
        poseidonHash,
      };

      const response = await this.axios.post<{
        decryptedCommitment: ReturnType<typeof serializeCommitment>;
      }>(`${this.tesUrl}/encryption/decrypt`, requestData, {
        headers: {
          "Content-Type": "application/json",
          "x-custom-tes-csrf": this.csrf,
        },
        withCredentials: true,
      });

      return deSerializeCommitment(response.data.decryptedCommitment);
    }, backoffOptions);
  }

  async syncWithTes(token: Address, fromBlock: string, toBlock: string) {
    try {
      const result = await backOff(async () => {
        await this.manageAuth();

        this.logger.log(`syncing with TES from ${fromBlock} to ${toBlock}`);
        const { data } = await this.axios.get<{
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
        }>(
          `${this.tesUrl}/indexer?owner=${this.mainAccountAddress}&token=${token}&fromBlock=${fromBlock}&toBlock=${toBlock}`,
          {
            headers: {
              "x-custom-tes-csrf": this.csrf,
            },
            withCredentials: true,
          },
        );

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
      }, backoffOptions);

      return result;
    } catch {
      catchService.catch(new Error("Sync with TES failed"));
      return {
        syncedBlock: fromBlock,
        events: [],
      };
    }
  }

  async quote(token: Address) {
    return backOff(async () => {
      await this.manageAuth();
      const { data } = await this.axios.get<{
        gasPrice: string;
        paymasterAddress: Address;
      }>(`${this.tesUrl}/paymaster/quote/${token}`, {
        headers: {
          "x-custom-tes-csrf": this.csrf,
        },
        withCredentials: true,
      });

      return {
        gasPrice: BigInt(data.gasPrice),
        paymasterAddress: data.paymasterAddress,
      };
    }, backoffOptions);
  }

  async executeMetaTransaction(
    metatx: SignedMetaTransaction,
    coveredGas: string,
  ) {
    return backOff(async () => {
      await this.manageAuth();
      await this.axios.post(
        `${this.tesUrl}/paymaster/execute`,
        {
          metatx,
          coveredGas,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-custom-tes-csrf": this.csrf,
          },
          withCredentials: true,
        },
      );
    }, backoffOptions);
  }

  reset() {
    this.timeout = 0;
    this.csrf = "";
  }
}
