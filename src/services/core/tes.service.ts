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
  "address authAddress,bytes authSignature,address ownerAddress,bytes delegationSignature",
);

export default class TesService {
  constructor(
    public readonly tesUrl: string,
    public readonly accountService: AccountService,
    private readonly memoryQueue: MemoryQueue,
  ) {
    this.viewAccount = this.accountService.getViewAccount()!;
    this.mainAccount = this.accountService.getMainAccount()!;
    this.delegationSignature = this.accountService.getDelegationSignature()!;
  }

  private authToken?: Hex;
  private timeout = 0;
  private logger = new Logger(TesService.name);
  private viewAccount: NonNullable<
    ReturnType<AccountService["getViewAccount"]>
  >;
  private mainAccount: NonNullable<
    ReturnType<AccountService["getMainAccount"]>
  >;
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
      this.mainAccount.address,
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
