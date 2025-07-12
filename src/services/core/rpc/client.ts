import type { JsonRpcResponse, ServiceClient } from "./types";
import { randomBytes } from "@noble/hashes/utils";
import { Address, toHex } from "viem";
import type { Axios } from "axios";
import { JsonRpcErrorResponse, JsonRpcException } from "./dto";

const serializeResponse = <T>(
  response: JsonRpcResponse<T> | JsonRpcErrorResponse,
) => {
  if ("error" in response) {
    throw new JsonRpcException(
      response.error.message,
      response.error.code,
      response.error.data,
    );
  }

  return response.result;
};

export class JsonRpcClient<SvcInterface> {
  static version = "2.0";

  private requestCounter: number = 0;

  constructor(
    private readonly axios: Axios,
    private readonly clientId: Address = toHex(randomBytes(32)),
  ) {}

  getService(
    url: string,
    options: {
      namespace?: string;
      headers?: object;
    } = {
      namespace: "main",
      headers: {},
    },
  ): ServiceClient<SvcInterface> {
    const axios = this.axios;
    const genId = () =>
      `poc-web-client-${this.clientId}_${++this.requestCounter}`;
    return new Proxy(
      {},
      {
        get(_obj, prop) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return async function (params: any, headers?: object) {
            const method = `${options.namespace}.${prop.toString()}`;
            const { data } = await axios.post<JsonRpcResponse<unknown>>(
              `${url}/rpc`,
              {
                method,
                params,
                jsonrpc: JsonRpcClient.version,
                id: genId(),
              },
              {
                headers: { ...options.headers, ...headers },
              },
            );

            return serializeResponse(data);
          };
        },
      },
    ) as ServiceClient<SvcInterface>;
  }
}
