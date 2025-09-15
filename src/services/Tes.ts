import { Logger } from "@src/utils/logger";
import {
  deSerializeCommitment,
  serializeCommitment,
} from "@src/utils/vault/metadata";
import {
  type Address,
  encodeAbiParameters,
  type Hash,
  type Hex,
  parseAbiParameters,
} from "viem";
import { catchService } from "@src/services/core/catch.service";
import { backOff } from "exponential-backoff";
import type { MemoryQueue } from "@src/services/core/queue";
import type { SignedMetaTransaction } from "@src/utils/metatx";
import type { AxiosInstance } from "axios";
import type { ViewAccount } from "@src/services/Account";

export const AUTH_TOKEN_ABI = parseAbiParameters(
  "address viewAddr,bytes challengeSignature, address ownerAddr,bytes ownerAccDelegationSignature",
);

const backoffOptions = {
  numOfAttempts: 3,
};

export class Tes {
  constructor(
    public readonly tesUrl: string,
    public readonly viewAccount: ViewAccount,
    private readonly memoryQueue: MemoryQueue,
    private readonly axios: AxiosInstance,
  ) {}

  private timeout = 0;
  private logger = new Logger(Tes.name);
  private csrf: string = "";

  private async challenge(mainAccountAddress: Address) {
    const {
      data: { random },
    } = await this.axios.get<{
      random: Hex;
    }>(
      `${this.tesUrl}/challenge/init/${this.viewAccount.getViewAccount()!.address}`,
    );
    const authToken = await this.getAuthToken(random, mainAccountAddress);
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
    return this.viewAccount.getViewAccount()!.signMessage({
      message: {
        raw: random,
      },
    });
  }

  private async getAuthToken(random: Hex, mainAccountAddress: Address) {
    const token = encodeAbiParameters(AUTH_TOKEN_ABI, [
      this.viewAccount.getViewAccount()!.address,
      await this.signChallenge(random),
      mainAccountAddress,
      this.viewAccount.getDelegationSignature()!,
    ]);
    return token;
  }

  private async manageAuth(mainAccountAddress: Address) {
    const [error] = await this.memoryQueue.schedule(
      Tes.name,
      async () => {
        if (this.timeout < Date.now() || !this.csrf) {
          await this.challenge(mainAccountAddress);
        }
      },
      "manageAuth",
      2000,
    );
    if (error) {
      throw error;
    }
  }

  getTrustedEncryptionToken(mainAccountAddress: Address) {
    return backOff(async () => {
      await this.manageAuth(mainAccountAddress);
      const { data } = await this.axios.get<{
        tepk: Hex;
      }>(`${this.tesUrl}/encryption/tepk`);
      return data.tepk;
    }, backoffOptions);
  }

  decrypt(
    block: string,
    token: Address,
    poseidonHash: string,
    mainAccountAddress: Address,
  ) {
    return backOff(async () => {
      await this.manageAuth(mainAccountAddress);

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

  async syncWithTes(
    mainAccountAddress: Address,
    token: Address,
    fromBlock: string,
    toBlock: string,
  ) {
    try {
      const result = await backOff(async () => {
        await this.manageAuth(mainAccountAddress);

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
          `${this.tesUrl}/indexer?owner=${mainAccountAddress}&token=${token}&fromBlock=${fromBlock}&toBlock=${toBlock}`,
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

  async quote(token: Address, mainAccountAddress: Address) {
    return backOff(async () => {
      await this.manageAuth(mainAccountAddress);
      const { data } = await this.axios.get<{
        gasPrice: string;
        paymasterAddress: Address;
        sponsoredVaultMethods: ("deposit" | "withdraw" | "spend")[];
      }>(`${this.tesUrl}/paymaster/quote/${token}`, {
        headers: {
          "x-custom-tes-csrf": this.csrf,
        },
        withCredentials: true,
      });

      return {
        gasPrice: BigInt(data.gasPrice),
        paymasterAddress: data.paymasterAddress,
        sponsoredVaultMethods: data.sponsoredVaultMethods,
      };
    }, backoffOptions);
  }

  async executeMetaTransactions(
    metatxs: SignedMetaTransaction[],
    coveredGas: string,
    mainAccountAddress: Address,
  ) {
    await backOff(() => this.manageAuth(mainAccountAddress), backoffOptions);
    await this.axios.post(
      `${this.tesUrl}/paymaster/execute`,
      {
        metatxs,
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
  }

  async getUserPublicKey(user: Address) {
    return backOff(async () => {
      const { data } = await this.axios.get<{
        publicKey: Hex | null;
      }>(`${this.tesUrl}/userMetadata/publicKey/${user}`);
      return data.publicKey;
    }, backoffOptions);
  }

  async getDecoyRecipient(amount = 1) {
    return backOff(async () => {
      const { data } = await this.axios.get<{
        publicKey: Hex;
        address: Address;
      } | null>(`${this.tesUrl}/userMetadata/decoyRecipient?amount=${amount}`);
      return data;
    }, backoffOptions);
  }

  reset() {
    this.timeout = 0;
    this.csrf = "";
  }
}
