import { JsonRpcErrorResponse, JsonRpcSuccessResponse } from "./dto";

export type ServiceClient<Service> = {
  [MethodName in keyof Service]: Service[MethodName] extends (
    params: infer Params,
    headers?: object,
  ) => infer ReturnType
    ? (params: Params, headers?: object) => ReturnType
    : never;
};

export type JsonRpcResponse<T> =
  | JsonRpcSuccessResponse<T>
  | JsonRpcErrorResponse;
