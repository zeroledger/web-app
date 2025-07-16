import {
  encodeAbiParameters,
  Hex,
  parseAbiParameters,
  PrivateKeyAccount,
} from "viem";

interface ChallengeResponse {
  random: Hex;
  timeout: number;
}

interface TepkResponse {
  tepk: Hex;
}

const AUTH_TOKEN_ABI = parseAbiParameters(
  "address userAddress,bytes signature",
);

export default class TesService {
  constructor(
    private readonly tesUrl: string,
    private readonly account: PrivateKeyAccount,
  ) {}

  private authToken: Hex | undefined;
  private timeout = 0;

  private async challenge() {
    const response = await fetch(
      `${this.tesUrl}/challenge/${this.account.address}`,
    );
    const { random, timeout } = (await response.json()) as ChallengeResponse;
    this.authToken = await this.getAuthToken(random);
    this.timeout = timeout;
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

  private getHeaders(headers: object = {}) {
    return {
      Cookie: `access_token=${this.authToken}`,
      ...headers,
    };
  }

  async getTrustedEncryptionToken() {
    if (!this.authToken || this.timeout < Date.now()) {
      await this.challenge();
    }
    const response = await fetch(`${this.tesUrl}/encryption/tepk`, {
      headers: this.getHeaders(),
    });
    const { tepk } = (await response.json()) as TepkResponse;
    return tepk;
  }
}
