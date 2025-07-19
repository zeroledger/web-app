import { Logger } from "@src/utils/logger";
import { deSerializeCommitment } from "@src/utils/vault/metadata";
import { Address, encodeAbiParameters, Hex, parseAbiParameters } from "viem";
import { AccountService } from "../ledger";
import { MemoryQueue } from "@src/services/core/queue";

interface ChallengeResponse {
  random: Hex;
  expiration: number;
}

interface TepkResponse {
  tepk: Hex;
}

const AUTH_TOKEN_ABI = parseAbiParameters(
  "address userAddress,bytes signature",
);

export default class TesService {
  constructor(
    public readonly tesUrl: string,
    public readonly accountService: AccountService,
    private readonly memoryQueue: MemoryQueue,
  ) {
    this.account = this.accountService.getAccount()!;
  }

  private authToken: Hex | undefined;
  private timeout = 0;
  private logger = new Logger(TesService.name);
  private account: NonNullable<ReturnType<AccountService["getAccount"]>>;

  private async challenge() {
    this.logger.log("Run challenge for tes auth");
    const response = await fetch(
      `${this.tesUrl}/challenge/${this.account.address}`,
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
    return this.account.signMessage({
      message: random,
    });
  }

  async getAuthToken(random: Hex) {
    const signature = await this.signChallenge(random);
    const token = encodeAbiParameters(AUTH_TOKEN_ABI, [
      this.account.address,
      signature,
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

  async decrypt(encryptedCommitment: Hex, token: Address) {
    await this.manageAuth();

    const requestData = {
      encryptedCommitments: [encryptedCommitment],
      token,
    };

    const response = await fetch(`${this.tesUrl}/encryption/decrypt`, {
      method: "POST",
      headers: this.setAccessToken(
        new Headers({ "Content-Type": "application/json" }),
      ),
      body: JSON.stringify(requestData),
    });

    return deSerializeCommitment(
      (await response.json()).decryptedCommitments[0],
    );
  }

  reset() {
    delete this.authToken;
    this.timeout = 0;
  }
}
