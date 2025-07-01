export const JsonRpcExceptionCodes = {
  /**
   * Json Rpc 2.0 standard errors
   */
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  /**
   * Custom errors
   */
  CHANNEL_NOT_FOUND: -32001,
  WRONG_CHANNEL_OWNER: -32002,
  CHANNEL_ALREADY_CREATED: -32003,
  WRONG_CHANNEL_STATUS: -32004,
  BLOCKCHAIN_ERROR: -32005,
  SECRET_NOT_FOUND: -32006,
  ROUTE_NOT_FOUND: -32007,
  ENCRYPTION_KEY_NOT_FOUND: -32008,
  FAILED_INSTRUCTION_PROCESSING: -32009,
  INVALID_NONCE: -32010,
  WRONG_OPEN_OP_OWNER: -32011,
  UNAVAILABLE_ROUTE: -32012,
} as const;

export class JsonRpcException extends Error {
  /**
   * Create a new RPC exception
   *
   * @param message The error message
   * @param code The error code (Defaults to JsonRpcExceptionCodes.INVALID_REQUEST: -32600)
   * @param data Any additional data that should be passed to the client
   */
  constructor(
    public readonly message: string,
    public readonly code: number | string = -32600,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly data?: any,
  ) {
    super(message);
  }

  get response() {
    return {
      message: this.message,
      code: this.code,
      data: this.data,
    };
  }
}

export class JsonRpcSuccessResponse<T> {
  public readonly jsonrpc = "2.0" as const;

  constructor(
    public readonly id: string | number,
    public readonly result: T,
  ) {}
}

export class JsonRpcErrorResponse {
  public readonly jsonrpc = "2.0" as const;

  constructor(
    public readonly id: string | number | null,
    public readonly error: {
      message: string;
      code: number | string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data?: any;
    },
  ) {}
}

export class JsonRpcRequest<Method extends string, Params> {
  public readonly jsonrpc = "2.0" as const;
  constructor(
    public readonly id: string | number,
    public readonly method: Method,
    public readonly params: Params,
  ) {}
}
